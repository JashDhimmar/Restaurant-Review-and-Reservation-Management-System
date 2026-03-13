import axios from "axios";
import { jwtDecode } from "jwt-decode";
import apiRoutes from "../services/ApiRoutes/ApiRoutes";

const axiosInstance = axios.create({
    baseURL: apiRoutes.baseUrl,
    headers: { "Content-Type": "application/json" },
});

// Helper to handle tokens (matching Restaurant project's keys)
const TOKEN_KEY = 'table_taste_access';
const REFRESH_KEY = 'table_taste_refresh';
const REFRESH_URL = apiRoutes.baseUrl + apiRoutes.tokenRefresh;

// ===== Token Expiry Check =====
function isTokenExpired(token) {
    try {
        const { exp } = jwtDecode(token);
        return Date.now() >= exp * 1000;
    } catch {
        return true;
    }
}

// Request Interceptor: Attach access token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axiosInstance(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            isRefreshing = true;
            const refreshToken = localStorage.getItem(REFRESH_KEY);
            const accessToken = localStorage.getItem(TOKEN_KEY);

            if (!refreshToken || !isTokenExpired(accessToken)) {
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(REFRESH_URL, {
                    refresh: refreshToken,
                });

                const { access } = response.data;
                localStorage.setItem(TOKEN_KEY, access);

                axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${access}`;
                processQueue(null, access);

                originalRequest.headers.Authorization = `Bearer ${access}`;
                return axiosInstance(originalRequest);
            } catch (err) {
                processQueue(err, null);
                localStorage.clear();
                window.location.href = "/Login";
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
