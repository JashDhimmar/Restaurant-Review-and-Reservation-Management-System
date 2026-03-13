import axiosInstance from "../api/axiosInstance";
import apiRoutes from "./ApiRoutes/ApiRoutes";

const RestaurantService = {
    getRestaurants: async (params = {}) => {
        const response = await axiosInstance.get(apiRoutes.restaurants, { params });
        // Handle DRF pagination results vs direct list
        return response.data.results !== undefined ? response.data.results : response.data;
    },

    getRestaurant: async (id) => {
        const response = await axiosInstance.get(apiRoutes.restaurantDetail(id));
        return response.data;
    },

    createRestaurant: async (formData) => {
        // Headers will be set by axios if formData is passed
        const response = await axiosInstance.post(apiRoutes.restaurants, formData);
        return response.data;
    },

    updateRestaurant: async (id, data) => {
        const { payload, headers } = convertToFormData(data);
        const response = await axiosInstance.patch(apiRoutes.restaurantDetail(id), payload, { headers });
        return response.data;
    },

    deleteRestaurant: async (id) => {
        const response = await axiosInstance.delete(apiRoutes.restaurantDetail(id));
        return response.data;
    },

    getMyRestaurants: async () => {
        const response = await axiosInstance.get(apiRoutes.myRestaurants);
        return response.data.results !== undefined ? response.data.results : response.data;
    },

    partnerWithUs: async (data) => {
        const { payload, headers } = convertToFormData(data);
        const response = await axiosInstance.post(apiRoutes.partnerWithUs, payload, { headers });
        return response.data;
    },
    reviewRestaurant: async (id, action, comment) => {
        const response = await axiosInstance.post(apiRoutes.reviewRestaurant(id), { action, comment });
        return response.data;
    },

    getAdminStats: async () => {
        const response = await axiosInstance.get(apiRoutes.adminStats);
        return response.data;
    },
};

/**
 * Helper to convert object to FormData if it contains File objects
 */
const convertToFormData = (data) => {
    if (data instanceof FormData) return { payload: data, headers: {} };

    // Check if any field is a File or an array containing Files
    const hasFiles = Object.values(data).some(val =>
        val instanceof File || (Array.isArray(val) && val.some(v => v instanceof File))
    );

    if (!hasFiles) return { payload: data, headers: {} };

    const payload = new FormData();
    Object.keys(data).forEach(key => {
        const val = data[key];
        if (val instanceof File) {
            payload.append(key, val);
        } else if (Array.isArray(val)) {
            // If it's a gallery or features, handle specifically
            const containsFile = val.some(v => v instanceof File);
            if (containsFile) {
                // If the array contains files (like gallery), append each item
                val.forEach(item => {
                    if (item instanceof File) {
                        payload.append(key, item);
                    } else if (typeof item === 'string' && !item.startsWith('blob:')) {
                        payload.append(key, item);
                    }
                });
            } else {
                // If it's a plain array (like features), stringify it
                payload.append(key, JSON.stringify(val));
            }
        } else if (typeof val === 'object' && val !== null) {
            // Plain objects (like opening_hours), stringify
            payload.append(key, JSON.stringify(val));
        } else if (val !== null && val !== undefined) {
            // Skip blob URLs for cover_image/gallery strings
            if (typeof val === 'string' && val.startsWith('blob:')) {
                // skip
            } else {
                payload.append(key, val);
            }
        }
    });

    return {
        payload,
        headers: { 'Content-Type': 'multipart/form-data' }
    };
};

export default RestaurantService;
