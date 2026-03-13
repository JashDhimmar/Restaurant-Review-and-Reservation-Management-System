// src/services/api.js
// Refactored to use modular services and axiosInstance (Bagheshwar pattern)
// Maintain same interface for backward compatibility

import AuthService from './AuthService';
import RestaurantService from './RestaurantService';
import ReservationService from './ReservationService';
import ReviewService from './ReviewService';

// Forward tokenStorage methods specifically if any component uses them
export const tokenStorage = {
    getAccess: () => localStorage.getItem('table_taste_access'),
    getRefresh: () => localStorage.getItem('table_taste_refresh'),
    getUser: AuthService.getUser,
    set: (access, refresh, user) => {
        if (access) localStorage.setItem('table_taste_access', access);
        if (refresh) localStorage.setItem('table_taste_refresh', refresh);
        if (user) localStorage.setItem('table_taste_user', JSON.stringify(user));
    },
    clear: AuthService.logout,
};

// Main API object for backward compatibility
export const api = {
    auth: {
        login: AuthService.login,
        register: AuthService.register,
        me: AuthService.me,
        updateMe: AuthService.updateMe,
        isAuthenticated: AuthService.isAuthenticated,
        logout: AuthService.logout,
        redirectToLogin: () => {
            window.location.href = '/Login';
        },
    },

    entities: {
        Restaurant: {
            list: async (sortBy = '-created_date') => {
                const ordering = sortBy.startsWith('-') ? sortBy : `-${sortBy}`;
                return RestaurantService.getRestaurants({ ordering });
            },
            filter: RestaurantService.getRestaurants, // Maps to getRestaurants with params
            create: RestaurantService.createRestaurant,
            update: RestaurantService.updateRestaurant,
            delete: RestaurantService.deleteRestaurant,
            myRestaurants: RestaurantService.getMyRestaurants,
        },

        Reservation: {
            list: async (sortBy = '-created_at', limit) => {
                return ReservationService.getReservations({ ordering: sortBy, page_size: limit || 100 });
            },
            filter: ReservationService.getReservations,
            create: ReservationService.createReservation,
            update: async (id, bodyData) => {
                if (bodyData.status && Object.keys(bodyData).length === 1) {
                    return ReservationService.updateStatus(id, bodyData.status);
                }
                return ReservationService.updateReservation(id, bodyData);
            },
        },

        Review: {
            list: async (sortBy = '-created_at') => {
                return ReviewService.getReviews({ ordering: sortBy });
            },
            filter: ReviewService.getReviews,
            create: ReviewService.createReview,
            update: ReviewService.updateReview,
            delete: ReviewService.deleteReview,
        },

        User: {
            list: async () => [],
            filter: async () => [],
            update: (id, bodyData) => AuthService.updateMe(bodyData),
        },
    },
};

export const mockApi = api;
export default api;
