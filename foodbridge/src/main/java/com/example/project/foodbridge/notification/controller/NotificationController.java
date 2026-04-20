package com.example.project.foodbridge.notification.controller;

import com.example.project.foodbridge.notification.dto.NotificationInboxResponse;
import com.example.project.foodbridge.notification.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/inbox")
    public ResponseEntity<?> getInbox(@RequestParam(defaultValue = "20") int limit) {
        try {
            NotificationInboxResponse response = notificationService.getInboxForCurrentNgo(limit);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount() {
        try {
            long unreadCount = notificationService.getUnreadCountForCurrentNgo();
            return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable UUID id) {
        try {
            boolean updated = notificationService.markNotificationAsReadForCurrentNgo(id);
            if (!updated) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Notification not found for the current NGO.");
            }

            long unreadCount = notificationService.getUnreadCountForCurrentNgo();
            return ResponseEntity.ok(Map.of(
                    "updated", true,
                    "unreadCount", unreadCount));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        try {
            int updatedCount = notificationService.markAllAsReadForCurrentNgo();
            return ResponseEntity.ok(Map.of(
                    "updatedCount", updatedCount,
                    "unreadCount", 0));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
        }
    }
}
