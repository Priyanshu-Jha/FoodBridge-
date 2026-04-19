package com.example.project.foodbridge.donation.controller;

import com.example.project.foodbridge.donation.FoodListingRepository;
import com.example.project.foodbridge.donation.dto.CreateFoodRequest;
import com.example.project.foodbridge.donation.dto.FoodResponse;
import com.example.project.foodbridge.donation.model.FoodListing;
import com.example.project.foodbridge.donation.model.FoodStatus;
import com.example.project.foodbridge.user.model.User;
import com.example.project.foodbridge.user.repository.UserRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/donations")
public class DonationController {
    private final FoodListingRepository foodRepository;
    private final UserRepository userRepository;

    public DonationController(FoodListingRepository foodListingRepository, UserRepository userRepository) {
        this.foodRepository = foodListingRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<FoodResponse> createListing(@RequestBody CreateFoodRequest request) {
        // find out whic is currently login in usinf jwt tolen
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User donor = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException(" User not found"));


        // Create new food entity
        FoodListing food = new FoodListing();
        food.setDescription(request.getDescription());
        food.setQuantity(request.getQuantity());
        food.setDonor(donor);

        // ---> NEW: GIS GEOMETRY CREATION <---
        if (request.getLatitude() != null && request.getLongitude() != null) {
            GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
            // WARNING: Geographic systems always use (Longitude = X, Latitude = Y)
            Point location = geometryFactory.createPoint(new Coordinate(request.getLongitude(), request.getLatitude()));
            food.setLocation(location);
        }

        //  Save to db
        FoodListing savedFood = foodRepository.save(food);

        // Update the response to include the coordinates
        Double responseLat = savedFood.getLocation() != null ? savedFood.getLocation().getY() : null;
        Double responseLon = savedFood.getLocation() != null ? savedFood.getLocation().getX() : null;

        // Map to DTO and return
        FoodResponse response = new FoodResponse(
                savedFood.getId(),
                savedFood.getDescription(),
                savedFood.getQuantity(),
                savedFood.getStatus().name(),
                savedFood.getDonor().getOrganizationName(),
                responseLat,
                responseLon

        );
        return ResponseEntity.ok(response);
    }

    // Endpint for Ngo to see all the available foor
    @GetMapping("/available")
    public ResponseEntity<List<FoodResponse>> getAvailableFood(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(defaultValue = "5000") Double radius
    ) {
        // Step A: Query the database for food with status "AVAILABLE"
        List<FoodListing> availableFood;

        if (lat != null && lon != null) {
            availableFood = foodRepository.findAvailableFoodWithinRadius(lat, lon, radius);
        } else {
            availableFood = foodRepository.findByStatus(FoodStatus.AVAILABLE);
        }


        // Step B: Convert the List of Entities into a List of clean DTOs
        List<FoodResponse> responseList = availableFood.stream()
                .map(food -> {

                    return new FoodResponse(
                            food.getId(),
                            food.getDescription(),
                            food.getQuantity(),
                            food.getStatus().name(),
                            food.getDonor().getOrganizationName(),
                            food.getLocation() != null ? food.getLocation().getY() : null,
                            food.getLocation() != null ? food.getLocation().getX() : null
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    // 3. Endpoint for a Donor to see their own history
    @GetMapping("/me")
    public ResponseEntity<List<FoodResponse>> getMyDonations() {
        // Find who is logged in
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        // Fetch only their food
        List<FoodListing> myFood = foodRepository.findByDonor_Email(currentUserEmail);

        // Convert to DTOs
        List<FoodResponse> responseList = myFood.stream()
                .map(food -> new FoodResponse(
                        food.getId(),
                        food.getDescription(),
                        food.getQuantity(),
                        food.getStatus().name(),
                        food.getDonor().getOrganizationName(),
                        food.getLocation() != null ? food.getLocation().getY() : null,
                        food.getLocation() != null ? food.getLocation().getX() : null
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    // 4. Endpoint for an NGO to claim available food
    @PutMapping("/{id}/claim")
    public ResponseEntity<?> claimFood(@PathVariable UUID id) {
        // Step A: Find the logged-in NGO
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User ngo = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Step B: Find the requested food in the database
        FoodListing food = foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Food listing not found"));

        // Step C: Critical Security Check - Is it actually available?
        if (food.getStatus() != FoodStatus.AVAILABLE) {
            return ResponseEntity.badRequest().body("This food has already been claimed or cancelled.");
        }

        // Step D: Update the food record
        food.setStatus(FoodStatus.CLAIMED);
        food.setClaimedBy(ngo); // Link the NGO to the food!

        // Step E: Save the changes
        FoodListing savedFood = foodRepository.save(food);

        Double responseLat = savedFood.getLocation() != null ? savedFood.getLocation().getY() : null;
        Double responseLon = savedFood.getLocation() != null ? savedFood.getLocation().getX() : null;

        // Step F: Return success
        FoodResponse response = new FoodResponse(
                savedFood.getId(), savedFood.getDescription(), savedFood.getQuantity(),
                savedFood.getStatus().name(), savedFood.getDonor().getOrganizationName(),responseLat,responseLon
        );

        return ResponseEntity.ok(response);
    }

    // 5. Endpoint for a Donor to mark a handoff as completed
    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeDonation(@PathVariable UUID id) {
        // Step A: Find the logged-in user
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        // Step B: Find the food record
        FoodListing food = foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Food listing not found"));

        // Step C: CRITICAL SECURITY CHECK - Data Ownership
        if (!food.getDonor().getEmail().equals(currentUserEmail)) {
            return ResponseEntity.status(403).body("You are not authorized to modify this listing.");
        }

        // Step D: State Validation
        if (food.getStatus() != FoodStatus.CLAIMED) {
            return ResponseEntity.badRequest().body("Only claimed food can be marked as completed.");
        }

        // Step E: Update and Save
        food.setStatus(FoodStatus.COMPLETED);
        FoodListing savedFood = foodRepository.save(food);

        Double responseLat = savedFood.getLocation() != null ? savedFood.getLocation().getY() : null;
        Double responseLon = savedFood.getLocation() != null ? savedFood.getLocation().getX() : null;

        // Step F: Return success
        FoodResponse response = new FoodResponse(
                savedFood.getId(), savedFood.getDescription(), savedFood.getQuantity(),
                savedFood.getStatus().name(), savedFood.getDonor().getOrganizationName(),responseLat,responseLon
        );

        return ResponseEntity.ok(response);
    }
}
