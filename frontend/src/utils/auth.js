import { useAuthStore } from "../store/auth";
import axios from "axios";
import jwt_decode from "jwt-decode";
import Cookie from "js-cookie";
import { clerk } from "./clerk";

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
            
            window.dispatchEvent(new CustomEvent('auth-changed', { 
                detail: { type: 'login', user: jwt_decode(data.access) } 
            }));
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
  const tokenKeys = ["access_token", "refresh_token"];
  tokenKeys.forEach((key) => {
    Cookie.remove(key);
    Cookie.remove(key, { path: "/" });
  });
  localStorage.clear();
  sessionStorage.clear();
  useAuthStore.getState().clearUser();
};


export const setUser = async () => {
    useAuthStore.getState().initializeAuth();
    
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
        
        return true;
    } catch (error) {
        console.error("Error setting user:", error);
        logout();
        return false;
    }
};

export const setAuthUser = (access_token, refresh_token) => {
    try {
        if (access_token && refresh_token) {
            const cookieOptions = {
                expires: 1,
                secure: window.location.protocol === 'https:',
                sameSite: 'strict'
            };

            const refreshCookieOptions = {
                expires: 7,
                secure: window.location.protocol === 'https:',
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
        
        return decodedToken.exp < (currentTime + 30);
    } catch (error) {
        console.error("Error decoding token:", error);
        return true;
    }
};

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
export const clerkLogin = async () => {
    try {
        useAuthStore.getState().setLoading(true);
        
        // Get Clerk session token
        const clerkToken = await clerk.session?.getToken();
        
        if (!clerkToken) {
            throw new Error("No Clerk session token available");
        }

        // Call Django backend to exchange Clerk token for JWT
        const { data, status } = await authApi.post('/clerk/login/', {}, {
            headers: {
                'Authorization': `Bearer ${clerkToken}`
            }
        });

        if (status === 200) {
            setAuthUser(data.access, data.refresh);
            
            // Trigger auth change event
            window.dispatchEvent(new CustomEvent('auth-changed', { 
                detail: { type: 'clerk-login', user: data.user } 
            }));
            
            console.log("Successfully authenticated with Django via Clerk");
            return { data, error: null };
        }

    } catch (error) {
        console.error("Clerk login error:", error);
        const errorMessage = error.response?.data?.detail || error.message || "Clerk authentication failed";
        useAuthStore.getState().setLoading(false);
        return { data: null, error: errorMessage };
    }
};

// 🆕 Initialize Clerk authentication
export const initializeClerkAuth = async () => {
    try {
        await clerk.load();
        
        if (clerk.user) {
            // User is signed in with Clerk, authenticate with Django
            const result = await clerkLogin();
            return result;
        } else {
            // User is not signed in with Clerk
            console.log("No Clerk user found");
            return { data: null, error: null };
        }
    } catch (error) {
        console.error("Failed to initialize Clerk auth:", error);
        return { data: null, error: error.message };
    }
};

// 🆕 Sign in with Clerk
export const signInWithClerk = async () => {
  try {
    useAuthStore.getState().setLoading(true);

    // Chuyển hướng đến Clerk sign-in flow
    await clerk.redirectToSignIn({
      redirectUrl: '/clerk-callback', // URL để Clerk redirect sau khi đăng nhập
    });

    // Trả về promise để component gọi hàm này có thể chờ
    return new Promise((resolve) => {
      // Clerk sẽ xử lý callback ở /clerk-callback, không cần kiểm tra thêm ở đây
      resolve({ data: null, error: null });
    });
  } catch (error) {
    console.error('Clerk sign-in error:', error);
    useAuthStore.getState().setLoading(false);
    return { data: null, error: error.message };
  }
};

// 🆕 Sign up with Clerk
export const signUpWithClerk = async () => {
  try {
    useAuthStore.getState().setLoading(true);

    // Chuyển hướng đến Clerk sign-up flow
    await clerk.redirectToSignUp({
      redirectUrl: '/clerk-callback', // URL để Clerk redirect sau khi đăng ký
    });

    return new Promise((resolve) => {
      resolve({ data: null, error: null });
    });
  } catch (error) {
    console.error('Clerk sign-up error:', error);
    useAuthStore.getState().setLoading(false);
    return { data: null, error: error.message };
  }
};