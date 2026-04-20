package com.example.project.foodbridge.donation.model;

import com.example.project.foodbridge.user.model.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "food_listings")
public class FoodListing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FoodStatus status = FoodStatus.AVAILABLE;

    @Version
    private Long version;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point location;

    // Relationship

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id", nullable = false)
    private User donor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claimed_by_id")
    private User claimedBy;

    @Column(length = 4)
    private String handoffPin;

    @Column(length = 64)
    private String handoffToken;

    // ---------------------------------
    private LocalDateTime expiresAt;

    private LocalDateTime claimedAt;

    private LocalDateTime expectedPickupAt;

    private LocalDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PickupStage pickupStage = PickupStage.NONE;

    private LocalDateTime comingAt;

    private LocalDateTime arrivedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public FoodListing() {
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getQuantity() {
        return quantity;
    }

    public void setQuantity(String quantity) {
        this.quantity = quantity;
    }

    public FoodStatus getStatus() {
        return status;
    }

    public void setStatus(FoodStatus status) {
        this.status = status;
    }

    public User getDonor() {
        return donor;
    }

    public void setDonor(User donor) {
        this.donor = donor;
    }

    public User getClaimedBy() {
        return claimedBy;
    }

    public void setClaimedBy(User claimedBy) {
        this.claimedBy = claimedBy;
    }

    public String getHandoffPin() {
        return handoffPin;
    }

    public void setHandoffPin(String handoffPin) {
        this.handoffPin = handoffPin;
    }

    public String getHandoffToken() {
        return handoffToken;
    }

    public void setHandoffToken(String handoffToken) {
        this.handoffToken = handoffToken;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public Point getLocation() {
        return location;
    }

    public void setLocation(Point location) {
        this.location = location;
    }

    public LocalDateTime getClaimedAt() {
        return claimedAt;
    }

    public void setClaimedAt(LocalDateTime claimedAt) {
        this.claimedAt = claimedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getExpectedPickupAt() {
        return expectedPickupAt;
    }

    public void setExpectedPickupAt(LocalDateTime expectedPickupAt) {
        this.expectedPickupAt = expectedPickupAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public PickupStage getPickupStage() {
        return pickupStage;
    }

    public void setPickupStage(PickupStage pickupStage) {
        this.pickupStage = pickupStage;
    }

    public LocalDateTime getComingAt() {
        return comingAt;
    }

    public void setComingAt(LocalDateTime comingAt) {
        this.comingAt = comingAt;
    }

    public LocalDateTime getArrivedAt() {
        return arrivedAt;
    }

    public void setArrivedAt(LocalDateTime arrivedAt) {
        this.arrivedAt = arrivedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
