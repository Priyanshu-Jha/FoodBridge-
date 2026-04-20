package com.example.project.foodbridge.donation.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class FoodResponse {
    private UUID id;
    private String description;
    private String quantity;
    private String status;
    private String donorName; // We only send the name, not the whole User object!
    private String claimedByName;
    private Double latitude;
    private Double longitude;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime claimedAt;
    private LocalDateTime expectedPickupAt;
    private LocalDateTime completedAt;
    private String pickupStage;
    private LocalDateTime comingAt;
    private LocalDateTime arrivedAt;

    // Constructor to quickly map from the Entity
    public FoodResponse(
            UUID id,
            String description,
            String quantity,
            String status,
            String donorName,
            String claimedByName,
            Double latitude,
            Double longitude,
            LocalDateTime createdAt,
            LocalDateTime expiresAt,
            LocalDateTime claimedAt,
            LocalDateTime expectedPickupAt,
            LocalDateTime completedAt,
            String pickupStage,
            LocalDateTime comingAt,
            LocalDateTime arrivedAt) {
        this.id = id;
        this.description = description;
        this.quantity = quantity;
        this.status = status;
        this.donorName = donorName;
        this.claimedByName = claimedByName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.claimedAt = claimedAt;
        this.expectedPickupAt = expectedPickupAt;
        this.completedAt = completedAt;
        this.pickupStage = pickupStage;
        this.comingAt = comingAt;
        this.arrivedAt = arrivedAt;
    }

    // Getters
    public UUID getId() { return id; }
    public String getDescription() { return description; }
    public String getQuantity() { return quantity; }
    public String getStatus() { return status; }
    public String getDonorName() { return donorName; }
    public String getClaimedByName() { return claimedByName; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public LocalDateTime getClaimedAt() { return claimedAt; }
    public LocalDateTime getExpectedPickupAt() { return expectedPickupAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public String getPickupStage() { return pickupStage; }
    public LocalDateTime getComingAt() { return comingAt; }
    public LocalDateTime getArrivedAt() { return arrivedAt; }

}
