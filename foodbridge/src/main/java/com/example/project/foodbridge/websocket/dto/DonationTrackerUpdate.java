package com.example.project.foodbridge.websocket.dto;

import java.util.UUID;

public class DonationTrackerUpdate {
    private String type;
    private UUID donationId;
    private String stage;
    private UUID ngoId;
    private String ngoName;
    private UUID donorId;
    private String donorName;
    private Long timestamp;

    public DonationTrackerUpdate() {
    }

    public DonationTrackerUpdate(
            String type,
            UUID donationId,
            String stage,
            UUID ngoId,
            String ngoName,
            UUID donorId,
            String donorName,
            Long timestamp) {
        this.type = type;
        this.donationId = donationId;
        this.stage = stage;
        this.ngoId = ngoId;
        this.ngoName = ngoName;
        this.donorId = donorId;
        this.donorName = donorName;
        this.timestamp = timestamp;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public UUID getDonationId() {
        return donationId;
    }

    public void setDonationId(UUID donationId) {
        this.donationId = donationId;
    }

    public String getStage() {
        return stage;
    }

    public void setStage(String stage) {
        this.stage = stage;
    }

    public UUID getNgoId() {
        return ngoId;
    }

    public void setNgoId(UUID ngoId) {
        this.ngoId = ngoId;
    }

    public String getNgoName() {
        return ngoName;
    }

    public void setNgoName(String ngoName) {
        this.ngoName = ngoName;
    }

    public UUID getDonorId() {
        return donorId;
    }

    public void setDonorId(UUID donorId) {
        this.donorId = donorId;
    }

    public String getDonorName() {
        return donorName;
    }

    public void setDonorName(String donorName) {
        this.donorName = donorName;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }
}

