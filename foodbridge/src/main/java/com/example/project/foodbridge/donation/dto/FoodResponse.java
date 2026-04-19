package com.example.project.foodbridge.donation.dto;

import java.util.UUID;

public class FoodResponse {
    private UUID id;
    private String description;
    private String quantity;
    private String status;
    private String donorName; // We only send the name, not the whole User object!
    private Double latitude;
    private Double longitude;

    // Constructor to quickly map from the Entity
    public FoodResponse(UUID id, String description, String quantity, String status, String donorName, Double latitude, Double longitude) {
        this.id = id;
        this.description = description;
        this.quantity = quantity;
        this.status = status;
        this.donorName = donorName;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    // Getters
    public UUID getId() { return id; }
    public String getDescription() { return description; }
    public String getQuantity() { return quantity; }
    public String getStatus() { return status; }
    public String getDonorName() { return donorName; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }

}
