import { useEffect, useState } from 'react';
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

    const { register, handleSubmit, setValue, formState: { errors } } = useForm({
        defaultValues: {
            description: foodData ? foodData.description : '',
            quantity: foodData ? foodData.quantity : '',
            latitude: foodData?.latitude ?? '',
            longitude: foodData?.longitude ?? '',
        }
    });

    useEffect(() => {
        const prefillFromMyLocation = async () => {
            if (editMode) {
                return;
            }

            const token = localStorage.getItem('jwt_token');
            if (!token) {
                return;
            }

            try {
                const me = await axios.get('http://localhost:8080/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (me.data?.latitude != null && me.data?.longitude != null) {
                    setValue('latitude', String(me.data.latitude));
                    setValue('longitude', String(me.data.longitude));
                }
            } catch (error) {
                // Ignore location prefill failures and keep form usable.
            }
        };

        prefillFromMyLocation();
    }, [editMode, setValue]);

    const onSubmit = async (data) => {
        setServerError('');
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            navigate('/login');
            return;
        }

        const latitude = data.latitude === '' ? null : Number(data.latitude);
        const longitude = data.longitude === '' ? null : Number(data.longitude);

        if ((latitude === null) !== (longitude === null)) {
            setServerError('Please provide both latitude and longitude, or leave both empty.');
            return;
        }

        const payload = {
            description: data.description,
            quantity: data.quantity,
            latitude,
            longitude,
        };

        try {
            if (editMode) {
                await axios.put(`http://localhost:8080/api/donations/${foodData.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('http://localhost:8080/api/donations', payload, {
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
                    <div>
                        <label className="block text-gray-700 mb-2">Pickup Latitude (optional)</label>
                        <input
                            type="number"
                            step="any"
                            {...register('latitude')}
                            className="w-full p-2 border rounded"
                            placeholder="e.g., 18.5204"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2">Pickup Longitude (optional)</label>
                        <input
                            type="number"
                            step="any"
                            {...register('longitude')}
                            className="w-full p-2 border rounded"
                            placeholder="e.g., 73.8567"
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        If left blank, we will use your saved account location when available.
                    </p>
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