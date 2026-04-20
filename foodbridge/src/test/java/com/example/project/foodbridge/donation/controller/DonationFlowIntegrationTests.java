package com.example.project.foodbridge.donation.controller;

import com.example.project.foodbridge.donation.FoodListingRepository;
import com.example.project.foodbridge.donation.model.FoodListing;
import com.example.project.foodbridge.donation.model.FoodStatus;
import com.example.project.foodbridge.notification.repository.NotificationRepository;
import com.example.project.foodbridge.security.JwtService;
import com.example.project.foodbridge.user.model.Role;
import com.example.project.foodbridge.user.model.User;
import com.example.project.foodbridge.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DonationFlowIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FoodListingRepository foodListingRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private JwtService jwtService;

    @BeforeEach
    void cleanDatabase() {
        notificationRepository.deleteAllInBatch();
        foodListingRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    @Test
    void donorCanFetchHandoffQrAfterNgoClaim() throws Exception {
        User donor = createUser("donor.qr@test.local", Role.DONOR);
        User ngo = createUser("ngo.qr@test.local", Role.NGO);
        FoodListing listing = createAvailableListing(donor, "QR Flow Listing");

        mockMvc.perform(put("/api/donations/{id}/claim", listing.getId())
                .header(HttpHeaders.AUTHORIZATION, bearerToken(ngo))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/donations/{id}/handoff-qr", listing.getId())
                .header(HttpHeaders.AUTHORIZATION, bearerToken(donor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.donationId").value(listing.getId().toString()))
                .andExpect(jsonPath("$.handoffPin").isString())
                .andExpect(jsonPath("$.payload").isString());
    }

    @Test
    void verifyHandoffMarksDonationCompletedAndClearsSecrets() throws Exception {
        User donor = createUser("donor.verify@test.local", Role.DONOR);
        User ngo = createUser("ngo.verify@test.local", Role.NGO);
        FoodListing listing = createAvailableListing(donor, "Verify Flow Listing");

        mockMvc.perform(put("/api/donations/{id}/claim", listing.getId())
                .header(HttpHeaders.AUTHORIZATION, bearerToken(ngo))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        MvcResult qrResult = mockMvc.perform(get("/api/donations/{id}/handoff-qr", listing.getId())
                .header(HttpHeaders.AUTHORIZATION, bearerToken(donor)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode qrJson = objectMapper.readTree(qrResult.getResponse().getContentAsString());
        String handoffPin = qrJson.get("handoffPin").asText();

        mockMvc.perform(put("/api/donations/{id}/handoff-verify", listing.getId())
                .header(HttpHeaders.AUTHORIZATION, bearerToken(ngo))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"handoffPin\":\"" + handoffPin + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true))
                .andExpect(jsonPath("$.method").value("PIN"));

        FoodListing updated = foodListingRepository.findById(listing.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(FoodStatus.COMPLETED);
        assertThat(updated.getHandoffPin()).isNull();
        assertThat(updated.getHandoffToken()).isNull();
    }

    @Test
    void concurrentNgoClaimsAllowOnlyOneSuccess() throws Exception {
        User donor = createUser("donor.race@test.local", Role.DONOR);
        User ngoOne = createUser("ngo.one.race@test.local", Role.NGO);
        User ngoTwo = createUser("ngo.two.race@test.local", Role.NGO);
        FoodListing listing = createAvailableListing(donor, "Race Listing");

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        try {
            Callable<Integer> ngoOneClaim = buildClaimTask(listing.getId(), bearerToken(ngoOne), ready, start);
            Callable<Integer> ngoTwoClaim = buildClaimTask(listing.getId(), bearerToken(ngoTwo), ready, start);

            Future<Integer> first = executor.submit(ngoOneClaim);
            Future<Integer> second = executor.submit(ngoTwoClaim);

            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();

            int firstStatus = first.get(20, TimeUnit.SECONDS);
            int secondStatus = second.get(20, TimeUnit.SECONDS);

            List<Integer> statuses = List.of(firstStatus, secondStatus);
            assertThat(statuses.stream().filter(status -> status == 200).count()).isEqualTo(1);
            assertThat(statuses.stream().filter(status -> status == 400 || status == 409).count()).isEqualTo(1);

            FoodListing updated = foodListingRepository.findById(listing.getId()).orElseThrow();
            assertThat(updated.getStatus()).isEqualTo(FoodStatus.CLAIMED);
            assertThat(updated.getClaimedBy()).isNotNull();
            UUID winnerId = updated.getClaimedBy().getId();
            assertThat(winnerId).isIn(ngoOne.getId(), ngoTwo.getId());
        } finally {
            executor.shutdownNow();
        }
    }

    private Callable<Integer> buildClaimTask(UUID listingId, String bearerToken, CountDownLatch ready,
            CountDownLatch start) {
        return () -> {
            ready.countDown();
            if (!start.await(10, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Timed out waiting to start concurrent claim.");
            }

            return mockMvc.perform(put("/api/donations/{id}/claim", listingId)
                    .header(HttpHeaders.AUTHORIZATION, bearerToken)
                    .contentType(MediaType.APPLICATION_JSON))
                    .andReturn()
                    .getResponse()
                    .getStatus();
        };
    }

    private User createUser(String email, Role role) {
        User user = new User();
        user.setEmail(email);
        user.setPassword("encoded-password");
        user.setOrganizationName(role.name() + " Org");
        user.setContactNumber("1234567890");
        user.setRole(role);
        return userRepository.save(user);
    }

    private FoodListing createAvailableListing(User donor, String description) {
        FoodListing listing = new FoodListing();
        listing.setDescription(description);
        listing.setQuantity("10 boxes");
        listing.setStatus(FoodStatus.AVAILABLE);
        listing.setDonor(donor);
        return foodListingRepository.save(listing);
    }

    private String bearerToken(User user) {
        return "Bearer " + jwtService.generateToken(user);
    }
}
