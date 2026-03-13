// src/services/mockApi.js

// Mock Data Stores
let users = [
    { id: '1', email: 'owner@test.com', full_name: 'Test Owner', role: 'owner', created_date: '2024-01-01T00:00:00Z' },
    { id: '2', email: 'admin@test.com', full_name: 'Test Admin', role: 'admin', created_date: '2024-01-01T00:00:00Z' },
    { id: '3', email: 'user@test.com', full_name: 'Regular User', role: 'user', created_date: '2024-01-01T00:00:00Z' },
];

let restaurants = [
    {
        id: 'r1',
        name: 'The Rustic Spoke',
        cuisine: 'Italian',
        city: 'New York',
        address: '123 Pasta Lane',
        price_range: '$$',
        average_rating: 4.8,
        total_reviews: 120,
        is_active: true,
        is_verified: true,
        owner_id: '1',
        owner_email: 'owner@test.com',
        description: 'Authentic Italian cuisine in a cozy atmosphere.',
        cover_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80'
        ],
        created_date: '2024-01-15T10:00:00Z',
    },
    {
        id: 'r2',
        name: 'Sushi Zen',
        cuisine: 'Japanese',
        city: 'San Francisco',
        address: '456 Sushi Ave',
        price_range: '$$$',
        average_rating: 4.9,
        total_reviews: 200,
        is_active: true,
        is_verified: true,
        owner_id: '1',
        owner_email: 'owner@test.com',
        description: 'Premium sushi and omakase experience.',
        cover_image: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1581339394136-107ec39abc61?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80'
        ],
        created_date: '2024-01-20T14:30:00Z',
    },
    {
        id: 'r3',
        name: 'Dragon Wok',
        cuisine: 'Chinese',
        city: 'San Francisco',
        address: '789 Chinatown Ln',
        price_range: '$$',
        average_rating: 4.5,
        total_reviews: 85,
        is_active: true,
        is_verified: true,
        owner_id: '1',
        owner_email: 'owner@test.com',
        description: 'Authentic dim sum and Sichuan specialties.',
        cover_image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1585032226651-759b368d7145?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80'
        ],
        created_date: '2024-02-01T11:00:00Z',
    },
    {
        id: 'r4',
        name: 'Le Petit Bistro',
        cuisine: 'French',
        city: 'New York',
        address: '321 Romance Blvd',
        price_range: '$$$$',
        average_rating: 4.7,
        total_reviews: 95,
        is_active: true,
        is_verified: false,
        owner_id: '1',
        owner_email: 'owner@test.com',
        description: 'Classic French elegance and fine wine.',
        cover_image: 'https://images.unsplash.com/photo-1550966841-3962f1af0444?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1550966841-3962f1af0444?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80'
        ],
        created_date: '2024-02-05T18:00:00Z',
    },
    {
        id: 'r5',
        name: 'Taco Haven',
        cuisine: 'Mexican',
        city: 'Austin',
        address: '555 Fiesta Way',
        price_range: '$',
        average_rating: 4.6,
        total_reviews: 310,
        is_active: true,
        is_verified: true,
        owner_id: '1',
        owner_email: 'owner@test.com',
        description: 'Street tacos and fresh margaritas.',
        cover_image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=800&q=80'
        ],
        created_date: '2024-02-10T12:00:00Z',
    },
    {
        id: 'r6',
        name: 'Bombay Spice',
        cuisine: 'Indian',
        city: 'Chicago',
        address: '888 Saffron Rd',
        price_range: '$$',
        average_rating: 4.4,
        total_reviews: 150,
        is_active: true,
        is_verified: true,
        owner_id: '1',
        owner_email: 'owner@test.com',
        description: 'Vibrant spices and traditional curries.',
        cover_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80'
        ],
        created_date: '2024-02-15T19:30:00Z',
    },
    {
        id: 'r7',
        name: 'Burger Republic',
        cuisine: 'American',
        city: 'Seattle',
        address: '99 Grill St',
        price_range: '$$',
        average_rating: 4.3,
        total_reviews: 420,
        is_active: true,
        is_verified: true,
        owner_id: '1',
        owner_email: 'owner@test.com',
        description: 'Gourmet burgers and craft shakes.',
        cover_image: 'https://images.unsplash.com/photo-1586816001966-79b73674439c?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1586816001966-79b73674439c?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80'
        ],
        created_date: '2024-02-20T13:00:00Z',
    },
    {
        id: 'r8',
        name: 'Olive Gardenia',
        cuisine: 'Mediterranean',
        city: 'Miami',
        address: '77 Coastal Hwy',
        price_range: '$$$',
        average_rating: 4.8,
        total_reviews: 65,
        is_active: true,
        is_verified: false,
        owner_id: '1',
        owner_email: 'owner@test.com',
        description: 'Fresh seafood and Mediterranean herbs.',
        cover_image: 'https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1510629954389-c1e0da47d414?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=800&q=80'
        ],
        created_date: '2024-02-25T11:45:00Z',
    },
    {
        id: 'r9',
        name: 'Thai Terrace',
        cuisine: 'Thai',
        city: 'Los Angeles',
        address: '44 Orchid Path',
        price_range: '$$',
        average_rating: 4.5,
        total_reviews: 215,
        is_active: true,
        is_verified: true,
        owner_id: '1',
        owner_email: 'owner@test.com',
        description: 'Authentic Thai flavors with a view.',
        cover_image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1528605248644-14dd04cb1138?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80'
        ],
        created_date: '2024-03-01T17:15:00Z',
    },
    {
        id: 'r10',
        name: 'Kimchi House',
        cuisine: 'Korean',
        city: 'New York',
        address: '11 Seoul St',
        price_range: '$$',
        average_rating: 4.9,
        total_reviews: 180,
        is_active: true,
        is_verified: true,
        owner_id: '1',
        owner_email: 'owner@test.com',
        description: 'Traditional Korean BBQ and stews.',
        cover_image: 'https://images.unsplash.com/photo-1590604518086-29e195512b77?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1590604518086-29e195512b77?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1498654203945-38916ad35c81?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=800&q=80'
        ],
        created_date: '2024-03-02T12:00:00Z',
    },
    {
        id: 'r11',
        name: 'The Steakhouse',
        cuisine: 'American',
        city: 'Dallas',
        address: '22 Prime Cut Ln',
        price_range: '$$$$',
        average_rating: 4.7,
        total_reviews: 140,
        is_active: true,
        is_verified: true,
        owner_id: '1',
        owner_email: 'owner@test.com',
        description: 'Premium cuts and aged steaks.',
        cover_image: 'https://images.unsplash.com/photo-1558191053-c03db2757e3d?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1558191053-c03db2757e3d?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1546241072-48010ad28c2c?auto=format&fit=crop&w=800&q=80'
        ],
        created_date: '2024-03-03T20:00:00Z',
    },
    {
        id: 'r12',
        name: 'Pasta Perfetto',
        cuisine: 'Italian',
        city: 'Boston',
        address: '55 Little Italy Sq',
        price_range: '$$',
        average_rating: 4.6,
        total_reviews: 88,
        is_active: true,
        is_verified: true,
        owner_id: '1',
        owner_email: 'owner@test.com',
        description: 'Handmade pasta and secret family recipes.',
        cover_image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80'
        ],
        created_date: '2024-03-04T13:30:00Z',
    }
];

