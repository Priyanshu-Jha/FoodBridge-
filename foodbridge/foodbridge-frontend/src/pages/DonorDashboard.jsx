import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DonorDashboard = () => {
    // 1. State for holding the data from the backend
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // 2. Fetch data when the component loads
    useEffect(() => {
        const fetchMyDonations = async () => {
            // Grab the badge (JWT) from local storage
            const token = localStorage.getItem('jwt_token');

            // If they aren't logged in, kick them back to the login page
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                // Make the GET request, attaching the token to the Headers
                const response = await axios.get('http://localhost:8080/api/donations/me', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // Save the data to React State
                setDonations(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching data", err);
                setError("Failed to load your dashboard. Please log in again.");
                setLoading(false);
            }
        };

        fetchMyDonations();
    }, [navigate]); // The empty array means "Only run this once when the page loads"

    // ---> NEW FUNCTION TO COMPLETE THE DONATION <---
    const handleComplete = async (foodId) => {
        const token = localStorage.getItem('jwt_token');

        try {
            // Send the PUT request
            await axios.put(`http://localhost:8080/api/donations/${foodId}/complete`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update the UI instantly by changing the status of that specific card
            setDonations((prevDonations) =>
                prevDonations.map(food =>
                    food.id === foodId ? { ...food, status: 'COMPLETED' } : food
                )
            );

            alert("Handoff successful! Thank you for reducing food waste.");
        } catch (err) {
            console.error(err);
            alert("Failed to complete the donation.");
        }
    };

    // 3. The UI Rendering
    if (loading) return <div className="p-8 text-center text-xl">Loading your dashboard...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-800">My Donations</h1>
                <div className="flex gap-4">
                    {/* NEW BUTTON */}
                    <button
                        onClick={() => navigate('/log-surplus')}
                        className="px-4 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition"
                    >
                        + Log New Surplus
                    </button>

                    {/* Existing Logout Button */}
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

            {/* Tailwind CSS Grid for displaying cards */}
            {donations.length === 0 ? (
                <p className="text-gray-500 text-lg">You haven't posted any food yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {donations.map((food) => (
                        <div key={food.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{food.description}</h3>
                                <p className="text-gray-600 mb-1"><span className="font-semibold">Quantity:</span> {food.quantity}</p>
                                <p className="text-gray-600 mb-4"><span className="font-semibold">Status:</span>
                                    {/* Color-coding the status dynamically */}
                                    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold 
                    ${food.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                        food.status === 'CLAIMED' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'}`}>
                    {food.status}
                  </span>
                                </p>
                            </div>
                            <div className="flex flex-col mt-4">
                                <p className="text-xs text-gray-400 text-right mb-2">ID: {food.id.substring(0, 8)}...</p>

                                {/* ---> NEW CONDITIONAL BUTTON <--- */}
                                {food.status === 'CLAIMED' && (
                                    <button
                                        onClick={() => handleComplete(food.id)}
                                        className="w-full py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 transition"
                                    >
                                        Confirm Handoff
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DonorDashboard;