import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import Register from './pages/Register';
import Login from './pages/Login';
import DonorDashboard from "./pages/DonorDashboard.jsx";
import LogSurplus from "./pages/LogSurplus.jsx";
import NgoDashboard from "./pages/NgoDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import { getApiErrorMessage } from './utils/errorMessage';

// ---> NEW COMPONENT: The Global Interceptor <---
const AxiosInterceptor = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
        // Set up the watcher
        const interceptor = axios.interceptors.response.use(
            (response) => response, // If the request is successful, just pass it through
            (error) => {
                // Only auto-logout for 401 (expired/invalid session).
                if (error.response && error.response.status === 401) {
                    const authMessage = getApiErrorMessage(error, 'Your session has expired. Please log in again.');
                    sessionStorage.setItem('auth_message', authMessage);
                    localStorage.clear(); // Wipe the dead token
                    navigate('/login', { replace: true });   // Kick them to the login page
                }
                return Promise.reject(error);
            }
        );

        // Clean up the watcher when the app closes
        return () => axios.interceptors.response.eject(interceptor);
    }, [navigate]);

    return children;
};

// --- NEW COMPONENT: The Traffic Cop ---
// This acts as a wrapper around the Home route to decide which dashboard to show
const HomeRouter = () => {
    const role = localStorage.getItem('user_role');

    if (role === 'NGO') {
        return <NgoDashboard />;
    } else if (role === 'DONOR') {
        return <DonorDashboard />;
    } else if (role === 'ADMIN') {
        return <AdminDashboard />;
    } else {
        // If they have no role (not logged in), send them to login
        return <Navigate to="/login" />;
    }
};

function App() {
  return (
      <Router>
          <AxiosInterceptor>
                        <div className="fb-app">
                            <div className="fb-page-wrap">
                                <Routes>
                                    <Route path="/" element={<HomeRouter />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/log-surplus" element={<LogSurplus />} />
                                    <Route path="*" element={<Navigate to="/" />} />
                                </Routes>
                            </div>
            </div>
        </AxiosInterceptor>
      </Router>
  );
}

export default App;