package com.example.project.foodbridge.notification.dto;

import java.util.List;

public class NotificationInboxResponse {
    private List<NotificationInboxItemResponse> notifications;
    private long unreadCount;

    public NotificationInboxResponse(List<NotificationInboxItemResponse> notifications, long unreadCount) {
        this.notifications = notifications;
        this.unreadCount = unreadCount;
    }

    public List<NotificationInboxItemResponse> getNotifications() {
        return notifications;
    }

    public long getUnreadCount() {
        return unreadCount;
    }
}
