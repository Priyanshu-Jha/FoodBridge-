package com.example.project.foodbridge.user.dto;

import java.util.UUID;

public class NearbyNgoResponse {
    private UUID id;
    private String organizationName;
    private String contactNumber;
    private String email;
    private Double latitude;
    private Double longitude;
    private Double distanceMeters;
    private Double distanceKm;

    public NearbyNgoResponse(UUID id, String organizationName, String contactNumber, String email,
            Double latitude, Double longitude, Double distanceMeters) {
        this.id = id;
        this.organizationName = organizationName;
        this.contactNumber = contactNumber;
        this.email = email;
        this.latitude = latitude;
        this.longitude = longitude;
        this.distanceMeters = distanceMeters;
        this.distanceKm = distanceMeters != null ? distanceMeters / 1000.0 : null;
    }

    public UUID getId() {
        return id;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public String getEmail() {
        return email;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public Double getDistanceMeters() {
        return distanceMeters;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }
}
