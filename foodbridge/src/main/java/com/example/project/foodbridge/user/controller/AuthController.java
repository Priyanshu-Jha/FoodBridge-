package com.example.project.foodbridge.user.controller;

import com.example.project.foodbridge.security.JwtService;
import com.example.project.foodbridge.user.dto.AuthResponse;
import com.example.project.foodbridge.user.dto.LoginRequest;
import com.example.project.foodbridge.user.dto.RegisterRequest;
import com.example.project.foodbridge.user.model.User;
import com.example.project.foodbridge.user.repository.UserRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
            AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;

    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) throws Exception {

        // creayte a nre user entity
        User user = new User();
        user.setEmail(request.getEmail());

        // encryp the password before saving
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setOrganizationName(request.getOrganizationName());
        user.setContactNumber(request.getContactNumber());
        user.setRole(request.getRole());

        if ((request.getLatitude() == null) != (request.getLongitude() == null)) {
            return ResponseEntity.badRequest().body("Please provide both latitude and longitude together.");
        }

        if (request.getLatitude() != null && request.getLongitude() != null) {
            if (request.getLatitude() < -90 || request.getLatitude() > 90 ||
                    request.getLongitude() < -180 || request.getLongitude() > 180) {
                return ResponseEntity.badRequest().body("Latitude/longitude values are out of valid range.");
            }

            GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
            Point location = geometryFactory.createPoint(new Coordinate(request.getLongitude(), request.getLatitude()));
            user.setLocation(location);
        }

        // save to postgres
        userRepository.save(user);

        // genertae jwt
        String jwtToken = jwtService.generateToken(user);

        // return the token
        return ResponseEntity.ok(new AuthResponse(jwtToken, user.getRole().name()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) throws Exception {
        // force spring to verify the credential from db
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        // is code reatche the line thrn password is correct fetch the user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new NoSuchElementException("User not found."));

        String jwtToken = jwtService.generateToken(user);

        return ResponseEntity.ok(new AuthResponse(jwtToken, user.getRole().name()));
    }
}
