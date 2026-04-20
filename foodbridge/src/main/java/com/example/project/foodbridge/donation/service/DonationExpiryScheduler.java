package com.example.project.foodbridge.donation.service;

import com.example.project.foodbridge.donation.FoodListingRepository;
import com.example.project.foodbridge.donation.model.FoodStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DonationExpiryScheduler {

    private final FoodListingRepository foodListingRepository;

    public DonationExpiryScheduler(FoodListingRepository foodListingRepository) {
        this.foodListingRepository = foodListingRepository;
    }

    @Transactional
    @Scheduled(fixedDelayString = "${app.expiry.scan-interval-ms:60000}")
    public void markExpiredDonations() {
        foodListingRepository.deleteNotificationsForExpiredListings();
        foodListingRepository.deleteExpiredListingsByStatuses(
                java.util.List.of(FoodStatus.AVAILABLE, FoodStatus.EXPIRED));
    }
}
