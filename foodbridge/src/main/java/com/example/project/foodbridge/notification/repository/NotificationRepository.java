package com.example.project.foodbridge.notification.repository;

import com.example.project.foodbridge.notification.model.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByRecipient_Id(UUID recipientId, Pageable pageable);

    long countByRecipient_IdAndReadFalse(UUID recipientId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Notification n SET n.read = true WHERE n.id = :notificationId AND n.recipient.id = :recipientId AND n.read = false")
    int markAsReadForRecipient(@Param("notificationId") UUID notificationId, @Param("recipientId") UUID recipientId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient.id = :recipientId AND n.read = false")
    int markAllAsReadForRecipient(@Param("recipientId") UUID recipientId);
}
