package com.example.project.foodbridge.websocket.dto;

import java.util.UUID;

public class NearbyDonationAlert {
    private String type;
    private UUID donationId;
    private String description;
    private String quantity;
    private String donorOrganizationName;
    private Double latitude;
    private Double longitude;
    private UUID ngoId;
    private String ngoOrganizationName;
    private Double distanceMeters;
    private Double distanceKm;
    private Double radiusKm;
    private Long timestamp;

    public NearbyDonationAlert(String type, UUID donationId, String description, String quantity,
            String donorOrganizationName, Double latitude, Double longitude,
            UUID ngoId, String ngoOrganizationName,
            Double distanceMeters, Double radiusKm, Long timestamp) {
        this.type = type;
        this.donationId = donationId;
        this.description = description;
        this.quantity = quantity;
        this.donorOrganizationName = donorOrganizationName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.ngoId = ngoId;
        this.ngoOrganizationName = ngoOrganizationName;
        this.distanceMeters = distanceMeters;
        this.distanceKm = distanceMeters != null ? distanceMeters / 1000.0 : null;
        this.radiusKm = radiusKm;
        this.timestamp = timestamp;
    }

    public String getType() {
        return type;
    }

    public UUID getDonationId() {
        return donationId;
    }

    public String getDescription() {
        return description;
    }

    public String getQuantity() {
        return quantity;
    }

    public String getDonorOrganizationName() {
        return donorOrganizationName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public UUID getNgoId() {
        return ngoId;
    }

    public String getNgoOrganizationName() {
        return ngoOrganizationName;
    }

    public Double getDistanceMeters() {
        return distanceMeters;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public Double getRadiusKm() {
        return radiusKm;
    }

    public Long getTimestamp() {
        return timestamp;
    }
}
