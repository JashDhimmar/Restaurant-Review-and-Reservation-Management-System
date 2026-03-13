const apiRoutes = {
    baseUrl: import.meta.env.VITE_API_BASE_URL,

    // Auth
    login: "auth/login/",
    register: "auth/register/",
    me: "auth/me/",
    tokenRefresh: "auth/token/refresh/",
    users: "auth/users/",
    customers: "auth/customers/",
    owners: "auth/owners/",
    userDetail: (id) => `auth/users/${id}/`,

    // Entities
    restaurants: "restaurants/",
    myRestaurants: "restaurants/my_restaurants/",
    reservations: "reservations/",
    updateReservationStatus: (id) => `reservations/${id}/update_status/`,
    reviews: "reviews/",

    // Detail endpoints (using UUIDs)
    restaurantDetail: (id) => `restaurants/${id}/`,
    reservationDetail: (id) => `reservations/${id}/`,
    reviewDetail: (id) => `reviews/${id}/`,

    // Partner Workflow
    partnerWithUs: "partner-with-us/",
    reviewRestaurant: (id) => `review-restaurant/${id}/`,

    // Admin
    adminStats: "admin/stats/",
};

export default apiRoutes;
