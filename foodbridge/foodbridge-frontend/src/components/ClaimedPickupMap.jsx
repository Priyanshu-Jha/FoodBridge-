import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const MAPBOX_DIRECTIONS_TOKEN = import.meta.env.VITE_MAPBOX_DIRECTIONS_TOKEN;
const MAPBOX_PROFILE = import.meta.env.VITE_MAPBOX_PROFILE || 'driving';

// Fix default marker icons in Vite builds.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const FitBounds = ({ bounds }) => {
    const map = useMap();

    useEffect(() => {
        if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [40, 40] });
        }
    }, [map, bounds]);

    return null;
};

const ClaimedPickupMap = ({ pickup, ngoLocation }) => {
    const [routePoints, setRoutePoints] = useState([]);
    const [routeStats, setRouteStats] = useState(null);
    const [routeError, setRouteError] = useState('');
    const [isRouting, setIsRouting] = useState(false);

    const hasPickupCoordinates = pickup?.latitude != null && pickup?.longitude != null;
    const hasNgoCoordinates = ngoLocation?.latitude != null && ngoLocation?.longitude != null;

    const pickupPoint = useMemo(() => {
        if (!pickup || !hasPickupCoordinates) {
            return null;
        }

        return [pickup.latitude, pickup.longitude];
    }, [pickup, hasPickupCoordinates]);

    const ngoPoint = useMemo(() => {
        if (!hasNgoCoordinates) {
            return null;
        }

        return [ngoLocation.latitude, ngoLocation.longitude];
    }, [hasNgoCoordinates, ngoLocation]);

    useEffect(() => {
        if (!pickup || !hasPickupCoordinates || !hasNgoCoordinates) {
            setRoutePoints([]);
            setRouteStats(null);
            setRouteError('');
            return;
        }

        const ngoLat = ngoLocation.latitude;
        const ngoLon = ngoLocation.longitude;
        const pickupLat = pickup.latitude;
        const pickupLon = pickup.longitude;

        const controller = new AbortController();
        const mapboxToken = MAPBOX_DIRECTIONS_TOKEN ? MAPBOX_DIRECTIONS_TOKEN.trim() : '';
        const profile = MAPBOX_PROFILE ? MAPBOX_PROFILE.trim() : 'driving';

        const directionsUrl = mapboxToken
            ? `https://api.mapbox.com/directions/v5/mapbox/${profile}/${ngoLon},${ngoLat};${pickupLon},${pickupLat}?overview=full&geometries=geojson&access_token=${encodeURIComponent(mapboxToken)}`
            : `https://router.project-osrm.org/route/v1/driving/${ngoLon},${ngoLat};${pickupLon},${pickupLat}?overview=full&geometries=geojson`;

        const fetchRoute = async () => {
            setIsRouting(true);
            setRouteError('');

            try {
                const response = await fetch(directionsUrl, { signal: controller.signal });
                if (!response.ok) {
                    throw new Error('Routing service failed');
                }

                const data = await response.json();
                const firstRoute = data?.routes?.[0];

                if (!firstRoute || !firstRoute.geometry?.coordinates) {
                    throw new Error('No route found');
                }

                const points = firstRoute.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
                setRoutePoints(points);
                setRouteStats({
                    distanceKm: firstRoute.distance / 1000,
                    etaMinutes: firstRoute.duration / 60,
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setRoutePoints([]);
                    setRouteStats(null);
                    setRouteError('Could not load driving route right now.');
                }
            } finally {
                setIsRouting(false);
            }
        };

        fetchRoute();

        return () => {
            controller.abort();
        };
    }, [hasNgoCoordinates, hasPickupCoordinates, ngoLocation, pickup]);

    const mapBounds = useMemo(() => {
        if (routePoints.length > 1) {
            return routePoints;
        }

        if (ngoPoint && pickupPoint) {
            return [ngoPoint, pickupPoint];
        }

        if (pickupPoint) {
            return [pickupPoint, pickupPoint];
        }

        return [];
    }, [ngoPoint, pickupPoint, routePoints]);

    const mapCenter = useMemo(() => {
        if (ngoPoint && pickupPoint) {
            return [
                (ngoPoint[0] + pickupPoint[0]) / 2,
                (ngoPoint[1] + pickupPoint[1]) / 2,
            ];
        }

        if (pickupPoint) {
            return pickupPoint;
        }

        return [0, 0];
    }, [ngoPoint, pickupPoint]);

    if (!pickup) {
        return null;
    }

    if (!hasPickupCoordinates) {
        return (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h2 className="text-sm font-bold text-yellow-900 mb-1">Claimed Pickup Map</h2>
                <p className="text-sm text-yellow-800">
                    This claimed donation does not include coordinates, so route and ETA cannot be calculated.
                </p>
            </div>
        );
    }

    return (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
                <div>
                    <h2 className="text-sm font-bold text-gray-900">Claimed Pickup Map</h2>
                    <p className="text-xs text-gray-600">
                        {pickup.description} ({pickup.quantity}) from {pickup.donorName}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {routeStats && (
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                            ETA {Math.round(routeStats.etaMinutes)} min
                        </span>
                    )}
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700">
                        CLAIMED
                    </span>
                </div>
            </div>

            <div className="mb-3 text-xs text-gray-700 flex flex-wrap gap-4">
                {routeStats && (
                    <span>Distance: {routeStats.distanceKm.toFixed(2)} km</span>
                )}
                {isRouting && <span>Calculating route...</span>}
                {!hasNgoCoordinates && (
                    <span className="text-amber-700">Add your NGO location to enable route and ETA.</span>
                )}
                {routeError && (
                    <span className="text-red-600">{routeError}</span>
                )}
            </div>

            <MapContainer center={mapCenter} zoom={14} scrollWheelZoom className="h-80 w-full rounded-lg z-0">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {ngoPoint && (
                    <Marker position={ngoPoint}>
                        <Popup>
                            <strong>Your NGO location</strong>
                        </Popup>
                    </Marker>
                )}

                <Marker position={pickupPoint}>
                    <Popup>
                        <strong>{pickup.description}</strong>
                        <br />
                        Donor: {pickup.donorName}
                        <br />
                        Quantity: {pickup.quantity}
                    </Popup>
                </Marker>

                {routePoints.length > 1 && (
                    <Polyline positions={routePoints} pathOptions={{ color: '#2563eb', weight: 5 }} />
                )}

                <FitBounds bounds={mapBounds} />
            </MapContainer>
        </div>
    );
};

export default ClaimedPickupMap;
