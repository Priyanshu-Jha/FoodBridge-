import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import DonationPhaseTimeline from '../components/DonationPhaseTimeline';
import { getApiErrorMessage } from '../utils/errorMessage';
import { apiUrl } from '../config/api';

const DonorDashboard = () => {
    const [donations, setDonations] = useState([]);
    const [showPreviousTransactions, setShowPreviousTransactions] = useState(false);
    const [handoffQrData, setHandoffQrData] = useState(null);
    const [handoffQrLoadingId, setHandoffQrLoadingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const navigate = useNavigate();
    const REFRESH_INTERVAL_MS = 5000;

    const nonExpiredDonations = donations.filter((food) => food.status !== 'EXPIRED');
    const activeDonations = nonExpiredDonations.filter((food) => food.status !== 'COMPLETED');
    const completedDonations = [...nonExpiredDonations]
        .filter((food) => food.status === 'COMPLETED')
        .sort((a, b) => {
            const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            return bTime - aTime;
        });
    const visibleDonations = showPreviousTransactions ? completedDonations : activeDonations;

    const formatDateTime = (value) => {
        if (!value) {
            return 'Not set';
        }

        return new Date(value).toLocaleString();
    };

    const fetchMyDonations = useCallback(async (silent = false) => {
        const token = localStorage.getItem('jwt_token');

        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.get(apiUrl('/api/donations/me'), {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setDonations(response.data);
            if (!silent) {
                setError('');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            if (!silent) {
                setError(getApiErrorMessage(err, 'Failed to load your dashboard. Please log in again.'));
                setLoading(false);
            }
        }
    }, [navigate]);

    useEffect(() => {
        fetchMyDonations();

        const refreshId = window.setInterval(() => {
            fetchMyDonations(true);
        }, REFRESH_INTERVAL_MS);

        const handleWindowFocus = () => {
            fetchMyDonations(true);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchMyDonations(true);
            }
        };

        window.addEventListener('focus', handleWindowFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.clearInterval(refreshId);
            window.removeEventListener('focus', handleWindowFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchMyDonations]);

    const handleDelete = async (foodId) => {
        if (!window.confirm("Are you sure you want to delete this listing?")) return;

        const token = localStorage.getItem('jwt_token');
        try {
            await axios.delete(apiUrl(`/api/donations/${foodId}`), {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Re-fetch from backend so dashboard always reflects persisted DB state
            await fetchMyDonations();
            setActionMessage('Listing deleted successfully.');
        } catch (err) {
            console.error(err);
            setActionMessage(getApiErrorMessage(err, 'Failed to delete listing.'));
        }
    };

    const handleEdit = (food) => {
        navigate('/log-surplus', { state: { editMode: true, foodData: food } });
    };

    const handleShowHandoffQr = async (food) => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setHandoffQrLoadingId(food.id);
            const response = await axios.get(apiUrl(`/api/donations/${food.id}/handoff-qr`), {
                headers: { Authorization: `Bearer ${token}` }
            });

            setHandoffQrData({
                donationId: response.data.donationId,
                handoffPin: response.data.handoffPin,
                payload: response.data.payload,
                description: food.description,
                quantity: food.quantity,
            });
            setActionMessage('Handoff QR generated successfully.');
        } catch (err) {
            console.error(err);
            setActionMessage(getApiErrorMessage(err, 'Failed to load handoff QR. Please try again.'));
        } finally {
            setHandoffQrLoadingId(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-xl">Loading your dashboard...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="fb-shell">
            <div className="fb-toolbar">
                <h1 className="fb-title">My Donations</h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => fetchMyDonations(true)}
                        className="px-4 py-2 bg-sky-100 text-sky-800 font-bold rounded hover:bg-sky-200 transition"
                    >
                        Refresh Now
                    </button>
                    <button
                        onClick={() => setShowPreviousTransactions((prev) => !prev)}
                        className={`px-4 py-2 font-bold rounded transition ${
                            showPreviousTransactions
                                ? 'bg-slate-700 text-white hover:bg-slate-800'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        {showPreviousTransactions
                            ? `Current Donations (${activeDonations.length})`
                            : `Previous Transactions (${completedDonations.length})`}
                    </button>
                    <button
                        onClick={() => navigate('/log-surplus')}
                        className="px-4 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition"
                    >
                        + Log New Surplus
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem('jwt_token');
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

            {visibleDonations.length === 0 ? (
                <p className="text-gray-500 text-lg">
                    {showPreviousTransactions
                        ? 'No completed transactions yet.'
                        : "No active donations right now. Use '+ Log New Surplus' to post food."}
                </p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleDonations.map((food) => (
                        <div key={food.id} className="fb-surface p-6 flex flex-col justify-between">
                            <div>
                                {food.imageData && (
                                    <img
                                        src={food.imageData}
                                        alt={food.description}
                                        className="mb-3 h-36 w-full rounded-lg object-cover"
                                    />
                                )}
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{food.description}</h3>
                                <p className="text-gray-600 mb-1"><span className="font-semibold">Quantity:</span> {food.quantity}</p>
                                <p className="text-gray-600 mb-1"><span className="font-semibold">Pickup Address:</span> {food.pickupAddress || 'Not provided'}</p>
                                <p className="text-gray-600 mb-1"><span className="font-semibold">Your Contact:</span> {food.donorContactNumber || 'Not shared'}</p>
                                <p className="text-gray-600 mb-4"><span className="font-semibold">Status:</span>
                                    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold 
                    ${food.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                        food.status === 'CLAIMED' ? 'bg-yellow-100 text-yellow-700' :
                                            food.status === 'EXPIRED' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-700'}`}>
                                        {food.status}
                                    </span>
                                </p>
                                <p className="text-gray-600 mb-1"><span className="font-semibold">Receiver:</span> {food.receiverName || 'Not assigned yet'}</p>
                                <p className="text-gray-600 mb-1"><span className="font-semibold">Receiver Phone:</span> {food.receiverContactNumber || 'Not assigned yet'}</p>
                                <p className="text-gray-600 mb-3"><span className="font-semibold">Expires:</span> {formatDateTime(food.expiresAt)}</p>
                                <DonationPhaseTimeline donation={food} compact />
                            </div>
                            <div className="flex flex-col mt-4 gap-2">
                                <p className="text-xs text-gray-400 text-right mb-2">ID: {food.id.substring(0, 8)}...</p>

                                {food.status === 'AVAILABLE' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(food)}
                                            className="w-1/2 py-2 bg-gray-500 text-white font-bold rounded hover:bg-gray-600 transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(food.id)}
                                            className="w-1/2 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}

                                {food.status === 'CLAIMED' && (
                                    <>
                                        <button
                                            onClick={() => handleShowHandoffQr(food)}
                                            disabled={handoffQrLoadingId === food.id}
                                            className="w-full py-2 bg-sky-600 text-white font-bold rounded hover:bg-sky-700 transition disabled:bg-sky-300"
                                        >
                                            {handoffQrLoadingId === food.id ? 'Generating QR...' : 'Show Handoff QR'}
                                        </button>
                                        <p className="w-full py-2 px-3 text-xs text-indigo-700 bg-indigo-50 rounded border border-indigo-100">
                                            Waiting for NGO handoff verification. This card auto-moves to Previous Transactions after verification.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {handoffQrData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="fb-surface w-full max-w-md p-6">
                        <div className="flex items-start justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Secure Handoff QR</h2>
                            <button
                                onClick={() => setHandoffQrData(null)}
                                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Show this QR to the NGO during pickup for secure transfer verification.
                        </p>

                        <div className="flex justify-center mb-4">
                            <div className="p-3 border rounded-lg bg-white">
                                <QRCodeSVG value={handoffQrData.payload} size={220} includeMargin />
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <p><span className="font-semibold">Food:</span> {handoffQrData.description} ({handoffQrData.quantity})</p>
                            <p><span className="font-semibold">Donation ID:</span> {handoffQrData.donationId}</p>
                            <p>
                                <span className="font-semibold">Backup PIN:</span>{' '}
                                <span className="tracking-widest font-bold text-indigo-700">{handoffQrData.handoffPin}</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DonorDashboard;