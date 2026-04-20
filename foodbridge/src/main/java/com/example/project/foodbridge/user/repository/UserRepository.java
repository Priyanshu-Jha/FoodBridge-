package com.example.project.foodbridge.user.repository;

import com.example.project.foodbridge.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    @Query(value = "SELECT u.id AS id, " +
            "u.organization_name AS organizationName, " +
            "u.contact_number AS contactNumber, " +
            "u.email AS email, " +
            "ST_Y(u.location\\:\\:geometry) AS latitude, " +
            "ST_X(u.location\\:\\:geometry) AS longitude, " +
            "ST_Distance(u.location\\:\\:geography, f.location\\:\\:geography) AS distanceMeters " +
            "FROM users u " +
            "JOIN food_listings f ON f.id = :foodId " +
            "WHERE u.role = 'NGO' " +
            "AND u.location IS NOT NULL " +
            "AND f.location IS NOT NULL " +
            "AND ST_DWithin(u.location\\:\\:geography, f.location\\:\\:geography, :radiusMeters) " +
            "ORDER BY distanceMeters ASC", nativeQuery = true)
    List<NearbyNgoProjection> findNearbyNgosForDonation(
            @Param("foodId") UUID foodId,
            @Param("radiusMeters") double radiusMeters);
}
