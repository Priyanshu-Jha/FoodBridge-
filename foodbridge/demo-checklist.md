# FoodBridge Demo Checklist

## 1) Start Demo Environment

1. Start PostgreSQL:
   - `docker-compose up -d`
2. Start backend with demo seeding enabled:
   - `./mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--app.demo.seed-enabled=true"`
3. Start frontend:
   - `cd foodbridge-frontend`
   - `npm run dev`

Optional helper script (Windows PowerShell):
- `./scripts/start-demo.ps1 -WithFrontend`

## 2) Demo Credentials (password for all: Demo@123)

### Donors
- demo.donor1@foodbridge.local (Sunrise Bakery)
- demo.donor2@foodbridge.local (Green Bowl Restaurant)

### NGOs
- demo.ngo1@foodbridge.local (Helping Hands NGO)
- demo.ngo2@foodbridge.local (Food Rescue Trust)

## 3) Suggested Flow for Recording

1. Login as NGO and keep dashboard open.
2. Login as donor in another tab/window.
3. Donor creates a listing with location.
4. NGO receives live alert and claims food.
5. NGO opens route and verify handoff modal.
6. Donor opens handoff QR for claimed listing.
7. NGO verifies with QR payload or backup PIN.
8. Donation moves to completed state.
9. Donor switches to Previous Transactions and shows completed entry.

## 4) Fallback Checks

1. If backend is not reachable, verify port 8080 is free:
   - `netstat -ano | findstr :8080`
2. If needed, stop stale process:
   - `taskkill /F /PID <pid>`
3. Re-run backend start command with demo seed argument.
