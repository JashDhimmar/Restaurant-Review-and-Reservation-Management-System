import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { mockApi } from '@/services/api';

const NavigationTracker = () => {
    const location = useLocation();

    useEffect(() => {
        const getPageName = (pathname) => {
            if (pathname === '/') return 'home';

            // Remove leading slash and try to match the first segment
            const pathParts = pathname.slice(1).split('/');
            const firstSegment = pathParts[0];

            switch (firstSegment) {
                // Add more cases as your routing structure grows
                case 'login': return 'login';
                case 'register': return 'register';
                case 'about': return 'about';
                // Parameterized routes (e.g., /user/123 -> user)
                case 'user': return 'user_profile';
                case 'product': return 'product_details';
                default:
                    // Fallback to the raw path if no match, 
                    // taking care of empty string for root somehow missing the first check
                    return pathname === '/' ? 'home' : pathname.replace(/\//g, '_').substring(1) || 'unknown_page';
            }
        };

        const pageName = getPageName(location.pathname);

        // We do not have appLogs in mockApi, so we will skip logging for now
        // mockApi.appLogs.logUserInApp(pageName).catch(() => {
        //     console.error('Failed to log navigation to:', pageName);
        // });

        console.log(`Navigated to: ${pageName}`);

    }, [location]);

    return null; // This component doesn't render anything
};

export default NavigationTracker;