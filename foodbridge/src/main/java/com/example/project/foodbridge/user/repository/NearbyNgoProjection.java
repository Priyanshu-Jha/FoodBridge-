package com.example.project.foodbridge.user.repository;

import java.util.UUID;

public interface NearbyNgoProjection {
    UUID getId();

    String getOrganizationName();

    String getContactNumber();

    String getEmail();

    Double getLatitude();

    Double getLongitude();

    Double getDistanceMeters();
}
