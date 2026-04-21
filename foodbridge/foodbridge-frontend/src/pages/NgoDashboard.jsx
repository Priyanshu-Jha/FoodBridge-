import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { connectNgoAlerts } from '../services/ngoAlertsSocket';
import DonationPhaseTimeline from '../components/DonationPhaseTimeline';
import { getApiErrorMessage } from '../utils/errorMessage';
import { apiUrl } from '../config/api';

const NgoDashboard = () => {
    const [availableFood, setAvailableFood] = useState([]);
    const [claimedDonations, setClaimedDonations] = useState([]);
    const [completedDonations, setCompletedDonations] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [notificationInbox, setNotificationInbox] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showInbox, setShowInbox] = useState(false);
    const [ngoId, setNgoId] = useState(null);
    const [socketStatus, setSocketStatus] = useState('DISCONNECTED');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inboxError, setInboxError] = useState('');
    const [verifyingDonation, setVerifyingDonation] = useState(null);
    const [verificationPayload, setVerificationPayload] = useState('');
    const [verificationPin, setVerificationPin] = useState('');
    const [verificationMessage, setVerificationMessage] = useState('');
    const [scannerActive, setScannerActive] = useState(false);
    const [scannerError, setScannerError] = useState('');
    const [verifiedIds, setVerifiedIds] = useState([]);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [showPreviousTransactions, setShowPreviousTransactions] = useState(false);
    const [actionMessage, setActionMessage] = useState('');
    const scannerRef = useRef(null);
    const scannerSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
    const scannerElementId = 'foodbridge-handoff-qr-reader';
    const navigate = useNavigate();

    const fetchAvailableFood = async (token) => {
        const response = await axios.get(apiUrl('/api/donations/available'), {
            headers: { Authorization: `Bearer ${token}` }
        });

        setAvailableFood(response.data);
    };

    const fetchClaimedDonations = async (token) => {
        const response = await axios.get(apiUrl('/api/donations/claimed-by-me'), {
            headers: { Authorization: `Bearer ${token}` }
        });

        setClaimedDonations(response.data || []);
    };

    const fetchCompletedDonations = async (token) => {
        const response = await axios.get(apiUrl('/api/donations/completed-by-me'), {
            headers: { Authorization: `Bearer ${token}` }
        });

        setCompletedDonations(response.data || []);
    };

    const fetchNotificationInbox = async (token) => {
        const response = await axios.get(apiUrl('/api/notifications/inbox?limit=20'), {
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
            const response = await axios.put(apiUrl(`/api/notifications/${notificationId}/read`), {}, {
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
            await axios.put(apiUrl('/api/notifications/read-all'), {}, {
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
                await fetchCompletedDonations(token);

                const me = await axios.get(apiUrl('/api/users/me'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setNgoId(me.data.id);

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
        setActionMessage('');

        try {
            // Send a PUT request to the backend with the specific food ID
            await axios.put(apiUrl(`/api/donations/${foodId}/claim`), {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await fetchAvailableFood(token);
            await fetchClaimedDonations(token);
            await fetchCompletedDonations(token);

            setActionMessage('Food successfully claimed. Please arrange pickup with the donor.');
        } catch (err) {
            console.error(err);
            setActionMessage(getApiErrorMessage(err, 'Failed to claim food. Another NGO might have just taken it.'));
        }
    };

    const handleMarkPickupOut = async (foodId) => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            navigate('/login');
            return;
        }

        setActionMessage('');
        try {
            await axios.put(apiUrl(`/api/donations/${foodId}/pickup-out`), {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await fetchClaimedDonations(token);
            setActionMessage('Pickup marked as out for delivery.');
        } catch (err) {
            console.error(err);
            setActionMessage(getApiErrorMessage(err, 'Failed to mark pickup-out.'));
        }
    };

    const handleMarkReceived = async (foodId) => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            navigate('/login');
            return;
        }

        setActionMessage('');
        try {
            await axios.put(apiUrl(`/api/donations/${foodId}/received`), {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await fetchClaimedDonations(token);
            setActionMessage('Pickup marked as received. You can now verify handoff.');
        } catch (err) {
            console.error(err);
            setActionMessage(getApiErrorMessage(err, 'Failed to mark pickup as received.'));
        }
    };

    const openVerifyModal = (food) => {
        setVerifyingDonation(food);
        setVerificationPayload('');
        setVerificationPin('');
        setVerificationMessage('');
        setScannerError('');
    };

    const stopQrScanner = () => {
        const scanner = scannerRef.current;
        if (!scanner) {
            setScannerActive(false);
            return;
        }

        scanner.stop()
            .catch(() => {
                // Ignore stop errors when scanner is already stopped.
            })
            .finally(() => {
                scanner.clear().catch(() => {
                    // Ignore clear errors when scanner element is already cleaned up.
                });
                scannerRef.current = null;
                setScannerActive(false);
            });

        setScannerActive(false);
    };

    const tryStartScanner = async (Html5QrcodeClass, cameraConfig) => {
        const scanner = new Html5QrcodeClass(scannerElementId);
        scannerRef.current = scanner;

        await scanner.start(
            cameraConfig,
            {
                fps: 10,
                qrbox: { width: 240, height: 240 },
                aspectRatio: 1,
            },
            (decodedText) => {
                setVerificationPayload(decodedText);
                setVerificationMessage('QR scanned successfully. Review payload and verify pickup.');
                stopQrScanner();
            },
            () => {
                // Ignore frame-by-frame decode misses; scanner continues automatically.
            }
        );
    };

    const startQrScanner = async () => {
        if (!scannerSupported) {
            setScannerError('Camera QR scan is not supported in this browser. Use PIN or paste payload.');
            return;
        }

        try {
            stopQrScanner();
            setScannerError('');
            setScannerActive(true);

            const { Html5Qrcode } = await import('html5-qrcode');

            try {
                await tryStartScanner(Html5Qrcode, { facingMode: { exact: 'environment' } });
            } catch {
                await tryStartScanner(Html5Qrcode, { facingMode: 'environment' });
            }
        } catch {
            stopQrScanner();
            setScannerError('Camera access failed. Allow camera permission, or use PIN/manual payload.');
        }
    };

    const closeVerifyModal = () => {
        stopQrScanner();
        setVerifyingDonation(null);
        setVerificationPayload('');
        setVerificationPin('');
        setVerificationMessage('');
        setScannerError('');
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
                apiUrl(`/api/donations/${verifyingDonation.id}/handoff-verify`),
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

            const refreshToken = localStorage.getItem('jwt_token');
            if (refreshToken) {
                await fetchClaimedDonations(refreshToken);
                await fetchAvailableFood(refreshToken);
                await fetchCompletedDonations(refreshToken);
            }
            setActionMessage('Handoff verified and donation completed.');
        } catch (err) {
            console.error(err);
            setVerificationMessage(getApiErrorMessage(err, 'Verification failed. Please check QR payload or PIN.'));
        } finally {
            setVerifyLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            stopQrScanner();
        };
    }, []);

    if (loading) return <div className="p-8 text-center text-xl">Searching for available food...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    const formatDateTime = (value) => {
        if (!value) {
            return 'Not set';
        }

        return new Date(value).toLocaleString();
    };

    const newFoodRequests = availableFood;
    const inProgressPickups = claimedDonations;
    const receivedFoodRecords = [...completedDonations].sort((a, b) => {
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return bTime - aTime;
    });
    const currentOperationsCount = newFoodRequests.length + inProgressPickups.length;

    return (
        <div className="fb-shell">
            <div className="fb-toolbar">
                <h1 className="fb-title">NGO Pickup Center</h1>
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
                        onClick={() => setShowPreviousTransactions((prev) => !prev)}
                        className={`px-4 py-2 font-bold rounded transition ${
                            showPreviousTransactions
                                ? 'bg-slate-700 text-white hover:bg-slate-800'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        {showPreviousTransactions
                            ? `Current Operations (${currentOperationsCount})`
                            : `Previous Transactions (${receivedFoodRecords.length})`}
                    </button>
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
                <p className="fb-banner-info mb-4">
                    {actionMessage}
                </p>
            )}

            {!showPreviousTransactions && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="fb-surface p-3">
                        <p className="text-xs font-semibold text-blue-800">New Food Requests</p>
                        <p className="text-2xl font-bold text-blue-900">{newFoodRequests.length}</p>
                    </div>
                    <div className="fb-surface p-3">
                        <p className="text-xs font-semibold text-teal-800">In Progress Pickups</p>
                        <p className="text-2xl font-bold text-teal-900">{inProgressPickups.length}</p>
                    </div>
                </div>
            )}

            {showPreviousTransactions && (
                <div className="mb-6 grid grid-cols-1 gap-3">
                    <div className="fb-surface p-3">
                        <p className="text-xs font-semibold text-emerald-800">Received Food Records</p>
                        <p className="text-2xl font-bold text-emerald-900">{receivedFoodRecords.length}</p>
                    </div>
                </div>
            )}

            {showInbox && (
                <div className="mb-6 fb-surface p-4">
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

            {!showPreviousTransactions && inProgressPickups.length > 0 && (
                <div className="mb-6 fb-surface p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-teal-900">In Progress Pickups</h2>
                        <span className="text-xs text-teal-700">{inProgressPickups.length} active</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {inProgressPickups.map((food) => {
                            const pickupOutDone = Boolean(food.pickupOutAt);
                            const receivedDone = Boolean(food.receivedAt);

                            return (
                            <div key={food.id} className="border border-teal-100 rounded-lg p-4 bg-teal-50/40">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        {food.imageData && (
                                            <img
                                                src={food.imageData}
                                                alt={food.description}
                                                className="mb-2 h-28 w-full max-w-xs rounded object-cover"
                                            />
                                        )}
                                        <p className="font-bold text-gray-800">{food.description}</p>
                                        <p className="text-sm text-gray-600">Quantity: {food.quantity}</p>
                                        <p className="text-sm text-gray-600">Donor: {food.donorName}</p>
                                        <p className="text-sm text-gray-600">Donor Phone: {food.donorContactNumber || 'Not shared'}</p>
                                        <p className="text-sm text-gray-600">Receiver: {food.receiverName || 'Assigned NGO'}</p>
                                        <p className="text-sm text-gray-600">Receiver Phone: {food.receiverContactNumber || 'Not shared'}</p>
                                        <p className="text-sm text-gray-600">Pickup Address: {food.pickupAddress || 'Not provided'}</p>
                                        <p className="text-xs text-gray-500 mt-1">Claimed: {formatDateTime(food.claimedAt)}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                        verifiedIds.includes(food.id)
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {verifiedIds.includes(food.id) ? 'VERIFIED' : 'PENDING'}
                                    </span>
                                </div>

                                <div className="mt-3">
                                    <DonationPhaseTimeline donation={food} />
                                </div>

                                <div className="mt-3 grid grid-cols-1 gap-2">
                                    <button
                                        onClick={() => handleMarkPickupOut(food.id)}
                                        disabled={pickupOutDone}
                                        className="w-full py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {pickupOutDone ? 'Pickup Out Marked' : 'Mark Pickup Out'}
                                    </button>
                                    <button
                                        onClick={() => handleMarkReceived(food.id)}
                                        disabled={!pickupOutDone || receivedDone}
                                        className="w-full py-2 bg-cyan-100 text-cyan-800 text-sm font-semibold rounded hover:bg-cyan-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {receivedDone ? 'Received Marked' : 'Mark Received'}
                                    </button>
                                    <button
                                        onClick={() => openVerifyModal(food)}
                                        disabled={!pickupOutDone || !receivedDone}
                                        className="w-full py-2 bg-teal-600 text-white text-sm font-semibold rounded hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

            {!showPreviousTransactions && inProgressPickups.length === 0 && (
                <div className="mb-6 bg-teal-50 text-teal-800 p-5 rounded-lg text-center border border-teal-200">
                    No in-progress pickups right now.
                </div>
            )}

            {showPreviousTransactions && (
            <div className="mb-6 fb-surface p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-emerald-900">Previous Transactions</h2>
                    <span className="text-xs text-emerald-700">{receivedFoodRecords.length} completed</span>
                </div>

                {receivedFoodRecords.length === 0 ? (
                    <p className="text-sm text-emerald-800">No completed pickups yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {receivedFoodRecords.map((food) => (
                            <div key={food.id} className="border border-emerald-100 rounded-lg p-4 bg-emerald-50/40">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        {food.imageData && (
                                            <img
                                                src={food.imageData}
                                                alt={food.description}
                                                className="mb-2 h-28 w-full max-w-xs rounded object-cover"
                                            />
                                        )}
                                        <p className="font-bold text-gray-800">{food.description}</p>
                                        <p className="text-sm text-gray-600">Quantity: {food.quantity}</p>
                                        <p className="text-sm text-gray-600">Donor: {food.donorName}</p>
                                        <p className="text-sm text-gray-600">Donor Phone: {food.donorContactNumber || 'Not shared'}</p>
                                        <p className="text-sm text-gray-600">Receiver: {food.receiverName || 'Assigned NGO'}</p>
                                        <p className="text-sm text-gray-600">Receiver Phone: {food.receiverContactNumber || 'Not shared'}</p>
                                        <p className="text-sm text-gray-600">Pickup Address: {food.pickupAddress || 'Not provided'}</p>
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                        COMPLETED
                                    </span>
                                </div>

                                <div className="mt-3">
                                    <DonationPhaseTimeline donation={food} compact />
                                </div>

                                <p className="mt-3 text-xs text-gray-500">Completed: {formatDateTime(food.completedAt)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            )}

            {!showPreviousTransactions && alerts.length > 0 && (
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

            {!showPreviousTransactions && (
            <div className="mb-2">
                <h2 className="text-lg font-bold text-gray-800">New Food Requests</h2>
                <p className="text-sm text-gray-500">Claim newly published donations from nearby donors.</p>
            </div>
            )}

            {!showPreviousTransactions && (newFoodRequests.length === 0 ? (
                <div className="bg-blue-50 text-blue-800 p-6 rounded-lg text-center">
                    <p className="text-xl font-semibold">No food is currently available.</p>
                    <p className="mt-2">Check back later when bakeries post new surplus!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {newFoodRequests.map((food) => (
                        <div key={food.id} className="fb-surface p-6 flex flex-col justify-between hover:shadow-lg transition">
                            <div>
                                {food.imageData && (
                                    <img
                                        src={food.imageData}
                                        alt={food.description}
                                        className="mb-3 h-36 w-full rounded-lg object-cover"
                                    />
                                )}
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-gray-800">{food.description}</h3>
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                    AVAILABLE
                  </span>
                                </div>
                                <p className="text-gray-600 mb-1"><span className="font-semibold">Quantity:</span> {food.quantity}</p>
                                <p className="text-gray-600 mb-4"><span className="font-semibold">Donor:</span> {food.donorName}</p>
                                <p className="text-gray-600 mb-1"><span className="font-semibold">Donor Phone:</span> {food.donorContactNumber || 'Not shared'}</p>
                                <p className="text-gray-600 mb-2"><span className="font-semibold">Pickup Address:</span> {food.pickupAddress || 'Not provided'}</p>
                                <p className="text-xs text-gray-500 mb-2">
                                    <span className="font-semibold">Expires:</span> {formatDateTime(food.expiresAt)}
                                </p>
                                <DonationPhaseTimeline donation={food} compact />
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
            ))}

            {verifyingDonation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="fb-surface w-full max-w-lg p-6">
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
                            Open donor "Show Handoff QR", then scan it here using your NGO device camera.
                        </p>

                        <div className="space-y-3">
                            <div className="rounded border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs text-slate-700 mb-2">
                                    If camera scan is available, click Scan QR with Camera. The scanned payload will auto-fill.
                                </p>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={startQrScanner}
                                        disabled={scannerActive || !scannerSupported}
                                        className="px-3 py-2 bg-slate-700 text-white text-xs font-semibold rounded hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {scannerActive ? 'Scanning...' : 'Scan QR with Camera'}
                                    </button>
                                    <button
                                        onClick={stopQrScanner}
                                        disabled={!scannerActive}
                                        className="px-3 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Stop Camera
                                    </button>
                                </div>
                                {!scannerSupported && (
                                    <p className="text-xs text-amber-700">
                                        Your browser does not support camera QR detection. Use backup PIN or paste payload manually.
                                    </p>
                                )}
                                {scannerError && (
                                    <p className="text-xs text-red-600">{scannerError}</p>
                                )}
                                {scannerActive && (
                                    <div id={scannerElementId} className="w-full mt-2 rounded border border-slate-200 overflow-hidden" />
                                )}
                            </div>

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