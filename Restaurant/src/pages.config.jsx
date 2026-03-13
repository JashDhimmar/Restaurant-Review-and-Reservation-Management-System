import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import MyReservations from './pages/MyReservations';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerReservations from './pages/OwnerReservations';
import OwnerRestaurant from './pages/OwnerRestaurant';
import OwnerReviews from './pages/OwnerReviews';
import Profile from './pages/Profile';
import RestaurantDetail from './pages/RestaurantDetail';
import WriteReview from './pages/WriteReview';
import Login from './pages/Login';
import Register from './pages/Register';
import PartnerWithUs from './pages/PartnerWithUs';
import NotFound from './pages/NotFound';
import AdminRestaurantReview from './pages/AdminRestaurantReview';
import Layout from './Layout';

export const pagesConfig = {
    mainPage: 'Home',
    Layout: Layout,
    Pages: {
        'Home': Home,
        'PartnerWithUs': PartnerWithUs,
        'AdminDashboard': AdminDashboard,
        'AdminRestaurantReview': AdminRestaurantReview,
        'MyReservations': MyReservations,
        'OwnerDashboard': OwnerDashboard,
        'OwnerReservations': OwnerReservations,
        'OwnerRestaurant': OwnerRestaurant,
        'OwnerReviews': OwnerReviews,
        'Profile': Profile,
        'RestaurantDetail': RestaurantDetail,
        'WriteReview': WriteReview,
        'Login': Login,
        'Register': Register,
        'NotFound': NotFound
    }
};
