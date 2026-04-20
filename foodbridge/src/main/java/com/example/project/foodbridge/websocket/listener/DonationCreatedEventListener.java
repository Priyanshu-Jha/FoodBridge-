package com.example.project.foodbridge.websocket.listener;

import com.example.project.foodbridge.donation.FoodListingRepository;
import com.example.project.foodbridge.donation.event.DonationCreatedEvent;
import com.example.project.foodbridge.donation.model.FoodListing;
import com.example.project.foodbridge.notification.model.Notification;
import com.example.project.foodbridge.notification.service.NotificationService;
import com.example.project.foodbridge.user.repository.NearbyNgoProjection;
import com.example.project.foodbridge.user.repository.UserRepository;
import com.example.project.foodbridge.websocket.dto.NearbyDonationAlert;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DonationCreatedEventListener {
    private static final Logger log = LoggerFactory.getLogger(DonationCreatedEventListener.class);

    private final FoodListingRepository foodListingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${app.matching.default-radius-km:5}")
    private double defaultRadiusKm;

    public DonationCreatedEventListener(
            FoodListingRepository foodListingRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            SimpMessagingTemplate messagingTemplate) {
        this.foodListingRepository = foodListingRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleDonationCreated(DonationCreatedEvent event) {
        FoodListing donation = foodListingRepository.findByIdWithDonor(event.getDonationId()).orElse(null);
        if (donation == null) {
            log.warn("Donation {} not found while processing notification event", event.getDonationId());
            return;
        }

        if (donation.getLocation() == null) {
            log.info("Donation {} has no location, skipping nearby NGO notification", donation.getId());
            return;
        }

        double radiusMeters = defaultRadiusKm * 1000.0;
        List<NearbyNgoProjection> nearbyNgos = userRepository.findNearbyNgosForDonation(donation.getId(), radiusMeters);

        for (NearbyNgoProjection ngo : nearbyNgos) {
            Notification notification = notificationService.createNearbyDonationNotification(donation, ngo);

            NearbyDonationAlert alert = new NearbyDonationAlert(
                    "NEARBY_DONATION",
                    donation.getId(),
                    donation.getDescription(),
                    donation.getQuantity(),
                    donation.getDonor().getOrganizationName(),
                    donation.getLocation().getY(),
                    donation.getLocation().getX(),
                    ngo.getId(),
                    ngo.getOrganizationName(),
                    ngo.getDistanceMeters(),
                    defaultRadiusKm,
                    notification.getCreatedAt() != null
                            ? notification.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant()
                                    .toEpochMilli()
                            : System.currentTimeMillis());

            messagingTemplate.convertAndSend("/topic/ngo/" + ngo.getId() + "/alerts", alert);
        }

        log.info("Day18 notification: donation {} matched {} NGOs within {} km",
                donation.getId(), nearbyNgos.size(), defaultRadiusKm);
    }
}
