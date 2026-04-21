package com.example.project.foodbridge.admin.controller;

import com.example.project.foodbridge.donation.FoodListingRepository;
import com.example.project.foodbridge.donation.model.FoodStatus;
import com.example.project.foodbridge.user.model.Role;
import com.example.project.foodbridge.user.model.User;
import com.example.project.foodbridge.user.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final FoodListingRepository foodListingRepository;

    public AdminController(UserRepository userRepository, FoodListingRepository foodListingRepository) {
        this.userRepository = userRepository;
        this.foodListingRepository = foodListingRepository;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getAdminProfile() {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User admin = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found."));

        if (admin.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body("Only admins can access admin profile.");
        }

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", admin.getId());
        profile.put("email", admin.getEmail());
        profile.put("organizationName", admin.getOrganizationName());
        profile.put("contactNumber", admin.getContactNumber());
        profile.put("organizationAddress", admin.getOrganizationAddress());
        profile.put("role", admin.getRole().name());
        profile.put("createdAt", admin.getCreatedAt());

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("usersTotal", userRepository.count());
        stats.put("donors", userRepository.countByRole(Role.DONOR));
        stats.put("ngos", userRepository.countByRole(Role.NGO));
        stats.put("admins", userRepository.countByRole(Role.ADMIN));
        stats.put("listingsTotal", foodListingRepository.count());
        stats.put("availableListings", foodListingRepository.countByStatus(FoodStatus.AVAILABLE));
        stats.put("claimedListings", foodListingRepository.countByStatus(FoodStatus.CLAIMED));
        stats.put("completedListings", foodListingRepository.countByStatus(FoodStatus.COMPLETED));
        stats.put("cancelledListings", foodListingRepository.countByStatus(FoodStatus.CANCELLED));
        stats.put("expiredListings", foodListingRepository.countByStatus(FoodStatus.EXPIRED));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("profile", profile);
        response.put("stats", stats);

        return ResponseEntity.ok(response);
    }
}
