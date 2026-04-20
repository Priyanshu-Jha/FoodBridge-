package com.example.project.foodbridge.donation.dto;

import java.util.UUID;

public class HandoffQrResponse {
    private UUID donationId;
    private String handoffPin;
    private String payload;

    public HandoffQrResponse(UUID donationId, String handoffPin, String payload) {
        this.donationId = donationId;
        this.handoffPin = handoffPin;
        this.payload = payload;
    }

    public UUID getDonationId() {
        return donationId;
    }

    public String getHandoffPin() {
        return handoffPin;
    }

    public String getPayload() {
        return payload;
    }
}
