package com.example.project.foodbridge.notification.service;

import com.example.project.foodbridge.donation.model.FoodListing;
import com.example.project.foodbridge.notification.dto.NotificationInboxItemResponse;
import com.example.project.foodbridge.notification.dto.NotificationInboxResponse;
import com.example.project.foodbridge.notification.model.Notification;
import com.example.project.foodbridge.notification.repository.NotificationRepository;
import com.example.project.foodbridge.user.model.Role;
import com.example.project.foodbridge.user.model.User;
import com.example.project.foodbridge.user.repository.NearbyNgoProjection;
import com.example.project.foodbridge.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Notification createNearbyDonationNotification(FoodListing donation, NearbyNgoProjection ngo) {
        User recipient = userRepository.findById(ngo.getId())
                .orElseThrow(() -> new IllegalStateException("Nearby NGO not found for notification."));

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setFoodListing(donation);
        notification.setDistanceMeters(ngo.getDistanceMeters());
        notification.setRead(false);
        notification.setMessage(buildNearbyDonationMessage(donation, ngo.getDistanceMeters()));

        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public NotificationInboxResponse getInboxForCurrentNgo(int limit) {
        int pageSize = Math.max(1, Math.min(limit, 100));
        User currentUser = getCurrentNgoOrThrow();

        List<Notification> notifications = notificationRepository.findByRecipient_Id(
                currentUser.getId(),
                PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "createdAt")));

        List<NotificationInboxItemResponse> items = notifications.stream()
                .map(this::toInboxItem)
                .toList();

        long unreadCount = notificationRepository.countByRecipient_IdAndReadFalse(currentUser.getId());

        return new NotificationInboxResponse(items, unreadCount);
    }

    @Transactional(readOnly = true)
    public long getUnreadCountForCurrentNgo() {
        User currentUser = getCurrentNgoOrThrow();
        return notificationRepository.countByRecipient_IdAndReadFalse(currentUser.getId());
    }

    @Transactional
    public boolean markNotificationAsReadForCurrentNgo(UUID notificationId) {
        User currentUser = getCurrentNgoOrThrow();
        int updated = notificationRepository.markAsReadForRecipient(notificationId, currentUser.getId());
        return updated > 0;
    }

    @Transactional
    public int markAllAsReadForCurrentNgo() {
        User currentUser = getCurrentNgoOrThrow();
        return notificationRepository.markAllAsReadForRecipient(currentUser.getId());
    }

    private NotificationInboxItemResponse toInboxItem(Notification notification) {
        return new NotificationInboxItemResponse(
                notification.getId(),
                notification.getFoodListing().getId(),
                notification.getMessage(),
                notification.getDistanceMeters(),
                notification.isRead(),
                notification.getCreatedAt());
    }

    private User getCurrentNgoOrThrow() {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found."));

        if (currentUser.getRole() != Role.NGO) {
            throw new IllegalStateException("Only NGO users can access notification inbox endpoints.");
        }

        return currentUser;
    }

    private String buildNearbyDonationMessage(FoodListing donation, Double distanceMeters) {
        String donorName = donation.getDonor() != null && donation.getDonor().getOrganizationName() != null
                ? donation.getDonor().getOrganizationName()
                : "a donor";

        String distanceText = distanceMeters == null
                ? "near your location"
                : String.format(Locale.US, "%.2f km away", distanceMeters / 1000.0);

        String message = String.format(
                Locale.US,
                "New nearby donation from %s: %s (%s), %s.",
                donorName,
                donation.getDescription(),
                donation.getQuantity(),
                distanceText);

        return message.length() > 500 ? message.substring(0, 500) : message;
    }
}
