package com.example.project.foodbridge.user.controller;

import com.example.project.foodbridge.user.dto.UpdateLocationRequest;
import com.example.project.foodbridge.user.dto.UserMeResponse;
import com.example.project.foodbridge.user.model.User;
import com.example.project.foodbridge.user.repository.UserRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<UserMeResponse> getMe() {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found."));

        Double latitude = user.getLocation() != null ? user.getLocation().getY() : null;
        Double longitude = user.getLocation() != null ? user.getLocation().getX() : null;

        UserMeResponse response = new UserMeResponse(
                user.getId(),
                user.getEmail(),
                user.getOrganizationName(),
                user.getContactNumber(),
                user.getOrganizationAddress(),
                user.getRole().name(),
                latitude,
                longitude);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/me/location")
    public ResponseEntity<?> updateMyLocation(@RequestBody UpdateLocationRequest request) {
        if (request.getLatitude() == null || request.getLongitude() == null) {
            return ResponseEntity.badRequest().body("Both latitude and longitude are required.");
        }

        if (request.getLatitude() < -90 || request.getLatitude() > 90 ||
                request.getLongitude() < -180 || request.getLongitude() > 180) {
            return ResponseEntity.badRequest().body("Invalid latitude or longitude range.");
        }

        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found."));

        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        Point location = geometryFactory.createPoint(new Coordinate(request.getLongitude(), request.getLatitude()));
        user.setLocation(location);
        userRepository.save(user);

        return ResponseEntity.ok("Location updated successfully.");
    }
}
