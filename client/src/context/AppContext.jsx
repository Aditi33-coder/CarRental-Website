import { createContext, useContext, useEffect, useState } from "react";
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from "react-router-dom";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const navigate = useNavigate();
    const currency = import.meta.env.VITE_CURRENCY;

    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [isOwner, setIsOwner] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [pickupDate, setPickupDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        axios.defaults.headers.common['Authorization'] = '';
        toast.success('You have been logged out');
        navigate('/');
    };

    // This function can be called by components to refresh user data
    const fetchUser = async () => {
        try {
            const { data } = await axios.get('/api/user/data');
            if (data.success) {
                setUser(data.user);
                setIsOwner(data.user.role === 'owner');
            } else {
                toast.error("Could not refresh user details.");
            }
        } catch (error) {
            toast.error("Error refreshing user details.");
        }
    };


    useEffect(() => {
        // This effect strictly validates the session on load or when the token changes.
        // A failure here means the session is invalid, so we log the user out.
        const validateSession = async () => {
            if (token) {
                axios.defaults.headers.common['Authorization'] = `${token}`;
                try {
                    const { data } = await axios.get('/api/user/data');
                    if (data.success) {
                        setUser(data.user);
                        setIsOwner(data.user.role === 'owner');
                    } else {
                        logout(); // Token is present but invalid
                    }
                } catch (error) {
                    logout(); // API call failed, session is unreliable
                }
            }
            setLoading(false);
        };

        if (token) {
            validateSession();
        } else {
            setLoading(false); // No token, so not loading
        }
    }, [token]);

    useEffect(() => {
        const fetchCars = async () => {
            try {
                const { data } = await axios.get('/api/user/cars');
                if (data.success) {
                    setCars(data.cars);
                }
            } catch (error) {
                console.error("Failed to fetch cars:", error);
            }
        };
        fetchCars();
    }, []);

    const value = {
        navigate, currency, user, setUser,
        token, setToken, isOwner, setIsOwner, showLogin, setShowLogin,
        logout, cars, setCars, pickupDate, setPickupDate,
        returnDate, setReturnDate,
        fetchUser // <-- Provide the function here
    };

    if (loading) {
        return null; // Or a loading spinner
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    return useContext(AppContext);
};

