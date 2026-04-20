package com.example.project.foodbridge.donation.dto;

public class ClaimFoodRequest {
    private Integer expectedPickupMinutes;

    public Integer getExpectedPickupMinutes() {
        return expectedPickupMinutes;
    }

    public void setExpectedPickupMinutes(Integer expectedPickupMinutes) {
        this.expectedPickupMinutes = expectedPickupMinutes;
    }
}

