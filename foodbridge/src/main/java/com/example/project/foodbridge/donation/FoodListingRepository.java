package com.example.project.foodbridge.donation;

import com.example.project.foodbridge.donation.model.FoodListing;
import com.example.project.foodbridge.donation.model.FoodStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface FoodListingRepository extends JpaRepository<FoodListing, UUID> {
    List<FoodListing> findByStatus(FoodStatus status);

    // Add this right below your findByStatus method
    List<FoodListing> findByDonor_Email(String email);

    // ---> NEW: POSTGIS RADIUS QUERY <---
    @Query(value = "SELECT * FROM food_listings WHERE status = 'AVAILABLE' AND " +
            "ST_DWithin(location\\:\\:geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)\\:\\:geography, :radiusInMeters)",
            nativeQuery = true)
    List<FoodListing> findAvailableFoodWithinRadius(
            @Param("lat") double lat,
            @Param("lon") double lon,
            @Param("radiusInMeters") double radiusInMeters
    );
}
