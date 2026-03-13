import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { LayoutDashboard, Calendar, MessageSquare, Building2 } from 'lucide-react';

const OwnerSidebar = ({ activePage }) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: createPageUrl('OwnerDashboard')
    },
    {
      id: 'reservations',
      label: 'Reservations',
      icon: Calendar,
      path: createPageUrl('OwnerReservations')
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: MessageSquare,
      path: createPageUrl('OwnerReviews')
    },
    {
      id: 'restaurant',
      label: 'Restaurant Settings',
      icon: Building2,
      path: createPageUrl('OwnerRestaurant')
    }
  ];

  return (
    <div className="w-64 shrink-0 bg-white border-r border-stone-200 min-h-[calc(100vh-80px)] hidden lg:block">
      <div className="sticky top-20 p-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-amber-50 text-amber-900 border border-amber-100' 
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-700' : 'text-stone-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default OwnerSidebar;
