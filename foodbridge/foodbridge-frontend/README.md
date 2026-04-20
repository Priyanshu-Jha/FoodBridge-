# FoodBridge Frontend

## Development

Run from this folder:

1. `npm install`
2. `npm run dev`

Default local URL: `http://localhost:5173`

## Day 23 Routing Configuration

The app supports two routing providers:

1. Mapbox Directions API (recommended for secure API-key usage)
2. Public OSRM fallback (used when no Mapbox key is configured)

To enable Mapbox:

1. Copy `.env.example` to `.env`.
2. Set `VITE_MAPBOX_DIRECTIONS_TOKEN` to your token.
3. Optional: set `VITE_MAPBOX_PROFILE` (`driving`, `driving-traffic`, `walking`, `cycling`).
4. Restart `npm run dev`.

If `VITE_MAPBOX_DIRECTIONS_TOKEN` is empty, the map component falls back to OSRM automatically.
