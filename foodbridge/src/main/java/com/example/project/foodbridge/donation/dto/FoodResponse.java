package com.example.project.foodbridge.donation.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class FoodResponse {
    private UUID id;
    private String description;
    private String quantity;
    private String pickupAddress;
    private String imageData;
    private String status;
    private String donorName; // We only send the name, not the whole User object!
    private String donorContactNumber;
    private String receiverName;
    private String receiverContactNumber;
    private Double latitude;
    private Double longitude;
    private LocalDateTime expiresAt;
    private LocalDateTime publishedAt;
    private LocalDateTime claimedAt;
    private LocalDateTime pickupOutAt;
    private LocalDateTime receivedAt;
    private LocalDateTime completedAt;

    // Constructor to quickly map from the Entity
    public FoodResponse(UUID id, String description, String quantity, String pickupAddress, String imageData,
            String status, String donorName, String donorContactNumber, Double latitude,
            Double longitude) {
        this(id, description, quantity, pickupAddress, imageData, status, donorName, donorContactNumber,
                null, null,
                latitude, longitude,
                null, null, null, null, null, null);
    }

    public FoodResponse(
            UUID id,
            String description,
            String quantity,
            String pickupAddress,
            String imageData,
            String status,
            String donorName,
            String donorContactNumber,
            String receiverName,
            String receiverContactNumber,
            Double latitude,
            Double longitude,
            LocalDateTime expiresAt,
            LocalDateTime publishedAt,
            LocalDateTime claimedAt,
            LocalDateTime pickupOutAt,
            LocalDateTime receivedAt,
            LocalDateTime completedAt) {
        this.id = id;
        this.description = description;
        this.quantity = quantity;
        this.pickupAddress = pickupAddress;
        this.imageData = imageData;
        this.status = status;
        this.donorName = donorName;
        this.donorContactNumber = donorContactNumber;
        this.receiverName = receiverName;
        this.receiverContactNumber = receiverContactNumber;
        this.latitude = latitude;
        this.longitude = longitude;
        this.expiresAt = expiresAt;
        this.publishedAt = publishedAt;
        this.claimedAt = claimedAt;
        this.pickupOutAt = pickupOutAt;
        this.receivedAt = receivedAt;
        this.completedAt = completedAt;
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public String getDescription() {
        return description;
    }

    public String getQuantity() {
        return quantity;
    }

    public String getPickupAddress() {
        return pickupAddress;
    }

    public String getImageData() {
        return imageData;
    }

    public String getStatus() {
        return status;
    }

    public String getDonorName() {
        return donorName;
    }

    public String getDonorContactNumber() {
        return donorContactNumber;
    }

    public String getReceiverName() {
        return receiverName;
    }

    public String getReceiverContactNumber() {
        return receiverContactNumber;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public LocalDateTime getClaimedAt() {
        return claimedAt;
    }

    public LocalDateTime getPickupOutAt() {
        return pickupOutAt;
    }

    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

}
