package com.example.project.foodbridge.donation;

import com.example.project.foodbridge.donation.model.FoodListing;
import com.example.project.foodbridge.donation.model.FoodStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FoodListingRepository extends JpaRepository<FoodListing, UUID> {
        List<FoodListing> findByStatus(FoodStatus status);

        @Query("SELECT f FROM FoodListing f WHERE f.status = :status AND (f.expiresAt IS NULL OR f.expiresAt > :now)")
        List<FoodListing> findByStatusNotExpired(@Param("status") FoodStatus status, @Param("now") LocalDateTime now);

        // Add this right below your findByStatus method
        List<FoodListing> findByDonor_Email(String email);

        List<FoodListing> findByClaimedBy_EmailAndStatus(String email, FoodStatus status);

        List<FoodListing> findByClaimedBy_EmailOrderByClaimedAtDesc(String email);

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
        @Query("UPDATE FoodListing f SET f.status = :completedStatus, f.handoffPin = null, f.handoffToken = null, f.completedAt = CURRENT_TIMESTAMP, f.pickupStage = 'COMPLETED' " +
                        "WHERE f.id = :id AND f.status = :claimedStatus AND f.claimedBy.email = :ngoEmail")
        int completeClaimedListingAfterVerification(
                        @Param("id") UUID id,
                        @Param("ngoEmail") String ngoEmail,
                        @Param("claimedStatus") FoodStatus claimedStatus,
                        @Param("completedStatus") FoodStatus completedStatus);

        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query(value = "DELETE FROM notifications WHERE food_listing_id = :listingId", nativeQuery = true)
        int deleteNotificationsByFoodListingId(@Param("listingId") UUID listingId);

        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query(value = "DELETE FROM notifications WHERE food_listing_id IN (:listingIds)", nativeQuery = true)
        int deleteNotificationsByFoodListingIds(@Param("listingIds") List<UUID> listingIds);

        @Query("SELECT f.id FROM FoodListing f WHERE f.status = 'AVAILABLE' AND f.expiresAt IS NOT NULL AND f.expiresAt <= :now")
        List<UUID> findExpiredAvailableIds(@Param("now") LocalDateTime now);

        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query("DELETE FROM FoodListing f WHERE f.id IN :ids AND f.status = 'AVAILABLE'")
        int deleteAvailableByIds(@Param("ids") List<UUID> ids);

        @Query("SELECT f.id FROM FoodListing f WHERE f.status = 'CLAIMED' AND f.expectedPickupAt IS NOT NULL AND f.expectedPickupAt <= :now")
        List<UUID> findTimedOutClaimIds(@Param("now") LocalDateTime now);

        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query("UPDATE FoodListing f SET f.status = 'AVAILABLE', f.claimedBy = null, f.claimedAt = null, f.expectedPickupAt = null, f.handoffPin = null, f.handoffToken = null, " +
                "f.pickupStage = 'NONE', f.comingAt = null, f.arrivedAt = null " +
                "WHERE f.id IN :ids AND f.status = 'CLAIMED'")
        int revertTimedOutClaims(@Param("ids") List<UUID> ids);

        // ---> NEW: POSTGIS RADIUS QUERY <---
        @Query(value = "SELECT * FROM food_listings WHERE status = 'AVAILABLE' AND " +
                        "ST_DWithin(location\\:\\:geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)\\:\\:geography, :radiusInMeters)", nativeQuery = true)
        List<FoodListing> findAvailableFoodWithinRadius(
                        @Param("lat") double lat,
                        @Param("lon") double lon,
                        @Param("radiusInMeters") double radiusInMeters);
}