let reservations = [
    {
        id: 'res1',
        restaurant_id: 'r1',
        user_id: '3',
        guest_name: 'Regular User',
        guest_email: 'user@test.com',
        guest_phone: '555-0123',
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        guests: 2,
        status: 'confirmed',
        special_requests: 'Window seat if possible',
        created_at: new Date().toISOString(),
        has_reviewed: false
    }
];

let reviews = [
    {
        id: 'rev1',
        restaurant_id: 'r1',
        reservation_id: null,
        reviewer_name: 'Foodie123',
        overall_rating: 5,
        food_rating: 5,
        service_rating: 4,
        ambiance_rating: 5,
        value_rating: 4,
        review_text: 'Absolutely fantastic pasta! Will definitely be back.',
        is_verified: false,
        created_at: new Date().toISOString()
    }
];

// Helper to simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Auth State (persisted in localStorage)
const STORAGE_KEY = 'table_taste_mock_user';
let currentUser = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');

export const mockApi = {
    auth: {
        me: async () => {
            await delay(300);
            if (!currentUser) throw new Error("Not authenticated");
            return currentUser;
        },
        isAuthenticated: async () => {
            await delay(100);
            return !!currentUser;
        },
        login: async (email, password) => {
            await delay(500);
            const user = users.find(u => u.email === email);
            if (user) {
                currentUser = user;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
                return user;
            }
            throw new Error("Invalid credentials");
        },
        logout: async () => {
            await delay(200);
            currentUser = null;
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
            return true;
        },
        redirectToLogin: () => {
            window.location.href = '/Login';
        }
    },
    entities: {
        Restaurant: {
            list: async (sortBy = '-created_date') => {
                await delay();
                let results = [...restaurants];
                if (sortBy === '-created_date') {
                    results.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
                }
                return results;
            },
            filter: async (params = {}) => {
                await delay();
                let results = [...restaurants];
                if (params.id) results = results.filter(r => r.id === params.id);
                if (params.owner_id) results = results.filter(r => r.owner_id === params.owner_id);
                if (params.is_active !== undefined) results = results.filter(r => r.is_active === params.is_active);
                return results;
            },
            create: async (data) => {
                await delay();
                const newRest = { ...data, id: `r${Math.random()}`, average_rating: 0, total_reviews: 0, created_date: new Date().toISOString() };
                restaurants.push(newRest);
                return newRest;
            },
            update: async (id, data) => {
                await delay();
                const index = restaurants.findIndex(r => r.id === id);
                if (index > -1) {
                    restaurants[index] = { ...restaurants[index], ...data };
                    return restaurants[index];
                }
                throw new Error("Restaurant not found");
            },
            delete: async (id) => {
                await delay();
                restaurants = restaurants.filter(r => r.id !== id);
                return true;
            }
        },
        Reservation: {
            list: async (sortBy = '-created_date', limit) => {
                await delay();
                let results = [...reservations];
                if (sortBy === '-created_date') {
                    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                }
                if (limit) results = results.slice(0, limit);
                return results;
            },
            filter: async (params = {}) => {
                await delay();
                let results = [...reservations];
                if (params.id) results = results.filter(r => r.id === params.id);
                if (params.restaurant_id) results = results.filter(r => r.restaurant_id === params.restaurant_id);
                if (params.user_id) results = results.filter(r => r.user_id === params.user_id);
                return results;
            },
            create: async (data) => {
                await delay();
                const newRes = { ...data, id: `res${Math.random()}`, status: 'pending', created_at: new Date().toISOString(), has_reviewed: false };
                reservations.push(newRes);
                return newRes;
            },
            update: async (id, data) => {
                await delay();
                const index = reservations.findIndex(r => r.id === id);
                if (index > -1) {
                    reservations[index] = { ...reservations[index], ...data };
                    return reservations[index];
                }
                throw new Error("Reservation not found");
            }
        },
        Review: {
            list: async (sortBy = '-created_date') => {
                await delay();
                let results = [...reviews];
                if (sortBy === '-created_date') {
                    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                }
                return results;
            },
            filter: async (params = {}) => {
                await delay();
                let results = [...reviews];
                if (params.restaurant_id) results = results.filter(r => r.restaurant_id === params.restaurant_id);
                return results;
            },
            create: async (data) => {
                await delay();
                const newRev = { ...data, id: `rev${Math.random()}`, created_at: new Date().toISOString() };
                reviews.push(newRev);
                return newRev;
            },
            update: async (id, data) => {
                await delay();
                const index = reviews.findIndex(r => r.id === id);
                if (index > -1) {
                    reviews[index] = { ...reviews[index], ...data };
                    return reviews[index];
                }
                throw new Error("Review not found");
            },
            delete: async (id) => {
                await delay();
                reviews = reviews.filter(r => r.id !== id);
                return true;
            }
        },
        User: {
            list: async (sortBy = '-created_date') => {
                await delay();
                let results = [...users];
                if (sortBy === '-created_date') {
                    results.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
                }
                return results;
            },
            filter: async (params = {}) => {
                await delay();
                let results = [...users];
                if (params.role) results = results.filter(u => u.role === params.role);
                return results;
            },
            update: async (id, data) => {
                await delay();
                const index = users.findIndex(u => u.id === id);
                if (index > -1) {
                    users[index] = { ...users[index], ...data };
                    return users[index];
                }
                throw new Error("User not found");
            }
        }
    }
};
