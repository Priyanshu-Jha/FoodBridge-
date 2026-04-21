import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiErrorMessage } from '../utils/errorMessage';
import { apiUrl } from '../config/api';

const toDateTimeLocal = (value) => {
    if (!value) {
        return '';
    }

    return String(value).slice(0, 16);
};

const LogSurplus = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const editMode = location.state?.editMode || false;
    const foodData = location.state?.foodData || null;
    const [serverError, setServerError] = useState('');
    const [imageData, setImageData] = useState(foodData?.imageData || '');

    const { register, handleSubmit, setValue, formState: { errors } } = useForm({
        defaultValues: {
            description: foodData ? foodData.description : '',
            quantity: foodData ? foodData.quantity : '',
            pickupAddress: foodData?.pickupAddress ?? '',
            expiresAt: toDateTimeLocal(foodData?.expiresAt),
        }
    });

    useEffect(() => {
        const prefillFromMyProfile = async () => {
            if (editMode) {
                return;
            }

            const token = localStorage.getItem('jwt_token');
            if (!token) {
                return;
            }

            try {
                const me = await axios.get(apiUrl('/api/users/me'), {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (me.data?.organizationAddress) {
                    setValue('pickupAddress', String(me.data.organizationAddress));
                }
            } catch {
                // Ignore prefill failures and keep form usable.
            }
        };

        prefillFromMyProfile();
    }, [editMode, setValue]);

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            setServerError('Please upload a valid image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            setImageData(result);
            setServerError('');
        };
        reader.onerror = () => {
            setServerError('Could not read the selected image. Please try another file.');
        };
        reader.readAsDataURL(file);
    };

    const onSubmit = async (data) => {
        setServerError('');
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            navigate('/login');
            return;
        }

        const payload = {
            description: data.description,
            quantity: data.quantity,
            pickupAddress: data.pickupAddress,
            imageData,
            expiresAt: data.expiresAt || null,
        };

        try {
            if (editMode) {
                await axios.put(apiUrl(`/api/donations/${foodData.id}`), payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(apiUrl('/api/donations'), payload, {
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
        <div className="fb-shell max-w-3xl">

            {/* ---> NEW BACK BUTTON <--- */}
            <button
                onClick={() => navigate('/')}
                className="mb-4 text-indigo-600 hover:text-indigo-800 font-semibold flex items-center transition fb-link"
            >
                &larr; Back to Dashboard
            </button>

            {/* Existing Form Card */}
            <div className="fb-surface p-8">
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
                            className="w-full p-2 fb-input"
                            placeholder="e.g., 20 loaves of bread"
                        />
                        {errors.description && <span className="text-red-500 text-sm">Required</span>}
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2">Quantity</label>
                        <input
                            {...register('quantity', { required: true })}
                            className="w-full p-2 fb-input"
                            placeholder="e.g., 10 kg"
                        />
                        {errors.quantity && <span className="text-red-500 text-sm">Required</span>}
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2">Pickup Address</label>
                        <input
                            {...register('pickupAddress', { required: true })}
                            className="w-full p-2 fb-input"
                            placeholder="e.g., 12 Main Road, Pune"
                        />
                        {errors.pickupAddress && <span className="text-red-500 text-sm">Required</span>}
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2">Food Image (optional)</label>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="w-full p-2 fb-input" />
                        {imageData && (
                            <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-2">
                                <img src={imageData} alt="Food preview" className="max-h-52 rounded" />
                                <button
                                    type="button"
                                    onClick={() => setImageData('')}
                                    className="mt-2 text-xs font-semibold text-red-700 hover:text-red-900"
                                >
                                    Remove Image
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2">Expiry Date & Time (optional)</label>
                        <input
                            type="datetime-local"
                            {...register('expiresAt')}
                            className="w-full p-2 fb-input"
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        Expired listings are automatically hidden from claims.
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