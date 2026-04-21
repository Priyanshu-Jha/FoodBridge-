# FoodBridge Quick Start

## Normal Development Startup

Run these commands from the project root:

1. `docker-compose up -d`
2. `./mvnw.cmd spring-boot:run`
3. `cd foodbridge-frontend`
4. `npm run dev`

## NGO Handoff Verification Flow

1. NGO claims a listing from New Food Requests.
2. NGO marks pickup phases in order: `Mark Pickup Out` -> `Mark Received`.
3. Donor opens `Show Handoff QR` on donor dashboard.
4. NGO opens `Verify Handoff` and uses `Scan QR with Camera` (or backup PIN).
5. After successful verification, record moves to `Received Food` section.

## NGO Pickup Buckets

1. `New Food Requests`: available donations not yet claimed.
2. `In Progress Pickups`: claimed donations currently in transfer workflow.
3. `Received Food`: completed handoff records for the NGO.

Optional Day 23 routing key setup (frontend):

1. `cd foodbridge-frontend`
2. `copy .env.example .env`
3. Set `VITE_MAPBOX_DIRECTIONS_TOKEN` in `.env`
4. Restart `npm run dev`

## Day 28 Demo Prep Helpers

1. Start backend with demo data seeding:
	- `./mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--app.demo.seed-enabled=true"`
2. Optional helper script for Windows:
	- `./scripts/start-demo.ps1 -WithFrontend`
3. See full demo flow and credentials:
	- `./demo-checklist.md`

## Troubleshooting Port 8080

1. Check process on port 8080:
	- `netstat -ano | findstr :8080`
2. Kill stale process if required:
	- `taskkill /F /PID <pid>`


Admin Credential:
Email: demo.admin@foodbridge.local
Password: Demo@123