import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NgoDashboard = () => {
    const [availableFood, setAvailableFood] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAvailableFood = async () => {
            const token = localStorage.getItem('jwt_token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                // Calling the /available endpoint we built on Day 9!
                const response = await axios.get('http://localhost:8080/api/donations/available', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setAvailableFood(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching data", err);
                setError("Failed to load the food feed.");
                setLoading(false);
            }
        };

        fetchAvailableFood();
    }, [navigate]);

    // ---> NEW FUNCTION TO HANDLE THE BUTTON CLICK <---
    const handleClaim = async (foodId) => {
        const token = localStorage.getItem('jwt_token');

        try {
            // Send a PUT request to the backend with the specific food ID
            await axios.put(`http://localhost:8080/api/donations/${foodId}/claim`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Optimistic UI Update: Instantly remove this food from the screen
            // so no one else accidentally clicks it while the page reloads.
            setAvailableFood((prevFood) => prevFood.filter(food => food.id !== foodId));

            alert("Food successfully claimed! Please arrange pickup with the donor.");
        } catch (err) {
            console.error(err);
            alert("Failed to claim food. Another NGO might have just taken it.");
        }
    };

    if (loading) return <div className="p-8 text-center text-xl">Searching for available food...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-800">Available Donations</h1>
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
        </div>
    );
};

export default NgoDashboard;