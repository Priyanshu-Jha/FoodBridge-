import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { connectNgoAlerts } from '../services/ngoAlertsSocket';
import ClaimedPickupMap from '../components/ClaimedPickupMap';
import { getApiErrorMessage } from '../utils/errorMessage';

const NgoDashboard = () => {
    const [availableFood, setAvailableFood] = useState([]);
    const [claimedDonations, setClaimedDonations] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [notificationInbox, setNotificationInbox] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showInbox, setShowInbox] = useState(false);
    const [ngoId, setNgoId] = useState(null);
    const [socketStatus, setSocketStatus] = useState('DISCONNECTED');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inboxError, setInboxError] = useState('');
    const [claimedPickup, setClaimedPickup] = useState(null);
    const [ngoLocation, setNgoLocation] = useState(null);
    const [verifyingDonation, setVerifyingDonation] = useState(null);
    const [verificationPayload, setVerificationPayload] = useState('');
    const [verificationPin, setVerificationPin] = useState('');
    const [verificationMessage, setVerificationMessage] = useState('');
    const [verifiedIds, setVerifiedIds] = useState([]);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState('');
    const navigate = useNavigate();

    const fetchAvailableFood = async (token) => {
        const response = await axios.get('http://localhost:8080/api/donations/available', {
            headers: { Authorization: `Bearer ${token}` }
        });

        setAvailableFood(response.data);
    };

    const fetchClaimedDonations = async (token) => {
        const response = await axios.get('http://localhost:8080/api/donations/claimed-by-me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        setClaimedDonations(response.data || []);
    };

    const fetchNotificationInbox = async (token) => {
        const response = await axios.get('http://localhost:8080/api/notifications/inbox?limit=20', {
            headers: { Authorization: `Bearer ${token}` }
        });

        setNotificationInbox(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
        setInboxError('');
    };

    const handleMarkAsRead = async (notificationId) => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            return;
        }

        try {
            const response = await axios.put(`http://localhost:8080/api/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotificationInbox((prev) => prev.map((item) =>
                item.id === notificationId ? { ...item, read: true } : item));
            setUnreadCount(response.data.unreadCount ?? 0);
        } catch (err) {
            console.error(err);
            setInboxError(getApiErrorMessage(err, 'Failed to mark notification as read.'));
        }
    };

    const handleMarkAllAsRead = async () => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            return;
        }

        try {
            await axios.put('http://localhost:8080/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotificationInbox((prev) => prev.map((item) => ({ ...item, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
            setInboxError(getApiErrorMessage(err, 'Failed to mark all notifications as read.'));
        }
    };

    useEffect(() => {
        const initializeDashboard = async () => {
            const token = localStorage.getItem('jwt_token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                await fetchAvailableFood(token);
                await fetchClaimedDonations(token);

                const me = await axios.get('http://localhost:8080/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setNgoId(me.data.id);
                setNgoLocation({
                    latitude: me.data.latitude,
                    longitude: me.data.longitude,
                });

                await fetchNotificationInbox(token);

                setLoading(false);
            } catch (err) {
                console.error("Error fetching data", err);
                setError(getApiErrorMessage(err, 'Failed to load the food feed.'));
                setLoading(false);
            }
        };

        initializeDashboard();
    }, [navigate]);

    useEffect(() => {
        if (!ngoId) {
            return;
        }

        setSocketStatus('CONNECTING');

        const disconnect = connectNgoAlerts({
            ngoId,
            onConnect: () => setSocketStatus('CONNECTED'),
            onDisconnect: () => setSocketStatus('DISCONNECTED'),
            onError: () => setSocketStatus('ERROR'),
            onAlert: (alert) => {
                setAlerts((prev) => [alert, ...prev].slice(0, 8));

                setAvailableFood((prevFood) => {
                    const exists = prevFood.some((food) => food.id === alert.donationId);
                    if (exists) {
                        return prevFood;
                    }

                    const newFood = {
                        id: alert.donationId,
                        description: alert.description,
                        quantity: alert.quantity,
                        donorName: alert.donorOrganizationName,
                        status: 'AVAILABLE',
                        latitude: alert.latitude,
                        longitude: alert.longitude,
                    };

                    return [newFood, ...prevFood];
                });

                const token = localStorage.getItem('jwt_token');
                if (token) {
                    fetchNotificationInbox(token).catch(() => {
                        setInboxError('Live alert received, but inbox refresh failed.');
                    });
                }
            }
        });

        return () => {
            disconnect();
        };
    }, [ngoId]);

    // ---> NEW FUNCTION TO HANDLE THE BUTTON CLICK <---
    const handleClaim = async (foodId) => {
        const token = localStorage.getItem('jwt_token');
        const selectedFood = availableFood.find((food) => food.id === foodId) || null;
        setActionMessage('');

        try {
            // Send a PUT request to the backend with the specific food ID
            await axios.put(`http://localhost:8080/api/donations/${foodId}/claim`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setClaimedPickup(selectedFood);
            if (selectedFood) {
                setClaimedDonations((prev) => {
                    const exists = prev.some((item) => item.id === selectedFood.id);
                    if (exists) {
                        return prev;
                    }
                    return [{ ...selectedFood, status: 'CLAIMED' }, ...prev];
                });
            }

            // Optimistic UI Update: Instantly remove this food from the screen
            // so no one else accidentally clicks it while the page reloads.
            setAvailableFood((prevFood) => prevFood.filter(food => food.id !== foodId));

            setActionMessage('Food successfully claimed. Please arrange pickup with the donor.');
        } catch (err) {
            console.error(err);
            setActionMessage(getApiErrorMessage(err, 'Failed to claim food. Another NGO might have just taken it.'));
        }
    };

    const openVerifyModal = (food) => {
        setVerifyingDonation(food);
        setVerificationPayload('');
        setVerificationPin('');
        setVerificationMessage('');
        setClaimedPickup(food);
    };

    const closeVerifyModal = () => {
        setVerifyingDonation(null);
        setVerificationPayload('');
        setVerificationPin('');
        setVerificationMessage('');
    };

    const handleVerifyHandoff = async () => {
        if (!verifyingDonation) {
            return;
        }

        const token = localStorage.getItem('jwt_token');
        if (!token) {
            navigate('/login');
            return;
        }

        if (!verificationPayload.trim() && !verificationPin.trim()) {
            setVerificationMessage('Provide either scanned QR payload or backup PIN.');
            return;
        }

        try {
            setVerifyLoading(true);
            const response = await axios.put(
                `http://localhost:8080/api/donations/${verifyingDonation.id}/handoff-verify`,
                {
                    qrPayload: verificationPayload.trim() || null,
                    handoffPin: verificationPin.trim() || null,
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setVerificationMessage(`Verified via ${response.data.method}. Donation is now completed.`);
            setVerifiedIds((prev) => prev.includes(verifyingDonation.id) ? prev : [verifyingDonation.id, ...prev]);
            setClaimedDonations((prev) => prev.filter((food) => food.id !== verifyingDonation.id));
            setClaimedPickup((prev) => (prev?.id === verifyingDonation.id ? null : prev));

            const refreshToken = localStorage.getItem('jwt_token');
            if (refreshToken) {
                await fetchClaimedDonations(refreshToken);
            }
            setActionMessage('Handoff verified and donation completed.');
        } catch (err) {
            console.error(err);
            setVerificationMessage(getApiErrorMessage(err, 'Verification failed. Please check QR payload or PIN.'));
        } finally {
            setVerifyLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-xl">Searching for available food...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-800">Available Donations</h1>
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        socketStatus === 'CONNECTED'
                            ? 'bg-green-100 text-green-700'
                            : socketStatus === 'CONNECTING'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                    }`}>
                        LIVE: {socketStatus}
                    </span>
                    <button
                        onClick={() => setShowInbox((prev) => !prev)}
                        className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition flex items-center gap-2"
                    >
                        Inbox
                        {unreadCount > 0 && (
                            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            localStorage.clear(); // Clears both token and role
                            navigate('/login');
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {actionMessage && (
                <p className="mb-4 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                    {actionMessage}
                </p>
            )}

            {showInbox && (
                <div className="mb-6 bg-white border border-indigo-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-indigo-900">Notification Inbox</h2>
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                        >
                            Mark all as read
                        </button>
                    </div>

                    {inboxError && (
                        <p className="text-xs text-red-600 mb-2">{inboxError}</p>
                    )}

                    {notificationInbox.length === 0 ? (
                        <p className="text-sm text-gray-600">No saved alerts yet.</p>
                    ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {notificationInbox.map((item) => (
                                <div
                                    key={item.id}
                                    className={`border rounded p-3 ${item.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm text-gray-800">{item.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
                                            </p>
                                        </div>

                                        {!item.read && (
                                            <button
                                                onClick={() => handleMarkAsRead(item.id)}
                                                className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                                            >
                                                Mark read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <ClaimedPickupMap pickup={claimedPickup} ngoLocation={ngoLocation} />

            {claimedDonations.length > 0 && (
                <div className="mb-6 bg-white border border-teal-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-teal-900">My Claimed Pickups</h2>
                        <span className="text-xs text-teal-700">{claimedDonations.length} active</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {claimedDonations.map((food) => {
                            const hasPickupCoordinates = food.latitude != null && food.longitude != null;

                            return (
                            <div key={food.id} className="border border-teal-100 rounded-lg p-4 bg-teal-50/40">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-bold text-gray-800">{food.description}</p>
                                        <p className="text-sm text-gray-600">Quantity: {food.quantity}</p>
                                        <p className="text-sm text-gray-600">Donor: {food.donorName}</p>
                                        {!hasPickupCoordinates && (
                                            <p className="text-xs text-amber-700 mt-1">
                                                Route unavailable for this pickup because coordinates were not provided.
                                            </p>
                                        )}
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                        verifiedIds.includes(food.id)
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {verifiedIds.includes(food.id) ? 'VERIFIED' : 'PENDING'}
                                    </span>
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <button
                                        onClick={() => setClaimedPickup(food)}
                                        disabled={!hasPickupCoordinates}
                                        className="w-1/2 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {hasPickupCoordinates ? 'Show Route' : 'No Coordinates'}
                                    </button>
                                    <button
                                        onClick={() => openVerifyModal(food)}
                                        className="w-1/2 py-2 bg-teal-600 text-white text-sm font-semibold rounded hover:bg-teal-700 transition"
                                    >
                                        Verify Handoff
                                    </button>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {alerts.length > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h2 className="text-sm font-bold text-amber-800 mb-2">Live Nearby Alerts</h2>
                    <div className="space-y-2">
                        {alerts.slice(0, 3).map((alert, index) => (
                            <div key={`${alert.donationId}-${index}`} className="text-sm text-amber-900">
                                New donation: {alert.description} ({alert.quantity}) from {alert.donorOrganizationName}
                                {' '}at {alert.distanceKm?.toFixed(2)} km
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {availableFood.length === 0 ? (
                <div className="bg-blue-50 text-blue-800 p-6 rounded-lg text-center">
                    <p className="text-xl font-semibold">No food is currently available.</p>
                    <p className="mt-2">Check back later when bakeries post new surplus!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableFood.map((food) => (
                        <div key={food.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col justify-between hover:shadow-lg transition">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-gray-800">{food.description}</h3>
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                    AVAILABLE
                  </span>
                                </div>
                                <p className="text-gray-600 mb-1"><span className="font-semibold">Quantity:</span> {food.quantity}</p>
                                <p className="text-gray-600 mb-4"><span className="font-semibold">Donor:</span> {food.donorName}</p>
                            </div>

                            {/* We will wire this button up on Day 13! */}
                            <button
                                onClick={() => handleClaim(food.id)}
                                className="w-full mt-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition">
                                Claim Food
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {verifyingDonation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-xl font-bold text-gray-800">Verify Handoff</h3>
                            <button
                                onClick={closeVerifyModal}
                                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Scan the donor QR and paste the payload below, or use the backup PIN.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Scanned QR Payload</label>
                                <textarea
                                    value={verificationPayload}
                                    onChange={(e) => setVerificationPayload(e.target.value)}
                                    rows={4}
                                    className="w-full border rounded p-2 text-sm"
                                    placeholder='Paste scanned payload JSON here'
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Backup PIN</label>
                                <input
                                    value={verificationPin}
                                    onChange={(e) => setVerificationPin(e.target.value)}
                                    className="w-full border rounded p-2 text-sm"
                                    placeholder='Enter 4-digit PIN'
                                />
                            </div>

                            {verificationMessage && (
                                <p className={`text-sm ${verificationMessage.startsWith('Verified') ? 'text-emerald-700' : 'text-red-600'}`}>
                                    {verificationMessage}
                                </p>
                            )}

                            <button
                                onClick={handleVerifyHandoff}
                                disabled={verifyLoading}
                                className="w-full py-2 bg-teal-600 text-white font-bold rounded hover:bg-teal-700 transition disabled:bg-teal-300"
                            >
                                {verifyLoading ? 'Verifying...' : 'Verify Pickup'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NgoDashboard;