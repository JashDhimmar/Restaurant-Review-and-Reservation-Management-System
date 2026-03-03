import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Settings, 
  Loader2,
  CheckCircle,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reservationReminders, setReservationReminders] = useState(true);
  const [promotionalEmails, setPromotionalEmails] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
        setFullName(userData.full_name || '');
        setPhone(userData.phone || '');
        setCity(userData.city || '');
        setEmailNotifications(userData.email_notifications !== false);
        setReservationReminders(userData.reservation_reminders !== false);
        setPromotionalEmails(userData.promotional_emails === true);
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  // Fetch user's reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['user-reviews', user?.email],
    queryFn: () => base44.entities.Review.filter({ reviewer_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await base44.auth.updateMe({
      full_name: fullName,
      phone,
      city,
      email_notifications: emailNotifications,
      reservation_reminders: reservationReminders,
      promotional_emails: promotionalEmails,
    });
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <User className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Sign in to view your profile</h2>
          <Button 
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="bg-amber-500 hover:bg-amber-600"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <Skeleton className="h-64 w-full rounded-2xl mb-6" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
              <span className="text-2xl font-bold text-amber-700">
                {fullName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-stone-900">{fullName || 'Your Profile'}</h1>
              <p className="text-stone-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full justify-start mb-8 bg-stone-100 rounded-xl p-1.5 h-auto">
            <TabsTrigger 
              value="profile" 
              className="rounded-lg py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="rounded-lg py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="rounded-lg py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Star className="w-4 h-4 mr-2" />
              Reviews ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="rounded-2xl border-stone-200">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fullName" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-stone-400" />
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-stone-400" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="h-12 bg-stone-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-stone-400" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-stone-400" />
                      City
                    </Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Your city"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  {saveSuccess && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1 text-emerald-600 text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Saved successfully!
                    </motion.span>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="rounded-2xl border-stone-200">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how we contact you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-900">Email Notifications</p>
                    <p className="text-sm text-stone-500">Receive booking confirmations via email</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-900">Reservation Reminders</p>
                    <p className="text-sm text-stone-500">Get reminded before your reservations</p>
                  </div>
                  <Switch
                    checked={reservationReminders}
                    onCheckedChange={setReservationReminders}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-900">Promotional Emails</p>
                    <p className="text-sm text-stone-500">Receive special offers and recommendations</p>
                  </div>
                  <Switch
                    checked={promotionalEmails}
                    onCheckedChange={setPromotionalEmails}
                  />
                </div>

                <Button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-amber-500 hover:bg-amber-600 mt-4"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="rounded-2xl border-stone-200">
              <CardHeader>
                <CardTitle>Your Reviews</CardTitle>
                <CardDescription>Reviews you've written for restaurants</CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-stone-900 mb-2">No reviews yet</h3>
                    <p className="text-stone-500">Share your dining experiences by writing reviews</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div 
                        key={review.id}
                        className="p-4 bg-stone-50 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-stone-900">{review.restaurant_name || 'Restaurant'}</h4>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{review.overall_rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-stone-600 line-clamp-2">{review.review_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}