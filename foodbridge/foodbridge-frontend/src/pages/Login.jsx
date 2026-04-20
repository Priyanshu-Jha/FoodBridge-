import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { getApiErrorMessage } from '../utils/errorMessage';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const authMessage = sessionStorage.getItem('auth_message');
        if (authMessage) {
            setError(authMessage);
            sessionStorage.removeItem('auth_message');
        }
    }, []);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Send the login request to the new endpoint
            const response = await axios.post('http://localhost:8080/api/auth/login', credentials);

            // Save the fresh token
            localStorage.setItem('jwt_token', response.data.token);
            localStorage.setItem('user_role', response.data.role);

            navigate('/');

        } catch (err) {
            console.error(err);
            setError(getApiErrorMessage(err, 'Invalid email or password.'));
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-md p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Welcome Back</h2>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                <input
                    type="email" name="email" placeholder="Email Address" required
                    className="p-3 border rounded border-gray-300 focus:outline-none focus:border-blue-500"
                    value={credentials.email} onChange={handleChange}
                />
                <input
                    type="password" name="password" placeholder="Password" required
                    className="p-3 border rounded border-gray-300 focus:outline-none focus:border-blue-500"
                    value={credentials.password} onChange={handleChange}
                />

                <button type="submit" className="mt-4 p-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition">
                    Login
                </button>
            </form>

            <p className="mt-4 text-sm text-gray-600">
                Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register here</Link>
            </p>
        </div>
    );
};

export default Login;