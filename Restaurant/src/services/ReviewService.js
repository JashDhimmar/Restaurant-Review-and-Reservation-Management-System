import axiosInstance from "../api/axiosInstance";
import apiRoutes from "./ApiRoutes/ApiRoutes";

const ReviewService = {
    getReviews: async (params = {}) => {
        const response = await axiosInstance.get(apiRoutes.reviews, { params });
        return response.data.results !== undefined ? response.data.results : response.data;
    },

    getReview: async (id) => {
        const response = await axiosInstance.get(apiRoutes.reviewDetail(id));
        return response.data;
    },

    createReview: async (reviewData) => {
        const response = await axiosInstance.post(apiRoutes.reviews, reviewData);
        return response.data;
    },

    updateReview: async (id, reviewData) => {
        const response = await axiosInstance.patch(apiRoutes.reviewDetail(id), reviewData);
        return response.data;
    },

    deleteReview: async (id) => {
        const response = await axiosInstance.delete(apiRoutes.reviewDetail(id));
        return response.data;
    }
};

export default ReviewService;
