import { useAuthStore } from "../store/auth";
import axios from "axios"; // Import axios directly, not the custom instance
import jwt_decode from "jwt-decode";
import Cookie from "js-cookie";

// Create a separate axios instance for auth operations to avoid circular dependency
const authApi = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_API_URL || "http://127.0.0.1:8000/api/v1/",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const login = async (email, password) => {
    try {
        const { data, status } = await authApi.post(`user/token/`, {
            email,
            password,
        });

        if (status === 200) {
            setAuthUser(data.access, data.refresh);
        }

        return { data, error: null };
    } catch (error) {
        const errorMessage = error.response?.data?.detail || "Something went wrong";
        console.error("Login error:", errorMessage);
        return { data: null, error: errorMessage };
    }
};

export const register = async (full_name, email, password, password2) => {
    try {
        const { data } = await authApi.post(`user/register/`, {
            full_name,
            email,
            password,
            password2,
        });

        await login(email, password);
        return { data, error: null };
    } catch (error) {
        return {
            data: null,
            error: `${error.response?.data?.full_name || ''} - ${error.response?.data?.email || ''}` || "Something went wrong",
        };
    }
};

export const logout = () => {
    // Clear cookies with all possible options
    Cookie.remove("access_token");
    Cookie.remove("refresh_token");
    Cookie.remove("access_token", { path: "/" });
    Cookie.remove("refresh_token", { path: "/" });
    
    useAuthStore.getState().clearUser();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
        window.location.href = "/login";
    }
};

export const setUser = async () => {
    useAuthStore.getState().initializeAuth(); // Set loading true
    
    const access_token = Cookie.get("access_token");
    const refresh_token = Cookie.get("refresh_token");

    if (!access_token || !refresh_token) {
        console.log("Tokens do not exist");
        useAuthStore.getState().setLoading(false);
        return;
    }

    try {
        if (isAccessTokenExpired(access_token)) {
            console.log("Access token expired, refreshing...");
            const response = await getRefreshToken(refresh_token);
            setAuthUser(response.data.access, response.data.refresh);
        } else {
            setAuthUser(access_token, refresh_token);
        }
    } catch (error) {
        console.error("Error setting user:", error);
        // Nếu có lỗi (refresh token expired, etc.), logout user
        logout();
    }
};

export const setAuthUser = (access_token, refresh_token) => {
    try {
        if (access_token && refresh_token) {
            // Fix cookie settings for development
            const cookieOptions = {
                expires: 1,
                secure: window.location.protocol === 'https:', // Only secure in production
                sameSite: 'strict'
            };

            const refreshCookieOptions = {
                expires: 7,
                secure: window.location.protocol === 'https:', // Only secure in production
                sameSite: 'strict'
            };

            Cookie.set("access_token", access_token, cookieOptions);
            Cookie.set("refresh_token", refresh_token, refreshCookieOptions);

            const user = jwt_decode(access_token);
            if (user) {
                useAuthStore.getState().setUser(user);
            }
        } else {
            console.error("Invalid tokens, could not set user.");
            logout();
        }
    } catch (error) {
        console.error("Error setting auth user:", error);
        logout();
    }
    useAuthStore.getState().setLoading(false);
};

export const getRefreshToken = async (refresh_token) => {
    try {
        if (!refresh_token) {
            throw new Error("Refresh token not provided");
        }

        const response = await authApi.post(`user/token/refresh/`, {
            refresh: refresh_token,
        });
        
        return response;
    } catch (error) {
        console.error("Failed to refresh token:", error);
        throw error;
    }
};

export const isAccessTokenExpired = (access_token) => {
    try {
        if (!access_token) return true;
        
        const decodedToken = jwt_decode(access_token);
        const currentTime = Date.now() / 1000;
        
        // Thêm buffer 30 giây để tránh trường hợp token expire ngay khi đang gọi API
        return decodedToken.exp < (currentTime + 30);
    } catch (error) {
        console.error("Error decoding token:", error);
        return true;
    }
};

// Hàm helper để check refresh token có expired không
export const isRefreshTokenExpired = (refresh_token) => {
    try {
        if (!refresh_token) return true;
        
        const decodedToken = jwt_decode(refresh_token);
        return decodedToken.exp < Date.now() / 1000;
    } catch (error) {
        console.error("Error decoding refresh token:", error);
        return true;
    }
};