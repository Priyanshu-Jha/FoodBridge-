package com.example.project.foodbridge.notification.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class NotificationInboxItemResponse {
    private UUID id;
    private UUID donationId;
    private String message;
    private Double distanceMeters;
    private Double distanceKm;
    private boolean read;
    private LocalDateTime createdAt;

    public NotificationInboxItemResponse(UUID id, UUID donationId, String message, Double distanceMeters,
            boolean read, LocalDateTime createdAt) {
        this.id = id;
        this.donationId = donationId;
        this.message = message;
        this.distanceMeters = distanceMeters;
        this.distanceKm = distanceMeters != null ? distanceMeters / 1000.0 : null;
        this.read = read;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getDonationId() {
        return donationId;
    }

    public String getMessage() {
        return message;
    }

    public Double getDistanceMeters() {
        return distanceMeters;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public boolean isRead() {
        return read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
