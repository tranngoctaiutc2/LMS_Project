import axios from "axios";
import Cookie from "js-cookie";
import { useAuthStore } from "../store/auth";
import jwt_decode from "jwt-decode";

// Configuration for Axios instance
const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_API_URL || "http://127.0.0.1:8000/api/v1/",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// State for token refresh management
let isRefreshing = false;
let failedQueue = [];

// Process queued requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Check if access token is expired
const isAccessTokenExpired = (access_token) => {
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

// Get refresh token function - moved here to avoid circular dependency
const getRefreshToken = async (refresh_token) => {
  try {
    if (!refresh_token) {
      throw new Error("Refresh token not provided");
    }

    // Create a new axios instance for refresh to avoid interceptor loops
    const refreshInstance = axios.create({
      baseURL: import.meta.env.VITE_REACT_APP_API_URL || "http://127.0.0.1:8000/api/v1/",
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await refreshInstance.post(`user/token/refresh/`, {
      refresh: refresh_token,
    });
    
    return response;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    throw error;
  }
};

// Set auth user function
const setAuthUser = (access_token, refresh_token) => {
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
      handleUnauthorized();
    }
  } catch (error) {
    console.error("Error setting auth user:", error);
    handleUnauthorized();
  }
  useAuthStore.getState().setLoading(false);
};

// Utility to clear auth cookies and redirect to login
const handleUnauthorized = () => {
  // Clear cookies with all possible path combinations
  Cookie.remove("access_token");
  Cookie.remove("refresh_token");
  Cookie.remove("access_token", { path: "/" });
  Cookie.remove("refresh_token", { path: "/" });
  
  try {
    useAuthStore.getState().clearUser();
  } catch (error) {
    console.warn("Could not clear auth store:", error);
  }
  
  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = "/login";
  }
};

// Helper function to check if URL should skip auth
const shouldSkipAuth = (url) => {
  const skipAuthUrls = [
    '/user/token/',
    '/user/token/refresh/',
    '/user/register/',
    '/user/password/reset/',
  ];
  return skipAuthUrls.some(skipUrl => url.includes(skipUrl));
};

// Request interceptor to handle token attachment and refresh
apiInstance.interceptors.request.use(
  async (config) => {
    // Skip auth for certain endpoints
    if (shouldSkipAuth(config.url)) {
      return config;
    }

    const accessToken = Cookie.get("access_token");

    // If no access token, continue without auth (let the backend handle)
    if (!accessToken) {
      return config;
    }

    // Attach access token to headers
    config.headers.Authorization = `Bearer ${accessToken}`;

    // Check if access token is expired and needs refresh
    if (isAccessTokenExpired(accessToken)) {
      const refreshToken = Cookie.get("refresh_token");

      // If no refresh token, clear auth and continue request (let backend handle 401)
      if (!refreshToken) {
        delete config.headers.Authorization;
        return config;
      }

      // If another refresh is in progress, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ 
            resolve: (token) => {
              if (token) {
                config.headers.Authorization = `Bearer ${token}`;
              } else {
                delete config.headers.Authorization;
              }
              resolve(config);
            }, 
            reject 
          });
        });
      }

      isRefreshing = true;

      try {
        // Attempt to refresh token
        const response = await getRefreshToken(refreshToken);
        const { access: newAccessToken, refresh: newRefreshToken } = response.data;

        // Update tokens in cookies and auth state
        setAuthUser(newAccessToken, newRefreshToken);

        // Update header with new token
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
      } catch (error) {
        console.error("Token refresh failed in request interceptor:", error);
        processQueue(error, null);
        delete config.headers.Authorization;
        // Don't redirect here, let the response interceptor handle it
      } finally {
        isRefreshing = false;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors and token refresh
apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Skip retry for auth endpoints
      if (shouldSkipAuth(originalRequest.url)) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = Cookie.get("refresh_token");

      if (!refreshToken) {
        handleUnauthorized();
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Attempt to refresh token
          const response = await getRefreshToken(refreshToken);
          const { access: newAccessToken, refresh: newRefreshToken } = response.data;

          // Update tokens in cookies and auth state
          setAuthUser(newAccessToken, newRefreshToken);

          // Update header and retry original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return apiInstance(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed in response interceptor:", refreshError);
          processQueue(refreshError, null);
          handleUnauthorized();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Queue request if refresh is in progress
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiInstance(originalRequest));
          },
          reject: (err) => {
            reject(err);
          },
        });
      });
    }

    // Handle other error statuses
    if (error.response) {
      switch (error.response.status) {
        case 403:
          console.warn("Access forbidden:", error.response.data);
          break;
        case 404:
          console.warn("Resource not found:", error.config.url);
          break;
        case 500:
          console.error("Server error:", error.response.data);
          break;
        default:
          break;
      }
    }

    return Promise.reject(error);
  }
);

export default apiInstance;