package com.example.project.foodbridge.donation.dto;

import java.util.UUID;

public class VerifyHandoffResponse {
    private UUID donationId;
    private boolean verified;
    private String method;
    private String message;

    public VerifyHandoffResponse(UUID donationId, boolean verified, String method, String message) {
        this.donationId = donationId;
        this.verified = verified;
        this.method = method;
        this.message = message;
    }

    public UUID getDonationId() {
        return donationId;
    }

    public boolean isVerified() {
        return verified;
    }

    public String getMethod() {
        return method;
    }

    public String getMessage() {
        return message;
    }
}
