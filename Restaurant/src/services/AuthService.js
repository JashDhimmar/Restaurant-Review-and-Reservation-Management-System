import axiosInstance from "../api/axiosInstance";
import apiRoutes from "./ApiRoutes/ApiRoutes";

const AuthService = {
    login: async (email, password) => {
        const response = await axiosInstance.post(apiRoutes.login, { email, password });
        const { access, refresh, user } = response.data;

        // Use the same keys as the original Restaurant project
        localStorage.setItem('table_taste_access', access);
        localStorage.setItem('table_taste_refresh', refresh);
        localStorage.setItem('table_taste_user', JSON.stringify(user));

        return user;
    },

    register: async (userData) => {
        const response = await axiosInstance.post(apiRoutes.register, userData);
        return response.data;
    },

    me: async () => {
        const response = await axiosInstance.get(apiRoutes.me);
        const user = response.data;
        localStorage.setItem('table_taste_user', JSON.stringify(user));
        return user;
    },

    updateMe: async (userData) => {
        const response = await axiosInstance.patch(apiRoutes.me, userData);
        const user = response.data;
        localStorage.setItem('table_taste_user', JSON.stringify(user));
        return user;
    },

    logout: () => {
        localStorage.removeItem('table_taste_access');
        localStorage.removeItem('table_taste_refresh');
        localStorage.removeItem('table_taste_user');
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('table_taste_access');
    },

    getUser: () => {
        const user = localStorage.getItem('table_taste_user');
        try {
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    },

    getUsers: async (params = {}) => {
        const response = await axiosInstance.get(apiRoutes.users, { params });
        return response.data.results !== undefined ? response.data.results : response.data;
    },

    getCustomers: async (params = {}) => {
        const response = await axiosInstance.get(apiRoutes.customers, { params });
        return response.data.results !== undefined ? response.data.results : response.data;
    },

    getOwners: async (params = {}) => {
        const response = await axiosInstance.get(apiRoutes.owners, { params });
        return response.data.results !== undefined ? response.data.results : response.data;
    },

    deleteUser: async (id) => {
        const response = await axiosInstance.delete(apiRoutes.userDetail(id));
        return response.data;
    }
};

export default AuthService;
