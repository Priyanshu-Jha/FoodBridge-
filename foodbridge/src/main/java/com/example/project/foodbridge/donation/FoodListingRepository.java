package com.example.project.foodbridge.donation;

import com.example.project.foodbridge.donation.model.FoodListing;
import com.example.project.foodbridge.donation.model.FoodStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FoodListingRepository extends JpaRepository<FoodListing, UUID> {
        List<FoodListing> findByStatus(FoodStatus status);

        // Add this right below your findByStatus method
        List<FoodListing> findByDonor_Email(String email);

        List<FoodListing> findByClaimedBy_EmailAndStatus(String email, FoodStatus status);

        @Query("SELECT f FROM FoodListing f JOIN FETCH f.donor WHERE f.id = :id")
        Optional<FoodListing> findByIdWithDonor(@Param("id") UUID id);

        boolean existsByIdAndDonor_Email(UUID id, String email);

        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query("DELETE FROM FoodListing f WHERE f.id = :id AND f.donor.email = :email AND f.status = :status")
        int deleteOwnedListingByIdAndStatus(
                        @Param("id") UUID id,
                        @Param("email") String email,
                        @Param("status") FoodStatus status);

        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query("UPDATE FoodListing f SET f.status = :completedStatus, f.handoffPin = null, f.handoffToken = null " +
                        "WHERE f.id = :id AND f.status = :claimedStatus AND f.claimedBy.email = :ngoEmail")
        int completeClaimedListingAfterVerification(
                        @Param("id") UUID id,
                        @Param("ngoEmail") String ngoEmail,
                        @Param("claimedStatus") FoodStatus claimedStatus,
                        @Param("completedStatus") FoodStatus completedStatus);

        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query(value = "DELETE FROM notifications WHERE food_listing_id = :listingId", nativeQuery = true)
        int deleteNotificationsByFoodListingId(@Param("listingId") UUID listingId);

        // ---> NEW: POSTGIS RADIUS QUERY <---
        @Query(value = "SELECT * FROM food_listings WHERE status = 'AVAILABLE' AND " +
                        "ST_DWithin(location\\:\\:geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)\\:\\:geography, :radiusInMeters)", nativeQuery = true)
        List<FoodListing> findAvailableFoodWithinRadius(
                        @Param("lat") double lat,
                        @Param("lon") double lon,
                        @Param("radiusInMeters") double radiusInMeters);
}
