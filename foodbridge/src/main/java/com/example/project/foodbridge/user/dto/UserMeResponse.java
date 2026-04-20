package com.example.project.foodbridge.user.dto;

import java.util.UUID;

public class UserMeResponse {
    private UUID id;
    private String email;
    private String organizationName;
    private String role;
    private Double latitude;
    private Double longitude;

    public UserMeResponse(UUID id, String email, String organizationName, String role, Double latitude,
            Double longitude) {
        this.id = id;
        this.email = email;
        this.organizationName = organizationName;
        this.role = role;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public String getRole() {
        return role;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }
}
