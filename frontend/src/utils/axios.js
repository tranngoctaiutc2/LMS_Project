import axios from "axios";
import Cookie from "js-cookie";
import { setAuthUser, getRefreshToken, isAccessTokenExpired } from "./auth";

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

// Utility to clear auth cookies and redirect to login
const handleUnauthorized = () => {
  Cookie.remove("access_token", { path: "/", secure: true, sameSite: "strict" });
  Cookie.remove("refresh_token", { path: "/", secure: true, sameSite: "strict" });
  window.location.href = "/login";
};

// Request interceptor to handle token attachment and refresh
apiInstance.interceptors.request.use(
  async (config) => {
    const accessToken = Cookie.get("access_token");

    // Attach access token to headers if available
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Check if access token is expired
    if (accessToken && isAccessTokenExpired(accessToken)) {
      const refreshToken = Cookie.get("refresh_token");

      // If no refresh token, clear auth and redirect
      if (!refreshToken) {
        handleUnauthorized();
        return Promise.reject(new Error("No refresh token available"));
      }

      // If another refresh is in progress, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            config.headers.Authorization = `Bearer ${token}`;
            return config;
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // Attempt to refresh token
        const response = await getRefreshToken(refreshToken);
        const { access: newAccessToken, refresh: newRefreshToken } = response.data;

        // Update tokens in cookies and auth state
        Cookie.set("access_token", newAccessToken, { secure: true, sameSite: "strict" });
        Cookie.set("refresh_token", newRefreshToken, { secure: true, sameSite: "strict" });
        setAuthUser(newAccessToken, newRefreshToken);

        // Update header with new token
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
      } catch (error) {
        processQueue(error, null);
        handleUnauthorized();
        return Promise.reject(error);
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
      originalRequest._retry = true; // Prevent infinite retry loop
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
          Cookie.set("access_token", newAccessToken, { secure: true, sameSite: "strict" });
          Cookie.set("refresh_token", newRefreshToken, { secure: true, sameSite: "strict" });
          setAuthUser(newAccessToken, newRefreshToken);

          // Update header and retry original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return apiInstance(originalRequest);
        } catch (refreshError) {
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
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiInstance(originalRequest));
          },
          reject,
        });
      });
    }

    return Promise.reject(error);
  }
);

export default apiInstance;