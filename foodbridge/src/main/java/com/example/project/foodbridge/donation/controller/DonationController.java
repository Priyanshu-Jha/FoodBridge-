package com.example.project.foodbridge.donation.controller;

import com.example.project.foodbridge.donation.FoodListingRepository;
import com.example.project.foodbridge.donation.dto.CreateFoodRequest;
import com.example.project.foodbridge.donation.dto.FoodResponse;
import com.example.project.foodbridge.donation.dto.HandoffQrResponse;
import com.example.project.foodbridge.donation.dto.VerifyHandoffRequest;
import com.example.project.foodbridge.donation.dto.VerifyHandoffResponse;
import com.example.project.foodbridge.donation.event.DonationCreatedEvent;
import com.example.project.foodbridge.donation.model.FoodListing;
import com.example.project.foodbridge.donation.model.FoodStatus;
import com.example.project.foodbridge.user.dto.NearbyNgoResponse;
import com.example.project.foodbridge.user.model.Role;
import com.example.project.foodbridge.user.model.User;
import com.example.project.foodbridge.user.repository.NearbyNgoProjection;
import com.example.project.foodbridge.user.repository.UserRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.concurrent.ThreadLocalRandom;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/donations")
public class DonationController {
    private final FoodListingRepository foodRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    public DonationController(
            FoodListingRepository foodListingRepository,
            UserRepository userRepository,
            ApplicationEventPublisher eventPublisher,
            ObjectMapper objectMapper) {
        this.foodRepository = foodListingRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<?> createListing(@RequestBody CreateFoodRequest request) {
        // find out whic is currently login in usinf jwt tolen
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User donor = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found."));

        if (!donor.getRole().name().equals("DONOR")) {
            return ResponseEntity.status(403).body("Only Donors can create listings.");
        }

        // Create new food entity
        FoodListing food = new FoodListing();
        food.setDescription(request.getDescription());
        food.setQuantity(request.getQuantity());
        food.setDonor(donor);

        if (request.getExpiresAt() != null && !request.getExpiresAt().isAfter(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Expiry time must be in the future.");
        }
        food.setExpiresAt(request.getExpiresAt());

        if (hasPartialCoordinates(request)) {
            return ResponseEntity.badRequest().body("Please provide both latitude and longitude together.");
        }

        // Use request coordinates when provided, otherwise reuse donor's saved
        // location.
        if (hasBothCoordinates(request)) {
            food.setLocation(buildPoint(request.getLatitude(), request.getLongitude()));
        } else if (donor.getLocation() != null) {
            food.setLocation(donor.getLocation());
        }

        // Save to db
        FoodListing savedFood;
        try {
            savedFood = foodRepository.saveAndFlush(food);
        } catch (OptimisticLockingFailureException ex) {
            return ResponseEntity.status(409)
                    .body("This food was just claimed by another NGO. Please refresh and try a different listing.");
        }

        // Day 18: trigger matching workflow for nearby NGOs
        eventPublisher.publishEvent(new DonationCreatedEvent(savedFood.getId()));

        FoodResponse response = toFoodResponse(savedFood);
        return ResponseEntity.ok(response);
    }

    // Endpint for Ngo to see all the available foor
    @GetMapping("/available")
    public ResponseEntity<List<FoodResponse>> getAvailableFood(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(defaultValue = "5000") Double radius) {
        purgeExpiredListings();

        // Step A: Query the database for food with status "AVAILABLE"
        List<FoodListing> availableFood;

        if (lat != null && lon != null) {
            availableFood = foodRepository.findAvailableFoodWithinRadius(lat, lon, radius);
        } else {
            availableFood = foodRepository.findByStatus(FoodStatus.AVAILABLE);
        }

        // Step B: Convert the List of Entities into a List of clean DTOs
        List<FoodResponse> responseList = availableFood.stream()
                .map(this::toFoodResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    // 3. Endpoint for a Donor to see their own history
    @GetMapping("/me")
    public ResponseEntity<List<FoodResponse>> getMyDonations() {
        purgeExpiredListings();

        // Find who is logged in
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        // Fetch only their food
        List<FoodListing> myFood = foodRepository.findByDonor_Email(currentUserEmail);

        // Convert to DTOs
        List<FoodResponse> responseList = myFood.stream()
                .map(this::toFoodResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    // Day 25: Endpoint for NGO to see currently claimed pickups
    @GetMapping("/claimed-by-me")
    public ResponseEntity<?> getMyClaimedDonations() {
        purgeExpiredListings();

        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found."));

        if (currentUser.getRole() != Role.NGO) {
            return ResponseEntity.status(403).body("Only NGOs can access claimed pickups.");
        }

        List<FoodListing> claimedFood = foodRepository.findByClaimedBy_EmailAndStatus(currentUserEmail,
                FoodStatus.CLAIMED);
        List<FoodResponse> responseList = claimedFood.stream()
                .map(this::toFoodResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/completed-by-me")
    public ResponseEntity<?> getMyCompletedDonations() {
        purgeExpiredListings();

        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found."));

        if (currentUser.getRole() != Role.NGO) {
            return ResponseEntity.status(403).body("Only NGOs can access completed pickups.");
        }

        List<FoodListing> completedFood = foodRepository.findByClaimedBy_EmailAndStatus(currentUserEmail,
                FoodStatus.COMPLETED);

        List<FoodResponse> responseList = completedFood.stream()
                .map(this::toFoodResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    // Endpoint to get a specific food listing by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getFoodById(@PathVariable UUID id) {
        purgeExpiredListings();

        FoodListing food = foodRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Food listing not found."));

        return ResponseEntity.ok(toFoodResponse(food));
    }

    // Day 16: Find NGOs near a specific donation location
    @GetMapping("/{id}/nearby-ngos")
    public ResponseEntity<?> getNearbyNgos(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "5") Double radiusKm) {
        if (radiusKm == null || radiusKm <= 0) {
            return ResponseEntity.badRequest().body("radiusKm must be greater than 0.");
        }

        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found."));

        FoodListing food = foodRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Food listing not found."));

        // Only the donor who created the listing or an admin can request nearby NGOs.
        boolean isOwner = food.getDonor().getEmail().equals(currentUserEmail);
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            return ResponseEntity.status(403).body("You are not authorized to access nearby NGOs for this listing.");
        }

        if (food.getLocation() == null) {
            return ResponseEntity.badRequest().body("This listing has no coordinates. Save location first.");
        }

        double radiusMeters = radiusKm * 1000.0;
        List<NearbyNgoProjection> nearbyNgos = userRepository.findNearbyNgosForDonation(id, radiusMeters);

        List<NearbyNgoResponse> responseList = nearbyNgos.stream()
                .map(ngo -> new NearbyNgoResponse(
                        ngo.getId(),
                        ngo.getOrganizationName(),
                        ngo.getContactNumber(),
                        ngo.getEmail(),
                        ngo.getLatitude(),
                        ngo.getLongitude(),
                        ngo.getDistanceMeters()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    // 4. Endpoint for an NGO to claim available food
    @PutMapping("/{id}/claim")
    public ResponseEntity<?> claimFood(@PathVariable UUID id) {
        purgeExpiredListings();

        // Step A: Find the logged-in NGO
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User ngo = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found."));

        if (!ngo.getRole().name().equals("NGO")) {
            return ResponseEntity.status(403).body("Only NGOs can claim food.");
        }

        // Step B: Find the requested food in the database
        FoodListing food = foodRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Food listing not found."));

        // Step C: Critical Security Check - Is it actually available?
        if (food.getStatus() != FoodStatus.AVAILABLE) {
            return ResponseEntity.badRequest().body("This food has already been claimed or cancelled.");
        }

        if (isExpired(food)) {
            foodRepository.deleteNotificationsByFoodListingId(food.getId());
            foodRepository.deleteById(food.getId());
            return ResponseEntity.badRequest().body("This listing expired and was removed.");
        }

        // Step D: Update the food record
        food.setStatus(FoodStatus.CLAIMED);
        food.setClaimedBy(ngo); // Link the NGO to the food!
        food.setClaimedAt(LocalDateTime.now());
        food.setPickupOutAt(null);
        food.setReceivedAt(null);
        food.setCompletedAt(null);
        if (food.getHandoffPin() == null || food.getHandoffToken() == null) {
            food.setHandoffPin(generateHandoffPin());
            food.setHandoffToken(UUID.randomUUID().toString());
        }

        // Step E: Save the changes
        FoodListing savedFood = foodRepository.save(food);

        // Step F: Return success
        return ResponseEntity.ok(toFoodResponse(savedFood));
    }

    @PutMapping("/{id}/pickup-out")
    public ResponseEntity<?> markPickupOut(@PathVariable UUID id) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User ngo = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found."));

        if (ngo.getRole() != Role.NGO) {
            return ResponseEntity.status(403).body("Only NGOs can update pickup phase.");
        }

        FoodListing food = foodRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Food listing not found."));

        if (food.getClaimedBy() == null || !currentUserEmail.equals(food.getClaimedBy().getEmail())) {
            return ResponseEntity.status(403).body("You are not authorized to update this pickup.");
        }

        if (food.getStatus() != FoodStatus.CLAIMED) {
            return ResponseEntity.badRequest().body("Only CLAIMED donations can move to pickup-out phase.");
        }

        if (food.getPickupOutAt() == null) {
            food.setPickupOutAt(LocalDateTime.now());
            food = foodRepository.save(food);
        }

        return ResponseEntity.ok(toFoodResponse(food));
    }

    @PutMapping("/{id}/received")
    public ResponseEntity<?> markReceived(@PathVariable UUID id) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User ngo = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found."));

        if (ngo.getRole() != Role.NGO) {
            return ResponseEntity.status(403).body("Only NGOs can update receive phase.");
        }

        FoodListing food = foodRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Food listing not found."));

        if (food.getClaimedBy() == null || !currentUserEmail.equals(food.getClaimedBy().getEmail())) {
            return ResponseEntity.status(403).body("You are not authorized to update this pickup.");
        }

        if (food.getStatus() != FoodStatus.CLAIMED) {
            return ResponseEntity.badRequest().body("Only CLAIMED donations can move to received phase.");
        }

        if (food.getPickupOutAt() == null) {
            return ResponseEntity.badRequest().body("Mark pickup-out first before marking as received.");
        }

        if (food.getReceivedAt() == null) {
            food.setReceivedAt(LocalDateTime.now());
            food = foodRepository.save(food);
        }

        return ResponseEntity.ok(toFoodResponse(food));
    }

    // Day 24: Donor gets secure QR payload after claim
    @GetMapping("/{id}/handoff-qr")
    public ResponseEntity<?> getHandoffQr(@PathVariable UUID id) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        FoodListing food = foodRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Food listing not found."));

        if (!food.getDonor().getEmail().equals(currentUserEmail)) {
            return ResponseEntity.status(403).body("You are not authorized to access this handoff QR.");
        }

        if (food.getStatus() != FoodStatus.CLAIMED) {
            return ResponseEntity.badRequest().body("Handoff QR is available only when a donation is CLAIMED.");
        }

        if (food.getHandoffPin() == null || food.getHandoffToken() == null) {
            food.setHandoffPin(generateHandoffPin());
            food.setHandoffToken(UUID.randomUUID().toString());
            food = foodRepository.save(food);
        }

        String payload = buildHandoffQrPayload(food);
        HandoffQrResponse response = new HandoffQrResponse(food.getId(), food.getHandoffPin(), payload);
        return ResponseEntity.ok(response);
    }

    // Day 25: NGO verifies handoff via scanned QR payload or backup PIN
    @Transactional
    @PutMapping("/{id}/handoff-verify")
    public ResponseEntity<?> verifyHandoff(
            @PathVariable UUID id,
            @RequestBody(required = false) VerifyHandoffRequest request) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found."));

        if (currentUser.getRole() != Role.NGO) {
            return ResponseEntity.status(403).body("Only NGOs can verify handoff.");
        }

        FoodListing food = foodRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Food listing not found."));

        if (food.getClaimedBy() == null || !food.getClaimedBy().getEmail().equals(currentUserEmail)) {
            return ResponseEntity.status(403).body("You are not authorized to verify this handoff.");
        }

        if (food.getStatus() == FoodStatus.COMPLETED) {
            return ResponseEntity.badRequest().body("This donation is already completed.");
        }

        if (food.getStatus() != FoodStatus.CLAIMED) {
            return ResponseEntity.badRequest().body("Handoff can only be verified for CLAIMED donations.");
        }

        if (food.getPickupOutAt() == null || food.getReceivedAt() == null) {
            return ResponseEntity.badRequest()
                    .body("Complete pickup phases first: mark pickup-out and received before final verification.");
        }

        if (request == null ||
                (isBlank(request.getQrPayload()) && isBlank(request.getHandoffPin()))) {
            return ResponseEntity.badRequest().body("Provide either qrPayload or handoffPin for verification.");
        }

        boolean qrVerified = !isBlank(request.getQrPayload()) && verifyQrPayload(food, request.getQrPayload());
        boolean pinVerified = !isBlank(request.getHandoffPin())
                && request.getHandoffPin().trim().equals(food.getHandoffPin());

        if (!qrVerified && !pinVerified) {
            return ResponseEntity.badRequest().body("Verification failed. Invalid QR payload or PIN.");
        }

        int updatedRows = foodRepository.completeClaimedListingAfterVerification(
                food.getId(),
                currentUserEmail,
                FoodStatus.CLAIMED,
                FoodStatus.COMPLETED);
        if (updatedRows == 0) {
            return ResponseEntity.status(409)
                    .body("Donation state changed during verification. Please refresh and try again.");
        }

        String method = qrVerified ? "QR" : "PIN";
        VerifyHandoffResponse response = new VerifyHandoffResponse(
                food.getId(),
                true,
                method,
                "Handoff verified successfully. Donation marked as COMPLETED.");
        return ResponseEntity.ok(response);
    }

    // 5. Endpoint for a Donor to mark a handoff as completed
    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeDonation(@PathVariable UUID id) {
        // Step A: Find the logged-in user
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        // Step B: Find the food record
        FoodListing food = foodRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Food listing not found."));

        // Step C: CRITICAL SECURITY CHECK - Data Ownership
        if (!food.getDonor().getEmail().equals(currentUserEmail)) {
            return ResponseEntity.status(403).body("You are not authorized to modify this listing.");
        }

        // Step D: State Validation
        if (food.getStatus() == FoodStatus.COMPLETED) {
            return ResponseEntity.ok(toFoodResponse(food));
        }

        if (food.getStatus() != FoodStatus.CLAIMED) {
            return ResponseEntity.badRequest().body("Only claimed food can be marked as completed.");
        }

        return ResponseEntity.badRequest().body("Use NGO handoff verification to complete this donation.");
    }

    // 6. Endpoint for a Donor to Delete a food listing
    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteListing(@PathVariable UUID id) {
        // Step A: Find the logged-in user
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        // Step B: Handle 404 first
        if (!foodRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        // Step C: Security Check - Data Ownership
        if (!foodRepository.existsByIdAndDonor_Email(id, currentUserEmail)) {
            return ResponseEntity.status(403).body("You are not authorized to delete this listing.");
        }

        // Step D: Remove dependent notifications first to satisfy FK constraints
        foodRepository.deleteNotificationsByFoodListingId(id);

        // Step E: Atomic delete only when listing is still AVAILABLE
        int deletedRows = foodRepository.deleteOwnedListingByIdAndStatus(id, currentUserEmail, FoodStatus.AVAILABLE);
        if (deletedRows == 0) {
            return ResponseEntity.badRequest().body("You can only delete food that is still AVAILABLE.");
        }

        return ResponseEntity.ok("Listing deleted successfully.");
    }

    // 7. Endpoint for a Donor to Update a food listing (Fix typos, change quantity)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateListing(@PathVariable UUID id, @RequestBody CreateFoodRequest request) {
        purgeExpiredListings();

        // Step A: Find the logged-in user
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        // Step B: Find the food record
        FoodListing food = foodRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Food listing not found."));

        // Step C: Security Check - Data Ownership
        if (!food.getDonor().getEmail().equals(currentUserEmail)) {
            return ResponseEntity.status(403).body("You are not authorized to update this listing.");
        }

        // Step D: State Validation - Don't let them change the quantity if an NGO is
        // already driving to get it!
        if (food.getStatus() != FoodStatus.AVAILABLE) {
            return ResponseEntity.badRequest().body("You can only edit food that is currently AVAILABLE.");
        }

        // Step E: Update the basic fields
        food.setDescription(request.getDescription());
        food.setQuantity(request.getQuantity());

        if (request.getExpiresAt() != null && !request.getExpiresAt().isAfter(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Expiry time must be in the future.");
        }
        food.setExpiresAt(request.getExpiresAt());

        if (hasPartialCoordinates(request)) {
            return ResponseEntity.badRequest().body("Please provide both latitude and longitude together.");
        }

        // Step F: Update location if they moved
        if (hasBothCoordinates(request)) {
            food.setLocation(buildPoint(request.getLatitude(), request.getLongitude()));
        }

        // Step G: Save to database
        FoodListing savedFood = foodRepository.save(food);

        return ResponseEntity.ok(toFoodResponse(savedFood));
    }

    private String generateHandoffPin() {
        int pin = ThreadLocalRandom.current().nextInt(0, 10000);
        return String.format("%04d", pin);
    }

    private String buildHandoffQrPayload(FoodListing food) {
        return "{\"type\":\"FOODBRIDGE_HANDOFF\",\"donationId\":\""
                + food.getId()
                + "\",\"handoffToken\":\""
                + food.getHandoffToken()
                + "\",\"handoffPin\":\""
                + food.getHandoffPin()
                + "\"}";
    }

    private boolean verifyQrPayload(FoodListing food, String qrPayload) {
        try {
            JsonNode root = objectMapper.readTree(qrPayload);
            String type = root.path("type").asText(null);
            String donationId = root.path("donationId").asText(null);
            String handoffToken = root.path("handoffToken").asText(null);

            if (!"FOODBRIDGE_HANDOFF".equals(type)) {
                return false;
            }

            if (donationId == null || !food.getId().toString().equals(donationId)) {
                return false;
            }

            return handoffToken != null && handoffToken.equals(food.getHandoffToken());
        } catch (Exception ex) {
            return false;
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void purgeExpiredListings() {
        foodRepository.deleteNotificationsForExpiredListings();
        foodRepository.deleteExpiredListingsByStatuses(List.of(FoodStatus.AVAILABLE, FoodStatus.EXPIRED));
    }

    private boolean isExpired(FoodListing food) {
        return food.getExpiresAt() != null && !food.getExpiresAt().isAfter(LocalDateTime.now());
    }

    private FoodResponse toFoodResponse(FoodListing food) {
        return new FoodResponse(
                food.getId(),
                food.getDescription(),
                food.getQuantity(),
                food.getStatus().name(),
                food.getDonor() != null ? food.getDonor().getOrganizationName() : null,
                food.getClaimedBy() != null ? food.getClaimedBy().getOrganizationName() : null,
                food.getLocation() != null ? food.getLocation().getY() : null,
                food.getLocation() != null ? food.getLocation().getX() : null,
                food.getExpiresAt(),
                food.getCreatedAt(),
                food.getClaimedAt(),
                food.getPickupOutAt(),
                food.getReceivedAt(),
                food.getCompletedAt());
    }

    private boolean hasBothCoordinates(CreateFoodRequest request) {
        return request.getLatitude() != null && request.getLongitude() != null;
    }

    private boolean hasPartialCoordinates(CreateFoodRequest request) {
        return (request.getLatitude() == null) != (request.getLongitude() == null);
    }

    private Point buildPoint(Double latitude, Double longitude) {
        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        return geometryFactory.createPoint(new Coordinate(longitude, latitude));
    }
}
