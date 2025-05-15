import axios from "axios";
import { setAuthUser, getRefreshToken, isAccessTokenExpired } from "./auth";
import Cookie from "js-cookie";

const apiInstance = axios.create({
    baseURL: "http://127.0.0.1:8000/api/v1/",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

apiInstance.interceptors.request.use(
    async (config) => {
        const accessToken = Cookie.get("access_token");

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        if (isAccessTokenExpired(accessToken)) {
            const refreshToken = Cookie.get("refresh_token");
            if (refreshToken) {
                try {
                    const response = await getRefreshToken(refreshToken);

                    setAuthUser(response.data.access, response.data.refresh);
                    config.headers.Authorization = `Bearer ${response.data.access}`;
                } catch (error) {
                    console.error("Token refresh failed:", error);
                }
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error("Unauthorized access - you may need to log in:", error);
        }

        return Promise.reject(error);
    }
);

export default apiInstance;
