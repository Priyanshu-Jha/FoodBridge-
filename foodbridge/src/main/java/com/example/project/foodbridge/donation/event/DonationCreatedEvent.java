package com.example.project.foodbridge.donation.event;

import java.util.UUID;

public class DonationCreatedEvent {
    private final UUID donationId;

    public DonationCreatedEvent(UUID donationId) {
        this.donationId = donationId;
    }

    public UUID getDonationId() {
        return donationId;
    }
}
