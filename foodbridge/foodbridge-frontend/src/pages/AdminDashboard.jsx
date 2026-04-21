import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/api';
import { getApiErrorMessage } from '../utils/errorMessage';

const AdminDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const loadAdminProfile = async () => {
            const token = localStorage.getItem('jwt_token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await axios.get(apiUrl('/api/admin/profile'), {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setProfile(response.data.profile || null);
                setStats(response.data.stats || null);
                setError('');
            } catch (err) {
                setError(getApiErrorMessage(err, 'Failed to load admin profile.'));
            } finally {
                setLoading(false);
            }
        };

        loadAdminProfile();
    }, [navigate]);

    if (loading) {
        return <div className="p-8 text-center text-xl">Loading admin dashboard...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="fb-shell">
            <div className="fb-toolbar">
                <h1 className="fb-title">Admin Profile</h1>
                <button
                    onClick={() => {
                        localStorage.clear();
                        navigate('/login');
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                    Logout
                </button>
            </div>

            {profile && (
                <div className="fb-surface p-5 mb-5">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">Administrator Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                        <p><span className="font-semibold">Organization:</span> {profile.organizationName}</p>
                        <p><span className="font-semibold">Email:</span> {profile.email}</p>
                        <p><span className="font-semibold">Contact:</span> {profile.contactNumber || 'Not provided'}</p>
                        <p><span className="font-semibold">Address:</span> {profile.organizationAddress || 'Not provided'}</p>
                    </div>
                </div>
            )}

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="fb-surface p-4">
                        <p className="text-xs font-semibold text-slate-500">Total Users</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.usersTotal}</p>
                    </div>
                    <div className="fb-surface p-4">
                        <p className="text-xs font-semibold text-slate-500">Donors</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.donors}</p>
                    </div>
                    <div className="fb-surface p-4">
                        <p className="text-xs font-semibold text-slate-500">NGOs</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.ngos}</p>
                    </div>
                    <div className="fb-surface p-4">
                        <p className="text-xs font-semibold text-slate-500">Admins</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.admins}</p>
                    </div>
                    <div className="fb-surface p-4">
                        <p className="text-xs font-semibold text-slate-500">Total Listings</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.listingsTotal}</p>
                    </div>
                    <div className="fb-surface p-4">
                        <p className="text-xs font-semibold text-slate-500">Completed Listings</p>
                        <p className="text-2xl font-bold text-emerald-700">{stats.completedListings}</p>
                    </div>
                    <div className="fb-surface p-4">
                        <p className="text-xs font-semibold text-slate-500">Available Listings</p>
                        <p className="text-2xl font-bold text-blue-700">{stats.availableListings}</p>
                    </div>
                    <div className="fb-surface p-4">
                        <p className="text-xs font-semibold text-slate-500">Claimed Listings</p>
                        <p className="text-2xl font-bold text-amber-700">{stats.claimedListings}</p>
                    </div>
                    <div className="fb-surface p-4">
                        <p className="text-xs font-semibold text-slate-500">Expired Listings</p>
                        <p className="text-2xl font-bold text-rose-700">{stats.expiredListings}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
