import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AuthService from '@/services/AuthService';
import ReviewService from '@/services/ReviewService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Bell,
  Star,
  Loader2,
  CheckCircle,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reservationReminders, setReservationReminders] = useState(true);
  const [promotionalEmails, setPromotionalEmails] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = AuthService.isAuthenticated();
      if (isAuth) {
        let userData = AuthService.getUser();
        if (!userData) {
          try {
            userData = await AuthService.me();
          } catch (error) {
            console.error(error);
          }
        }
        if (userData) {
          setUser(userData);
          setFullName(userData.full_name || '');
          setEmail(userData.email || '');
          setPhone(userData.phone || '');
          setCity(userData.city || '');
          setEmailNotifications(userData.email_notifications !== false);
          setReservationReminders(userData.reservation_reminders !== false);
          setPromotionalEmails(userData.promotional_emails === true);
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  // Fetch user's reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['user-reviews', user?.email],
    queryFn: () => ReviewService.getReviews({ user: user.id }),
    enabled: !!user?.id && user?.role !== 'admin',
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await AuthService.updateMe({
        full_name: fullName,
        email,
        phone,
        city,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    AuthService.logout();
    window.location.href = '/Login';
  };

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="text-center">
          <User className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Sign in to view your profile</h2>
          <Button
            onClick={() => window.location.href = '/Login'}
            className="bg-[#F58220] hover:bg-[#E0721B] text-white rounded-full px-8 py-2"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6">
          <Skeleton className="w-[300px] h-[500px] rounded-xl shrink-0" />
          <Skeleton className="flex-1 h-[600px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Title Card */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-stone-900">Profile Settings</h1>
            <p className="text-sm text-stone-500 mt-1">Manage your personal information, security and documents</p>
          </div>
          {(user?.role === 'owner' || user?.role === 'admin') && (
            <Link
              to={createPageUrl(user.role === 'admin' ? 'AdminDashboard' : 'OwnerDashboard')}
              className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-700 text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* Left Sidebar */}
          <div className="w-full md:w-[280px] bg-white rounded-xl shadow-sm border border-stone-100 flex flex-col shrink-0 overflow-hidden">
            {/* Avatar Section */}
            <div className="p-8 flex flex-col items-center border-b border-stone-100">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-[#FEEBBC] flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                  <User className="w-12 h-12 text-[#D9A35B]" />
                </div>
              </div>
              <h2 className="font-bold text-stone-900">{fullName || 'Your Profile'}</h2>
            </div>

            {/* Nav Menu */}
            <nav className="flex flex-col p-4 space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile'
                  ? 'bg-[#FFF5EB] text-[#E0721B] border border-[#FDE3CA]'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 border border-transparent'
                  }`}
              >
                <User className="w-[18px] h-[18px]" />
                Personal Information
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'notifications'
                  ? 'bg-[#FFF5EB] text-[#E0721B] border border-[#FDE3CA]'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 border border-transparent'
                  }`}
              >
                <Bell className="w-[18px] h-[18px]" />
                Notifications
              </button>

              {user?.role !== 'admin' && (
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'reviews'
                      ? 'bg-[#FFF5EB] text-[#E0721B] border border-[#FDE3CA]'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 border border-transparent'
                    }`}
                >
                  <Star className="w-[18px] h-[18px]" />
                  Reviews
                </button>
              )}

              <div className="py-4 mt-2 mb-2 border-t border-stone-100"></div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all border border-transparent"
              >
                <LogOut className="w-[18px] h-[18px]" />
                Sign Out
              </button>
            </nav>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 w-full flex flex-col min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden relative min-h-[500px]">

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <>
                  {/* Styled Header */}
                  <div className="bg-gradient-to-r from-[#FDE3CA] to-[#FFF5EB] p-6 pb-20 rounded-t-xl relative border-b border-[#FAD6B4]">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-[#A85816] tracking-wide text-sm md:text-base">
                        PERSONAL INFORMATION
                      </h2>
                      <div className="flex items-center gap-3 relative z-10">
                        {saveSuccess && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-emerald-600 text-xs font-medium shadow-sm border border-emerald-100"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Saved!
                          </motion.span>
                        )}
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="bg-[#F58220] hover:bg-[#E0721B] text-white rounded-full px-6 py-2 shadow-md hover:shadow-lg transition-all"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Form Container */}
                  <div className="p-6 sm:p-8 -mt-16 relative z-0">
                    <div className="bg-white rounded-xl w-full">

                      {/* Section: Identity */}
                      <div className="mb-10">
                        <div className="inline-flex px-3 py-1 mb-6 rounded-full border border-[#F58220]/30 bg-[#FFF5EB] text-[#F58220] text-xs font-bold tracking-wider">
                          IDENTITY
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="fullName" className="text-xs font-bold text-stone-500 tracking-wide uppercase mb-2 block">
                              Full Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="fullName"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="h-[46px] rounded-lg border-stone-200 focus:border-[#F58220] focus:ring-[#F58220]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="city" className="text-xs font-bold text-stone-500 tracking-wide uppercase mb-2 block">
                              City / Location
                            </Label>
                            <Input
                              id="city"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="E.g. New York"
                              className="h-[46px] rounded-lg border-stone-200 focus:border-[#F58220] focus:ring-[#F58220]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section: Contact Details */}
                      <div>
                        <div className="inline-flex px-3 py-1 mb-6 rounded-full border border-[#F58220]/30 bg-[#FFF5EB] text-[#F58220] text-xs font-bold tracking-wider">
                          CONTACT DETAILS
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="email" className="text-xs font-bold text-stone-500 tracking-wide uppercase mb-2 block">
                              Email Address
                            </Label>
                            <Input
                              id="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              disabled={user?.role !== 'admin'}
                              className={`h-[46px] rounded-lg border-stone-200 focus:border-[#F58220] focus:ring-[#F58220] ${user?.role !== 'admin' ? 'bg-stone-50/50 text-stone-500' : ''
                                }`}
                            />
                            {user?.role !== 'admin' && (
                              <p className="text-xs text-stone-400 mt-2">To change email, please contact support.</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="phone" className="text-xs font-bold text-stone-500 tracking-wide uppercase mb-2 block">
                              Mobile Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="phone"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+1 555-000-0000"
                              className="h-[46px] rounded-lg border-stone-200 focus:border-[#F58220] focus:ring-[#F58220]"
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-stone-900">Notification Preferences</h2>
                    <p className="text-stone-500 mt-1">Manage how we contact you</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border border-stone-100 rounded-xl bg-stone-50/50">
                      <div>
                        <p className="font-medium text-stone-900">Email Notifications</p>
                        <p className="text-sm text-stone-500">Receive booking confirmations via email</p>
                      </div>
                      <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-stone-100 rounded-xl bg-stone-50/50">
                      <div>
                        <p className="font-medium text-stone-900">Reservation Reminders</p>
                        <p className="text-sm text-stone-500">Get reminded before your reservations</p>
                      </div>
                      <Switch checked={reservationReminders} onCheckedChange={setReservationReminders} />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-stone-100 rounded-xl bg-stone-50/50">
                      <div>
                        <p className="font-medium text-stone-900">Promotional Emails</p>
                        <p className="text-sm text-stone-500">Receive special offers and recommendations</p>
                      </div>
                      <Switch checked={promotionalEmails} onCheckedChange={setPromotionalEmails} />
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && user?.role !== 'admin' && (
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-stone-900">Your Reviews</h2>
                    <p className="text-stone-500 mt-1">Reviews you've written for restaurants</p>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="text-center py-16 bg-stone-50 rounded-xl border border-stone-100 border-dashed">
                      <Star className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-stone-900 mb-2">No reviews yet</h3>
                      <p className="text-stone-500">Share your dining experiences by writing reviews</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="p-5 border border-stone-100 rounded-xl bg-white hover:border-[#FDE3CA] transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-stone-900 text-lg">{review.restaurant_name || 'Restaurant'}</h4>
                            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-sm font-bold">
                              <span>{review.overall_rating}</span>
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </div>
                          </div>
                          <p className="text-stone-600 leading-relaxed">{review.review_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
