import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  User, 
  Calendar, 
  LogOut, 
  Settings, 
  ChefHat,
  Menu,
  X,
  Star,
  Building2
} from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const userData = await base44.auth.me();
        setUser(userData);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  // Check if user is a restaurant owner
  const isOwner = user?.is_owner === true;
  const isAdmin = user?.role === 'admin';

  // Hide layout on certain pages
  const hideLayout = ['Login', 'Register'].includes(currentPageName);
  
  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <style>{`
        :root {
          --color-primary: #1a1a1a;
          --color-accent: #d4a574;
          --color-accent-dark: #b8956a;
        }
        
        .font-display {
          font-family: 'Inter', system-ui, sans-serif;
          letter-spacing: -0.02em;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #d4a574 0%, #b8956a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-stone-900 hidden sm:block">
                TableTaste
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link 
                to={createPageUrl('Home')} 
                className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                Discover
              </Link>
              {isAuthenticated && (
                <Link 
                  to={createPageUrl('MyReservations')} 
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  My Reservations
                </Link>
              )}
              {isOwner && (
                <Link 
                  to={createPageUrl('OwnerDashboard')} 
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link 
                  to={createPageUrl('AdminDashboard')} 
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Admin
                </Link>
              )}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 h-10 px-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-amber-700" />
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-stone-700">
                        {user?.full_name?.split(' ')[0] || 'Account'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="text-sm font-medium text-stone-900">{user?.full_name}</p>
                      <p className="text-xs text-stone-500">{user?.email}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Profile')} className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('MyReservations')} className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        My Reservations
                      </Link>
                    </DropdownMenuItem>
                    {isOwner && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('OwnerDashboard')} className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Owner Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('AdminDashboard')} className="flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={handleLogin}
                  className="bg-stone-900 hover:bg-stone-800 text-white rounded-full px-6"
                >
                  Sign In
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-stone-100">
            <nav className="px-4 py-4 space-y-1">
              <Link 
                to={createPageUrl('Home')} 
                className="block px-4 py-3 rounded-lg text-stone-700 hover:bg-stone-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Discover Restaurants
              </Link>
              {isAuthenticated && (
                <Link 
                  to={createPageUrl('MyReservations')} 
                  className="block px-4 py-3 rounded-lg text-stone-700 hover:bg-stone-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Reservations
                </Link>
              )}
              {isOwner && (
                <Link 
                  to={createPageUrl('OwnerDashboard')} 
                  className="block px-4 py-3 rounded-lg text-stone-700 hover:bg-stone-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Owner Dashboard
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-80px)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-xl text-white">TableTaste</span>
              </div>
              <p className="text-sm text-stone-500">
                Discover exceptional dining experiences and book your perfect table.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Discover</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Popular Restaurants</a></li>
                <li><a href="#" className="hover:text-white transition-colors">New Openings</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Top Rated</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">For Restaurants</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Partner with Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Business Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-stone-800 text-sm text-stone-500">
            <p>© 2024 TableTaste. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}