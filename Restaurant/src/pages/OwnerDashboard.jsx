import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Calendar, 
  Users,
  Star,
  TrendingUp,
  Clock,
  Check,
  X,
  AlertCircle,
  Building2,
  ChevronRight,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { motion } from 'framer-motion';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-stone-100 text-stone-600 border-stone-200',
  no_show: 'bg-red-100 text-red-700 border-red-200'
};

export default function OwnerDashboard() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
      }
    };
    loadUser();
  }, []);

  // Fetch owner's restaurants
  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ['owner-restaurants', user?.email],
    queryFn: () => base44.entities.Restaurant.filter({ owner_email: user.email }),
    enabled: !!user?.email,
  });

  const restaurant = restaurants[0]; // For now, assume one restaurant per owner

  // Fetch reservations for the restaurant
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['owner-reservations', restaurant?.id],
    queryFn: () => base44.entities.Reservation.filter({ restaurant_id: restaurant.id }, '-date'),
    enabled: !!restaurant?.id,
  });

  // Fetch reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['owner-reviews', restaurant?.id],
    queryFn: () => base44.entities.Review.filter({ restaurant_id: restaurant.id }, '-created_date'),
    enabled: !!restaurant?.id,
  });

  const updateReservation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Reservation.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-reservations'] });
    },
  });

  // Stats calculations
  const stats = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    const todayReservations = reservations.filter(r => 
      isToday(parseISO(r.date)) && !['cancelled', 'no_show'].includes(r.status)
    );
    
    const thisWeekReservations = reservations.filter(r => {
      const date = parseISO(r.date);
      return isWithinInterval(date, { start: weekStart, end: weekEnd }) && 
             !['cancelled', 'no_show'].includes(r.status);
    });

    const todayGuests = todayReservations.reduce((sum, r) => sum + (r.party_size || 0), 0);
    const pendingCount = reservations.filter(r => r.status === 'pending').length;

    return {
      todayReservations: todayReservations.length,
      todayGuests,
      weeklyReservations: thisWeekReservations.length,
      pendingCount,
      averageRating: restaurant?.average_rating || 0,
      totalReviews: restaurant?.total_reviews || 0
    };
  }, [reservations, restaurant]);

  // Upcoming reservations (today and tomorrow)
  const upcomingReservations = useMemo(() => {
    return reservations
      .filter(r => {
        const date = parseISO(r.date);
        return (isToday(date) || isTomorrow(date)) && !['cancelled', 'completed', 'no_show'].includes(r.status);
      })
      .slice(0, 10);
  }, [reservations]);

  if (!user?.is_owner && restaurants.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Building2 className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">No Restaurant Found</h2>
          <p className="text-stone-500 mb-6">
            You don't have a restaurant registered yet. Contact us to get started!
          </p>
          <Link to={createPageUrl('Home')}>
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-stone-900">
                {restaurant?.name || 'Dashboard'}
              </h1>
              <p className="text-stone-500">Manage your restaurant and reservations</p>
            </div>
            <Link to={createPageUrl('OwnerRestaurant')}>
              <Button variant="outline" className="gap-2">
                <Building2 className="w-4 h-4" />
                Edit Restaurant
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="rounded-2xl border-stone-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <Badge variant="outline" className="text-xs">Today</Badge>
                </div>
                <p className="text-3xl font-bold text-stone-900">{stats.todayReservations}</p>
                <p className="text-sm text-stone-500">Reservations</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="rounded-2xl border-stone-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-5 h-5 text-emerald-500" />
                  <Badge variant="outline" className="text-xs">Today</Badge>
                </div>
                <p className="text-3xl font-bold text-stone-900">{stats.todayGuests}</p>
                <p className="text-sm text-stone-500">Expected Guests</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="rounded-2xl border-stone-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <Badge variant="outline" className="text-xs">Action</Badge>
                </div>
                <p className="text-3xl font-bold text-stone-900">{stats.pendingCount}</p>
                <p className="text-sm text-stone-500">Pending Approval</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="rounded-2xl border-stone-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Star className="w-5 h-5 text-amber-400" />
                  <Badge variant="outline" className="text-xs">{stats.totalReviews} reviews</Badge>
                </div>
                <p className="text-3xl font-bold text-stone-900">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
                </p>
                <p className="text-sm text-stone-500">Average Rating</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Reservations */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl border-stone-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Reservations</CardTitle>
                    <CardDescription>Today and tomorrow's bookings</CardDescription>
                  </div>
                  <Link to={createPageUrl('OwnerReservations')}>
                    <Button variant="ghost" size="sm" className="gap-1">
                      View All
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {reservationsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : upcomingReservations.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                    <p className="text-stone-500">No upcoming reservations</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingReservations.map((reservation) => (
                      <div 
                        key={reservation.id}
                        className="flex items-center justify-between p-4 bg-stone-50 rounded-xl"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-xs text-stone-500">
                              {isToday(parseISO(reservation.date)) ? 'TODAY' : 'TOMORROW'}
                            </p>
                            <p className="font-bold text-stone-900">{reservation.time}</p>
                          </div>
                          <div>
                            <p className="font-medium text-stone-900">{reservation.customer_name}</p>
                            <p className="text-sm text-stone-500">
                              {reservation.party_size} guests · {reservation.customer_phone || 'No phone'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${statusColors[reservation.status]} border`}>
                            {reservation.status}
                          </Badge>
                          {reservation.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => updateReservation.mutate({ id: reservation.id, status: 'confirmed' })}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => updateReservation.mutate({ id: reservation.id, status: 'cancelled' })}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Reviews */}
          <div>
            <Card className="rounded-2xl border-stone-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Reviews</CardTitle>
                    <CardDescription>What diners are saying</CardDescription>
                  </div>
                  <Link to={createPageUrl('OwnerReviews')}>
                    <Button variant="ghost" size="sm" className="gap-1">
                      View All
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                    <p className="text-stone-500">No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.slice(0, 5).map((review) => (
                      <div key={review.id} className="pb-4 border-b border-stone-100 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-stone-900">{review.reviewer_name}</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium">{review.overall_rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-stone-500 line-clamp-2">{review.review_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}