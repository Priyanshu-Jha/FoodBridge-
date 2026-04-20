import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiErrorMessage } from '../utils/errorMessage';

const LogSurplus = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const editMode = location.state?.editMode || false;
    const foodData = location.state?.foodData || null;
    const [serverError, setServerError] = useState('');

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            description: foodData ? foodData.description : '',
            quantity: foodData ? foodData.quantity : ''
        }
    });

    const onSubmit = async (data) => {
        setServerError('');
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            if (editMode) {
                await axios.put(`http://localhost:8080/api/donations/${foodData.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('http://localhost:8080/api/donations', data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            navigate('/');
        } catch (error) {
            console.error(error);
            setServerError(
                getApiErrorMessage(error, editMode ? 'Failed to update listing.' : 'Failed to log surplus.')
            );
        }
    };

    return (
        <div className="w-full max-w-md mx-auto mt-10">

            {/* ---> NEW BACK BUTTON <--- */}
            <button
                onClick={() => navigate('/')}
                className="mb-4 text-indigo-600 hover:text-indigo-800 font-semibold flex items-center transition"
            >
                &larr; Back to Dashboard
            </button>

            {/* Existing Form Card */}
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    {editMode ? 'Edit Surplus Food' : 'Log Surplus Food'}
                </h2>
                {serverError && (
                    <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {serverError}
                    </p>
                )}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-2">Description</label>
                        <input
                            {...register('description', { required: true })}
                            className="w-full p-2 border rounded"
                            placeholder="e.g., 20 loaves of bread"
                        />
                        {errors.description && <span className="text-red-500 text-sm">Required</span>}
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2">Quantity</label>
                        <input
                            {...register('quantity', { required: true })}
                            className="w-full p-2 border rounded"
                            placeholder="e.g., 10 kg"
                        />
                        {errors.quantity && <span className="text-red-500 text-sm">Required</span>}
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition"
                    >
                        {editMode ? 'Update Listing' : 'Submit Listing'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LogSurplus;