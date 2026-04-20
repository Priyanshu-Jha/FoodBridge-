package com.example.project.foodbridge.donation.dto;

public class VerifyHandoffRequest {
    private String qrPayload;
    private String handoffPin;

    public String getQrPayload() {
        return qrPayload;
    }

    public void setQrPayload(String qrPayload) {
        this.qrPayload = qrPayload;
    }

    public String getHandoffPin() {
        return handoffPin;
    }

    public void setHandoffPin(String handoffPin) {
        this.handoffPin = handoffPin;
    }
}
