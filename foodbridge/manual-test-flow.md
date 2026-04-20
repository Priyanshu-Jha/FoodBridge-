# FoodBridge Manual End-to-End Test Flow

This checklist is designed so you can manually verify all major project functionalities and note issues clearly.

## 1. Pre-Setup

### 1.1 Environment

Action:
1. Start database.
2. Start backend.
3. Start frontend.

Commands:
1. docker-compose up -d
2. .\mvnw.cmd spring-boot:run
3. cd foodbridge-frontend
4. npm install
5. npm run dev -- --port 5173

Expected Result:
1. PostgreSQL container is running.
2. Backend starts on port 8080 with no startup error.
3. Frontend starts on port 5173 and login page is reachable.

### 1.2 Optional Day 23 Routing Setup

Action:
1. In foodbridge-frontend, copy .env.example to .env.
2. Set VITE_MAPBOX_DIRECTIONS_TOKEN.

Expected Result:
1. Routing uses Mapbox if token exists.
2. If token is missing, routing falls back to OSRM.

## 2. Authentication and User Basics (Days 3, 4, 6)

### 2.1 Register Donor

Action:
1. Open /register.
2. Enter DONOR details with valid email/password/organization/contact.
3. Optionally enter latitude/longitude.
4. Click Register.

Expected Result:
1. Registration succeeds.
2. User is redirected to donor dashboard.
3. Token and role are set in local storage.

### 2.2 Register NGO

Action:
1. Open /register in a separate browser profile/incognito.
2. Enter NGO details.
3. Click Register.

Expected Result:
1. Registration succeeds.
2. User lands on NGO dashboard.

### 2.3 Register Page Navigation

Action:
1. On register page, click Back to Login.

Expected Result:
1. You are redirected to /login.

### 2.4 Login

Action:
1. Logout if logged in.
2. Open /login.
3. Login with each created account.

Expected Result:
1. Correct role routes to correct dashboard.
2. Invalid password shows user-friendly error.

## 3. Donor CRUD Flow (Days 9, 10, 11)

### 3.1 Create Listing

Action:
1. Login as donor.
2. Click + Log New Surplus.
3. Fill description and quantity.
4. Submit.

Expected Result:
1. Donation appears in donor active list with AVAILABLE status.
2. No console or network errors.

### 3.2 Edit AVAILABLE Listing

Action:
1. On donor dashboard, click Edit for an AVAILABLE listing.
2. Change fields and submit.

Expected Result:
1. Listing updates immediately.
2. Updated values persist after refresh.

### 3.3 Delete AVAILABLE Listing

Action:
1. Click Delete on an AVAILABLE listing.
2. Confirm.

Expected Result:
1. Listing is removed.
2. It does not reappear after refresh.

## 4. NGO Discovery and Claim Flow (Days 12, 13, 15, 16)

### 4.1 See Available Donations

Action:
1. Login as NGO.
2. Verify available cards load.

Expected Result:
1. Available list is visible and populated when donor has listings.

### 4.2 Concurrency Claim Test

Action:
1. Open two NGO sessions (two browsers/incognito windows).
2. Try to claim the same AVAILABLE listing at nearly same time.

Expected Result:
1. Exactly one claim succeeds.
2. Other claim fails with a clean error message.
3. Listing status becomes CLAIMED once.

### 4.3 Nearby/Geo Behavior

Action:
1. Create listing with donor coordinates.
2. Ensure NGO has coordinates (profile location API path is used by dashboard logic).

Expected Result:
1. Geo-supported flows continue without backend error.
2. Nearby matching and route sections can use coordinates.

## 5. Realtime Alerts and Notification Fallback (Days 17, 18, 19, 20, 21)

### 5.1 Live Socket Alert

Action:
1. Keep NGO dashboard open.
2. In donor session, create a new listing.

Expected Result:
1. NGO sees live alert panel update.
2. Live socket badge shows CONNECTED.

### 5.2 Notification Inbox Persistence

Action:
1. Open NGO Inbox.
2. Verify newly created alert appears as unread.
3. Click Mark read on one item.
4. Click Mark all as read.

Expected Result:
1. Unread count decreases correctly.
2. Read state persists after refresh.

## 6. Map, Route and ETA (Days 22, 23)

### 6.1 Claimed Pickup Map

Action:
1. Claim a listing as NGO.
2. Use Show Route for claimed pickup.

Expected Result:
1. Map renders pickup marker.
2. NGO marker appears if NGO location exists.

### 6.2 Route and ETA

Action:
1. With coordinates available, open claimed route.

Expected Result:
1. Polyline route is drawn.
2. ETA and distance are shown.
3. If routing provider fails, graceful error appears (no crash).

## 7. Secure Handoff and Completion (Days 24, 25, 26)

### 7.1 Donor Handoff QR

Action:
1. After NGO claims, login as donor.
2. Open Show Handoff QR.

Expected Result:
1. QR modal opens.
2. Backup PIN is visible and is 4 digits.

### 7.2 NGO Verification via PIN

Action:
1. In NGO claimed pickup card, click Verify Handoff.
2. Enter 4-digit PIN from donor modal.
3. Click Verify Pickup.

Expected Result:
1. Verification succeeds with success message.
2. Donation moves to COMPLETED.
3. Claimed list removes that donation.

### 7.3 Donor Completed History

Action:
1. Donor opens Previous Transactions.

Expected Result:
1. Verified donation appears as COMPLETED.
2. It no longer appears in active list.

## 8. Error Handling and Guardrails (Day 27)

### 8.1 Unauthorized Access

Action:
1. Call a protected flow without token (or after removing token).

Expected Result:
1. App redirects to login only for session-expired/401 scenarios.
2. Forbidden business actions (403) show message without forced logout.

### 8.2 React Crash Boundary Smoke Test

Action:
1. Perform normal navigation across pages.
2. Watch for rendering crashes.

Expected Result:
1. No blank unhandled crash.
2. AppErrorBoundary remains available for render failures.

## 9. Demo Prep Verification (Day 28)

### 9.1 Seeded Demo Data

Action:
1. Start backend with seed flag:
   .\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--app.demo.seed-enabled=true"
2. Login with demo users from demo-checklist.md.

Expected Result:
1. Demo users exist and can login.
2. Demo donations are present.

## 10. Final Sign-Off Matrix

Mark each row after testing:

1. Register/Login/Logout: PASS or FAIL
2. Donor Create/Edit/Delete: PASS or FAIL
3. NGO Available/Claim: PASS or FAIL
4. Concurrency Claim Guard: PASS or FAIL
5. Realtime Alerts: PASS or FAIL
6. Notification Inbox Read/Read-All: PASS or FAIL
7. Map + ETA Route: PASS or FAIL
8. Donor QR + 4-digit PIN: PASS or FAIL
9. Verify to COMPLETED Transition: PASS or FAIL
10. Error Handling UX: PASS or FAIL
11. Demo Seeder Flow: PASS or FAIL

## 11. Issue Reporting Template

Use this format when you find any issue:

1. Title
2. Environment (OS, browser, backend/frontend ports)
3. Preconditions
4. Steps to Reproduce
5. Actual Result
6. Expected Result
7. Screenshot or Console Error
8. API Endpoint and Status Code (if visible)
9. Severity (Blocker, High, Medium, Low)
