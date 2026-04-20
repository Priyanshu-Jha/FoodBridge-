package com.example.project.foodbridge.donation.service;

import com.example.project.foodbridge.donation.FoodListingRepository;
import com.example.project.foodbridge.donation.event.DonationCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
public class DonationLifecycleScheduler {
    private static final Logger log = LoggerFactory.getLogger(DonationLifecycleScheduler.class);

    private final FoodListingRepository foodListingRepository;
    private final ApplicationEventPublisher eventPublisher;

    public DonationLifecycleScheduler(FoodListingRepository foodListingRepository, ApplicationEventPublisher eventPublisher) {
        this.foodListingRepository = foodListingRepository;
        this.eventPublisher = eventPublisher;
    }

    // Runs every minute
    @Scheduled(fixedDelay = 60_000)
    public void removeExpiredUnclaimedDonations() {
        LocalDateTime now = LocalDateTime.now();
        List<UUID> expiredIds = foodListingRepository.findExpiredAvailableIds(now);
        if (expiredIds.isEmpty()) {
            return;
        }

        foodListingRepository.deleteNotificationsByFoodListingIds(expiredIds);
        int deleted = foodListingRepository.deleteAvailableByIds(expiredIds);
        log.info("Expired donation cleanup: deleted {} AVAILABLE listings", deleted);
    }

    // Runs every minute
    @Scheduled(fixedDelay = 60_000)
    public void revertTimedOutClaimsToAvailable() {
        LocalDateTime now = LocalDateTime.now();
        List<UUID> timedOutIds = foodListingRepository.findTimedOutClaimIds(now);
        if (timedOutIds.isEmpty()) {
            return;
        }

        int updated = foodListingRepository.revertTimedOutClaims(timedOutIds);
        if (updated > 0) {
            for (UUID id : timedOutIds) {
                eventPublisher.publishEvent(new DonationCreatedEvent(id));
            }
        }

        log.info("Timed-out claim cleanup: reverted {} CLAIMED listings to AVAILABLE", updated);
    }
}

