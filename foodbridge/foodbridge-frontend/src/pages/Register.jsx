import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../utils/errorMessage';

const Register = () => {
    // 1. Setting up React State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        organizationName: '',
        contactNumber: '',
        role: 'DONOR', // Default value
        latitude: '',
        longitude: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // 2. Handling Input Changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 3. Handling the Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Stops the page from refreshing
        try {
            const payload = {
                ...formData,
                latitude: formData.latitude === '' ? null : Number(formData.latitude),
                longitude: formData.longitude === '' ? null : Number(formData.longitude)
            };

            // Send the POST request to Spring Boot
            const response = await axios.post('http://localhost:8080/api/auth/register', payload);

            // ---> NEW: Save BOTH the token and the role
            localStorage.setItem('jwt_token', response.data.token);
            localStorage.setItem('user_role', response.data.role);

            // Redirect to a dashboard (we will build this later)
            navigate('/');

        } catch (err) {
            console.error(err);
            setError(getApiErrorMessage(err, 'Registration failed. Please check your details.'));
        }
    };

    // 4. The UI (Tailwind CSS)
    return (
        <div className="flex flex-col items-center justify-center w-full max-w-md p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Create an Account</h2>

            {/* Show error message if registration fails */}
            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                <input
                    type="email" name="email" placeholder="Email Address" required
                    className="p-3 border rounded border-gray-300 focus:outline-none focus:border-blue-500"
                    value={formData.email} onChange={handleChange}
                />
                <input
                    type="password" name="password" placeholder="Password" required
                    className="p-3 border rounded border-gray-300 focus:outline-none focus:border-blue-500"
                    value={formData.password} onChange={handleChange}
                />
                <input
                    type="text" name="organizationName" placeholder="Organization Name (e.g. Joe's Bakery)" required
                    className="p-3 border rounded border-gray-300 focus:outline-none focus:border-blue-500"
                    value={formData.organizationName} onChange={handleChange}
                />
                <input
                    type="text" name="contactNumber" placeholder="Phone Number" required
                    className="p-3 border rounded border-gray-300 focus:outline-none focus:border-blue-500"
                    value={formData.contactNumber} onChange={handleChange}
                />

                <select
                    name="role"
                    className="p-3 border rounded border-gray-300 focus:outline-none focus:border-blue-500"
                    value={formData.role} onChange={handleChange}
                >
                    <option value="DONOR">Food Donor (Restaurant/Bakery)</option>
                    <option value="NGO">NGO / Food Bank</option>
                </select>

                <input
                    type="number" step="any" name="latitude" placeholder="Latitude (optional, e.g. 18.5204)"
                    className="p-3 border rounded border-gray-300 focus:outline-none focus:border-blue-500"
                    value={formData.latitude} onChange={handleChange}
                />
                <input
                    type="number" step="any" name="longitude" placeholder="Longitude (optional, e.g. 73.8567)"
                    className="p-3 border rounded border-gray-300 focus:outline-none focus:border-blue-500"
                    value={formData.longitude} onChange={handleChange}
                />

                <button type="submit" className="mt-4 p-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition">
                    Register
                </button>
            </form>
        </div>
    );
};

export default Register;