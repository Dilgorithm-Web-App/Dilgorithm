import axios from 'axios';
import { RefreshCoordinator } from './auth/RefreshCoordinator';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/';

/** Plain client for refresh calls — avoids interceptor recursion. */
const rawApi = axios.create({ baseURL });

let sessionExpiredHandler = () => {};

/** DIP: auth layer registers logout without React importing cycles. */
export function registerSessionExpiredHandler(handler) {
    sessionExpiredHandler = typeof handler === 'function' ? handler : () => {};
}

function clearSessionStorage() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
}

function notifySessionExpired() {
    clearSessionStorage();
    sessionExpiredHandler();
}

function shouldSkipTokenRefresh(config) {
    const url = config.url || '';
    return (
        url.includes('accounts/login/') ||
        url.includes('accounts/google-login/') ||
        url.includes('accounts/register/') ||
        url.includes('accounts/token/refresh/')
    );
}

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { response, config } = error;
        if (!config || response?.status !== 401) {
            return Promise.reject(error);
        }
        if (config._retry) {
            return Promise.reject(error);
        }
        if (shouldSkipTokenRefresh(config)) {
            return Promise.reject(error);
        }
        if (!config.headers?.Authorization) {
            return Promise.reject(error);
        }

        config._retry = true;

        try {
            const access = await RefreshCoordinator.getInstance().refreshWithRawClient(rawApi);
            config.headers.Authorization = `Bearer ${access}`;
            return api(config);
        } catch {
            notifySessionExpired();
            return Promise.reject(error);
        }
    },
);

export default api;
