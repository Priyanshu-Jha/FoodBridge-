import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const LogSurplus = () => {
    // 1. Initialize React Hook Form
    const { register, handleSubmit, formState: { errors } } = useForm();

    const [serverError, setServerError] = useState('');
    const navigate = useNavigate();

    // 2. The Submission Function
    const onSubmit = async (data) => {
        const token = localStorage.getItem('jwt_token');

        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // POST the data to our Day 9 Spring Boot endpoint
            await axios.post('http://localhost:8080/api/donations', data, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            alert('Food successfully logged!');
            navigate('/'); // Send them back to the dashboard

        } catch (err) {
            console.error(err);
            setServerError('Failed to log food. Please try again.');
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto p-8 mt-10 bg-white rounded-lg shadow-md border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Log Surplus Food</h2>
                <Link to="/" className="text-blue-600 hover:underline text-sm">Back to Dashboard</Link>
            </div>

            {serverError && <p className="text-red-500 mb-4">{serverError}</p>}

            {/* 3. The Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

                {/* Description Field */}
                <div>
                    <label className="block text-gray-700 font-bold mb-2">What food do you have?</label>
                    <input
                        type="text"
                        placeholder="e.g., 50 Loaves of Sourdough Bread"
                        className={`w-full p-3 border rounded focus:outline-none focus:border-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                        // React Hook Form magic: register this input
                        {...register("description", { required: "Description is required" })}
                    />
                    {/* Validation Error Message */}
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                </div>

                {/* Quantity Field */}
                <div>
                    <label className="block text-gray-700 font-bold mb-2">Estimated Quantity</label>
                    <input
                        type="text"
                        placeholder="e.g., 50 lbs, 3 trays, etc."
                        className={`w-full p-3 border rounded focus:outline-none focus:border-blue-500 ${errors.quantity ? 'border-red-500' : 'border-gray-300'}`}
                        {...register("quantity", { required: "Quantity is required" })}
                    />
                    {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
                </div>

                <button type="submit" className="mt-4 p-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition">
                    Post Food
                </button>
            </form>
        </div>
    );
};

export default LogSurplus;