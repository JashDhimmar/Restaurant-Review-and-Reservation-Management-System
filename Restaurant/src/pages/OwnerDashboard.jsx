import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/services/api';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import OwnerSidebar from '@/components/owner/OwnerSidebar';
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
import { format, parseISO, isToday, isTomorrow, startOfWeek, endOfWeek, isWithinInterval, subDays, eachDayOfInterval } from 'date-fns';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

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
      const isAuth = await mockApi.auth.isAuthenticated();
      if (isAuth) {
        const userData = await mockApi.auth.me();
        setUser(userData);
      }
    };
    loadUser();
  }, []);

  // Fetch owner's restaurants
  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ['owner-restaurants', user?.email],
    queryFn: () => mockApi.entities.Restaurant.filter({ owner_email: user.email }),
    enabled: !!user?.email,
  });

  const restaurant = restaurants[0]; // For now, assume one restaurant per owner

  // Fetch reservations for the restaurant
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['owner-reservations', restaurant?.id],
    queryFn: () => mockApi.entities.Reservation.filter({ restaurant_id: restaurant.id }, '-date'),
    enabled: !!restaurant?.id,
  });

  // Fetch reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['owner-reviews', restaurant?.id],
    queryFn: () => mockApi.entities.Review.filter({ restaurant_id: restaurant.id }, '-created_date'),
    enabled: !!restaurant?.id,
  });

  const updateReservation = useMutation({
    mutationFn: ({ id, status }) => mockApi.entities.Reservation.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-reservations'] });
    },
  });

  // Stats calculations
  const stats = useMemo(() => {
    const today = new Date();
    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today,
    });

    // Booking Trends Data
    const bookingTrends = last7Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const count = reservations.filter(r => r.date === dateStr).length;
      return {
        date: format(date, 'MMM d'),
        count
      };
    });

    // Status Distribution Data
    const statusCounts = reservations.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = [
      { name: 'Confirmed', value: statusCounts.confirmed || 0, color: '#10b981' },
      { name: 'Pending', value: statusCounts.pending || 0, color: '#f59e0b' },
      { name: 'Completed', value: statusCounts.completed || 0, color: '#78716c' },
      { name: 'Cancelled', value: statusCounts.cancelled || 0, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Rating Distribution Data
    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
      rating: `${rating} Star`,
      count: reviews.filter(r => Math.round(r.overall_rating || 0) === rating).length
    }));

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
      totalReviews: restaurant?.total_reviews || 0,
      bookingTrends,
      statusDistribution,
      ratingDistribution
    };
  }, [reservations, reviews, restaurant]);

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
    <div className="flex min-h-screen bg-stone-50">
      <OwnerSidebar activePage="dashboard" />
      
      <div className="flex-1 min-w-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
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
                    {stats.averageRating > 0 ? Number(stats.averageRating).toFixed(1) : '-'}
                  </p>
                  <p className="text-sm text-stone-500">Average Rating</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Booking Trends Chart */}
            <Card className="rounded-2xl border-stone-200 lg:col-span-2 shadow-sm overflow-hidden">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-stone-900">Booking Activity</CardTitle>
                    <CardDescription>Daily reservation trends for the last 7 days</CardDescription>
                  </div>
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent className="h-[300px] pt-6 pr-6">
                {reservationsLoading ? (
                  <Skeleton className="w-full h-full rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.bookingTrends}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#78716c', fontSize: 11, fontWeight: 500 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#78716c', fontSize: 11, fontWeight: 500 }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '16px',
                          border: '1px solid #e7e5e4',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#f59e0b"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorCount)"
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card className="rounded-2xl border-stone-200 shadow-sm overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-bold text-stone-900">Reservation Status</CardTitle>
                <CardDescription>Breakdown of all bookings</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center pt-0">
                {reservationsLoading ? (
                  <Skeleton className="w-48 h-48 rounded-full" />
                ) : stats.statusDistribution.length === 0 ? (
                  <div className="text-center">
                    <AlertCircle className="w-10 h-10 text-stone-200 mx-auto mb-2" />
                    <p className="text-xs text-stone-400">No data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={8}
                        dataKey="value"
                        animationDuration={1500}
                      >
                        {stats.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-xs font-bold text-stone-600 uppercase tracking-tight">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Ratings Distribution Chart */}
            <Card className="rounded-2xl border-stone-200 shadow-sm overflow-hidden lg:col-span-1">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-bold text-stone-900">Review Distribution</CardTitle>
                <CardDescription>Number of ratings by stars</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px] pt-6 pr-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.ratingDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="rating"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      width={60}
                      tick={{ fill: '#78716c', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar
                      dataKey="count"
                      fill="#f59e0b"
                      radius={[0, 4, 4, 0]}
                      barSize={24}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
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
                      {upcomingReservations.map((reservation) => {
                        const guest_token = reservation.guest_name ? reservation.guest_name.charAt(0).toUpperCase() : 'G';
                        return (
                          <div
                            key={reservation.id}
                            className="flex items-center justify-between p-4 bg-stone-50 rounded-xl"
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-center w-16">
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                  {isToday(parseISO(reservation.date)) ? 'TODAY' : 'TOMORROW'}
                                </p>
                                <p className="font-bold text-stone-900">{reservation.time}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 font-bold text-xs">
                                  {guest_token}
                                </div>
                                <div>
                                  <p className="font-medium text-stone-900">{reservation.guest_name}</p>
                                  <p className="text-sm text-stone-500">
                                    {reservation.guests} guests · {reservation.guest_phone || 'No phone'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${statusColors[reservation.status]} border shadow-sm`}>
                                {reservation.status}
                              </Badge>
                              {reservation.status === 'pending' && (
                                <div className="flex gap-1 ml-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full"
                                    onClick={() => updateReservation.mutate({ id: reservation.id, status: 'confirmed' })}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                                    onClick={() => updateReservation.mutate({ id: reservation.id, status: 'cancelled' })}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
                    <div className="space-y-5">
                      {reviews.slice(0, 5).map((review) => (
                        <div key={review.id} className="pb-4 border-b border-stone-100 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-stone-900">{review.reviewer_name}</span>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded text-amber-700 text-xs font-bold">
                              <Star className="w-3 h-3 fill-current" />
                              <span>{review.overall_rating}</span>
                            </div>
                          </div>
                          <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed italic">"{review.review_text}"</p>
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
    </div>
  );
}
