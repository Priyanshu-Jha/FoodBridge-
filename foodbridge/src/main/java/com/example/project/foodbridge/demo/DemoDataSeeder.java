package com.example.project.foodbridge.demo;

import com.example.project.foodbridge.donation.FoodListingRepository;
import com.example.project.foodbridge.donation.model.FoodListing;
import com.example.project.foodbridge.donation.model.FoodStatus;
import com.example.project.foodbridge.user.model.Role;
import com.example.project.foodbridge.user.model.User;
import com.example.project.foodbridge.user.repository.UserRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Component
public class DemoDataSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final UserRepository userRepository;
    private final FoodListingRepository foodListingRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demo.seed-enabled:false}")
    private boolean seedEnabled;

    public DemoDataSeeder(UserRepository userRepository,
            FoodListingRepository foodListingRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.foodListingRepository = foodListingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            return;
        }

        if (userRepository.findByEmail("demo.donor1@foodbridge.local").isPresent()) {
            log.info("Day 28 demo seeding skipped: demo users already exist.");
            return;
        }

        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

        User donorOne = createUser(
                "demo.donor1@foodbridge.local",
                "Demo@123",
                "Sunrise Bakery",
                "9000000001",
                Role.DONOR,
                18.5204,
                73.8567,
                geometryFactory);

        User donorTwo = createUser(
                "demo.donor2@foodbridge.local",
                "Demo@123",
                "Green Bowl Restaurant",
                "9000000002",
                Role.DONOR,
                18.5331,
                73.8472,
                geometryFactory);

        User ngoOne = createUser(
                "demo.ngo1@foodbridge.local",
                "Demo@123",
                "Helping Hands NGO",
                "9000001001",
                Role.NGO,
                18.5270,
                73.8510,
                geometryFactory);

        User ngoTwo = createUser(
                "demo.ngo2@foodbridge.local",
                "Demo@123",
                "Food Rescue Trust",
                "9000001002",
                Role.NGO,
                18.5121,
                73.8398,
                geometryFactory);

        userRepository.saveAll(List.of(donorOne, donorTwo, ngoOne, ngoTwo));

        FoodListing availableOne = createDonation(
                "12 Sandwich Packs",
                "12 packs",
                donorOne,
                null,
                FoodStatus.AVAILABLE,
                18.5210,
                73.8580,
                null,
                null,
                geometryFactory);

        FoodListing availableTwo = createDonation(
                "Fresh Rice Meals",
                "20 boxes",
                donorTwo,
                null,
                FoodStatus.AVAILABLE,
                18.5340,
                73.8455,
                null,
                null,
                geometryFactory);

        FoodListing claimedOne = createDonation(
                "Mixed Veg Curry",
                "15 containers",
                donorOne,
                ngoOne,
                FoodStatus.CLAIMED,
                18.5190,
                73.8524,
                "6543",
                UUID.randomUUID().toString(),
                geometryFactory);

        FoodListing completedOne = createDonation(
                "Bread Loaves",
                "30 loaves",
                donorTwo,
                ngoTwo,
                FoodStatus.COMPLETED,
                18.5139,
                73.8412,
                null,
                null,
                geometryFactory);

        foodListingRepository.saveAll(List.of(availableOne, availableTwo, claimedOne, completedOne));

        log.info("Day 28 demo seed completed: 4 users and 4 demo donations created.");
        log.info("Demo login password for all seeded users: Demo@123");
    }

    private User createUser(
            String email,
            String rawPassword,
            String organizationName,
            String contactNumber,
            Role role,
            double latitude,
            double longitude,
            GeometryFactory geometryFactory) {
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setOrganizationName(organizationName);
        user.setContactNumber(contactNumber);
        user.setRole(role);
        user.setLocation(createPoint(latitude, longitude, geometryFactory));
        return user;
    }

    private FoodListing createDonation(
            String description,
            String quantity,
            User donor,
            User claimedBy,
            FoodStatus status,
            double latitude,
            double longitude,
            String handoffPin,
            String handoffToken,
            GeometryFactory geometryFactory) {
        FoodListing foodListing = new FoodListing();
        foodListing.setDescription(description);
        foodListing.setQuantity(quantity);
        foodListing.setDonor(donor);
        foodListing.setClaimedBy(claimedBy);
        foodListing.setStatus(status);
        foodListing.setLocation(createPoint(latitude, longitude, geometryFactory));
        foodListing.setHandoffPin(handoffPin);
        foodListing.setHandoffToken(handoffToken);
        return foodListing;
    }

    private Point createPoint(double latitude, double longitude, GeometryFactory geometryFactory) {
        return geometryFactory.createPoint(new Coordinate(longitude, latitude));
    }
}
