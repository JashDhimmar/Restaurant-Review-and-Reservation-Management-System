import axiosInstance from "../api/axiosInstance";
import apiRoutes from "./ApiRoutes/ApiRoutes";

const ReservationService = {
    getReservations: async (params = {}) => {
        const response = await axiosInstance.get(apiRoutes.reservations, { params });
        return response.data.results !== undefined ? response.data.results : response.data;
    },

    getReservation: async (id) => {
        const response = await axiosInstance.get(apiRoutes.reservationDetail(id));
        return response.data;
    },

    createReservation: async (reservationData) => {
        const response = await axiosInstance.post(apiRoutes.reservations, reservationData);
        return response.data;
    },

    updateReservation: async (id, reservationData) => {
        const response = await axiosInstance.patch(apiRoutes.reservationDetail(id), reservationData);
        return response.data;
    },

    updateStatus: async (id, status) => {
        const response = await axiosInstance.patch(apiRoutes.updateReservationStatus(id), { status });
        return response.data;
    },

    deleteReservation: async (id) => {
        const response = await axiosInstance.delete(apiRoutes.reservationDetail(id));
        return response.data;
    }
};

export default ReservationService;
