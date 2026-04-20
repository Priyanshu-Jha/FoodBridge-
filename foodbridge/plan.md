Done Days: 1-28
Week 1: The Foundation & Security
Goal: Set up the environments, database, and secure user login.

Day 1: Project Initialization & Database Setup

Task: Generate the Spring Boot backend and spin up PostgreSQL using Docker.

Tech to Learn: Spring Initializr, Docker Compose, PostgreSQL basics.

Day 2: Entity Modeling (User Module)

Task: Create the database tables for Users (Donors, NGOs, Admins) using Java classes.

Tech to Learn: Spring Data JPA, Hibernate, @Entity, @Table.

Day 3: Authentication & Security (Part 1)

Task: Configure Spring Security to hash passwords and protect basic routes.

Tech to Learn: Spring Security architecture, BCrypt password hashing.

Day 4: Authentication & Security (Part 2)

Task: Implement stateless authentication using JSON Web Tokens (JWT).

Tech to Learn: JWT structure, Spring Security Filters, OncePerRequestFilter.

Day 5: Frontend Skeleton

Task: Initialize the React application and set up basic routing.

Tech to Learn: Vite (for fast React setup), React Router, Tailwind CSS configuration.

Day 6: Login & Registration UI

Task: Build the login/signup screens and connect them to your Spring Boot API.

Tech to Learn: React state (useState), Axios or Fetch API, handling HTTP errors in React.

Day 7: Buffer & Review

Task: Catch up on any delayed tasks, test the login flow end-to-end, and merge code.

Week 2: The Donation Lifecycle (Core CRUD)
Goal: Allow Donors to post food and NGOs to view it (without the location filtering yet).

Day 8: Donation Database Models

Task: Create the FoodListing entity and link it to the User entity.

Tech to Learn: JPA Relationships (@ManyToOne, @OneToMany).

Day 9: Backend REST APIs

Task: Build the endpoints to create, read, update, and delete food listings.

Tech to Learn: Spring @RestController, Data Transfer Objects (DTOs), @GetMapping / @PostMapping.

Day 10: Donor Dashboard (Frontend)

Task: Build the UI for restaurants to see their active and past donations.

Tech to Learn: React useEffect for fetching data on load, Tailwind CSS Grids/Flexbox.

Day 11: "Log Surplus" Form

Task: Create the form for a bakery to input food details (quantity, description) and submit it.

Tech to Learn: React Hook Form (or managing controlled inputs natively).

Day 12: NGO Dashboard

Task: Build the UI for NGOs to see a list of available food.

Tech to Learn: Conditional rendering in React (showing different UI based on the user's role).

Day 13: Concurrency Control (The Thundering Herd)

Task: Prevent two NGOs from claiming the same food simultaneously.

Tech to Learn: Database locking (Pessimistic Locking in Postgres or @Version Optimistic Locking in Hibernate).

Day 14: Buffer & Review

Task: Test the complete creation and claiming flow manually using multiple browser tabs.

Week 3: The "Brain" (Geospatial & Real-Time)
Goal: Implement PostGIS for location matching and WebSockets for instant alerts.

Day 15: Upgrading to PostGIS

Task: Add the PostGIS extension to your database and update the FoodListing to store geographic coordinates.

Tech to Learn: PostGIS Geometry / Point data types, Hibernate Spatial.

Day 16: Radius Queries

Task: Write the backend logic to find NGOs within X kilometers of a donation.

Tech to Learn: PostGIS functions (ST_DWithin, ST_Distance).

Day 17: WebSocket Setup

Task: Configure the WebSocket server in Spring Boot.

Tech to Learn: Spring WebSockets, @EnableWebSocketMessageBroker, STOMP protocol.

Day 18: Triggering Notifications

Task: When a food listing is saved, trigger an event to find nearby NGOs and send a message to the WebSocket channel.

Tech to Learn: Spring Application Events (Observer Pattern), SimpMessagingTemplate.

Day 19: Listening on the Frontend

Task: Connect the React app to the WebSocket server to receive live alerts.

Tech to Learn: SockJS, stompjs libraries in React.

Day 20: Notification Fallbacks

Task: Save notifications to the database so NGOs don't miss alerts if their browser tab is asleep.

Tech to Learn: Designing a simple Notification Inbox table and API.

Day 21: Buffer & Review

Task: Test the real-time matching. Create a food listing on one screen and watch the alert pop up on another.

Week 4: Logistics, Handoff & Polish
Goal: Integrate maps for routing and build the secure QR code handoff system.

Day 22: Map Rendering

Task: Display a map on the NGO dashboard showing the location of the claimed food.

Tech to Learn: Mapbox GL JS (or Leaflet.js), React map wrapper libraries (e.g., react-map-gl).

Day 23: Routing & ETAs

Task: Draw a line from the NGO's current location to the bakery and calculate the drive time.

Tech to Learn: Mapbox Directions API (or Google Maps Directions API), handling API keys securely.

Day 24: Secure Handoff (QR Generation)

Task: Generate a unique QR code on the Donor's screen once food is claimed.

Tech to Learn: React QR code generation libraries (e.g., qrcode.react).

Day 25: Secure Handoff (Scanning/Verification)

Task: Allow the NGO driver to scan the code (or enter a 4-digit PIN) to complete the transaction.

Tech to Learn: HTML5 QR Code Scanner libraries (or just a simple form for PIN fallback).

Day 26: State Finalization

Task: Update the database to mark the transaction as "COMPLETED" upon successful scan.

Tech to Learn: Transaction management (@Transactional in Spring) to ensure safe state changes.

Day 27: Error Handling & Polish

Task: Catch generic errors and display clean, user-friendly error messages on the frontend.

Tech to Learn: Spring @ControllerAdvice for global exception handling, React Error Boundaries.

Day 28: Final Demo Prep

Task: Seed the database with fake bakeries and NGOs, record a demo video, and celebrate.