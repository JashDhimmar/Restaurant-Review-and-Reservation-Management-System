import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RestaurantService from '@/services/RestaurantService';
import ReviewService from '@/services/ReviewService';
import ReservationService from '@/services/ReservationService';
import AuthService from '@/services/AuthService';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Users,
  Star,
  Calendar,
  CheckCircle,
  XCircle,
  Search,
  MoreVertical,
  Shield,
  Flag,
  Eye,
  TrendingUp,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('adminDashboardActiveTab') || 'overview';
  });

  useEffect(() => {
    localStorage.setItem('adminDashboardActiveTab', activeTab);
  }, [activeTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'customer', 'owner', 'review'
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { toast } = useToast();

  const queryClient = useQueryClient();

  // Fetch Stats (Always loaded for Overview & Badges)
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => RestaurantService.getAdminStats(),
  });

  // Fetch all data (Lazy loaded based on active tab)
  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => RestaurantService.getRestaurants(),
    enabled: activeTab === 'restaurants',
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => AuthService.getCustomers(),
    enabled: activeTab === 'customers',
  });

  const { data: owners = [], isLoading: ownersLoading } = useQuery({
    queryKey: ['admin-owners'],
    queryFn: () => AuthService.getOwners(),
    enabled: activeTab === 'owners',
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => ReviewService.getReviews(),
    enabled: activeTab === 'reviews',
  });

  // Mutations

  const flagReview = useMutation({
    mutationFn: ({ id, flagged }) => ReviewService.updateReview(id, { is_flagged: flagged }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({
        title: variables.flagged ? "Review Flagged" : "Review Unflagged",
        description: `The review has been ${variables.flagged ? 'flagged' : 'unflagged'} successfully.`,
      });
    },
  });

  const deleteReview = useMutation({
    mutationFn: (id) => ReviewService.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({
        title: "Review Deleted",
        description: "The review has been removed successfully.",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => AuthService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
      toast({
        title: `${deleteType === 'owner' ? 'Owner' : 'Customer'} Deleted`,
        description: `The ${deleteType === 'owner' ? 'owner' : 'customer'} has been removed successfully.`,
      });
    },
  });

  // Filtered data
  const filteredRestaurants = useMemo(() => {
    if (!searchQuery) return restaurants;
    const search = searchQuery.toLowerCase();
    return restaurants.filter(r =>
      r.name?.toLowerCase().includes(search) ||
      r.city?.toLowerCase().includes(search)
    );
  }, [restaurants, searchQuery]);

  const filteredReviews = useMemo(() => {
    if (!searchQuery) return reviews;
    const search = searchQuery.toLowerCase();
    return reviews.filter(r =>
      r.review_text?.toLowerCase().includes(search) ||
      r.reviewer_name?.toLowerCase().includes(search)
    );
  }, [reviews, searchQuery]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const search = searchQuery.toLowerCase();
    return customers.filter(u =>
      u.full_name?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search)
    );
  }, [customers, searchQuery]);

  const filteredOwners = useMemo(() => {
    if (!searchQuery) return owners;
    const search = searchQuery.toLowerCase();
    return owners.filter(u =>
      u.full_name?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search)
    );
  }, [owners, searchQuery]);

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Admin Access Required</h2>
          <p className="text-stone-500">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'restaurants', label: 'Restaurants', icon: Building2, badge: dashboardStats?.pendingVerification },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'owners', label: 'Owners', icon: Shield },
    { id: 'reviews', label: 'Reviews', icon: Star, badge: dashboardStats?.flaggedReviews },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 hidden md:flex flex-col">
        <nav className="space-y-1 p-4 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-amber-50 text-amber-900'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-stone-400'}`} />
                  {item.label}
                </div>
                {item.badge > 0 && (
                  <Badge className={isActive ? 'bg-amber-200 text-amber-900' : 'bg-stone-200 text-stone-700'}>
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Nav (Fallback) */}
      <div className="md:hidden w-full bg-white border-b border-stone-200 p-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border ${activeTab === item.id ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'}`}
            >
              {item.label}
              {item.badge > 0 && ` (${item.badge})`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-1">Platform Overview</h2>
                <p className="text-stone-500">Real-time key metrics and statistics.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                <Card className="rounded-2xl border-stone-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-stone-500">Total Restaurants</CardTitle>
                    <Building2 className="w-4 h-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-stone-900">{dashboardStats?.totalRestaurants}</div>
                        <p className="text-xs text-stone-500 mt-1">+{dashboardStats?.newRestaurants} this week</p>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-stone-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-stone-500">Total Customers</CardTitle>
                    <Users className="w-4 h-4 text-stone-400" />
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-stone-900">{dashboardStats?.totalCustomers}</div>
                        <p className="text-xs text-stone-500 mt-1">+{dashboardStats?.newCustomers} this week</p>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-stone-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-stone-500">Total Owners</CardTitle>
                    <Shield className="w-4 h-4 text-stone-400" />
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-stone-900">{dashboardStats?.totalOwners}</div>
                        <p className="text-xs text-stone-500 mt-1">+{dashboardStats?.newOwners} this week</p>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-stone-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-stone-500">Platform Reviews</CardTitle>
                    <Star className="w-4 h-4 text-stone-400" />
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-stone-900">{dashboardStats?.totalReviews}</div>
                        <p className="text-xs text-stone-500 mt-1">Total reviews given</p>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-stone-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-stone-500">Total Reservations</CardTitle>
                    <Calendar className="w-4 h-4 text-stone-400" />
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-stone-900">{dashboardStats?.totalReservations}</div>
                        <p className="text-xs text-stone-500 mt-1">+{dashboardStats?.newReservations} this week</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reservation Trend */}
                <Card className="rounded-2xl border-stone-200 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Reservation Activity (Last 7 Days)</CardTitle>
                    <CardDescription>Daily booking trends across the platform</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {statsLoading ? (
                      <Skeleton className="w-full h-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboardStats?.charts?.reservationTrend}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#d97706" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#78716c', fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#78716c', fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#d97706"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCount)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* User Distribution */}
                <Card className="rounded-2xl border-stone-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">User Distribution</CardTitle>
                    <CardDescription>Breakdown by role</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center">
                    {statsLoading ? (
                      <Skeleton className="w-48 h-48 rounded-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashboardStats?.charts?.userDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#d97706" />
                            <Cell fill="#78716c" />
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Restaurant Status */}
                <Card className="rounded-2xl border-stone-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Restaurant Verification</CardTitle>
                    <CardDescription>Verified vs Pending verification</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center">
                    {statsLoading ? (
                      <Skeleton className="w-48 h-48 rounded-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashboardStats?.charts?.restaurantStatus}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Rating Distribution */}
                <Card className="rounded-2xl border-stone-200 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Review Ratings Distribution</CardTitle>
                    <CardDescription>Frequency of each star rating across the platform</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {statsLoading ? (
                      <Skeleton className="w-full h-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashboardStats?.charts?.ratingDistribution}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                          <XAxis
                            dataKey="rating"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#78716c', fontSize: 12 }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#78716c', fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            cursor={{ fill: '#f5f5f4' }}
                          />
                          <Bar
                            dataKey="count"
                            fill="#d97706"
                            radius={[4, 4, 0, 0]}
                            barSize={40}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Restaurants Tab Content */}
          {
            activeTab === 'restaurants' && (
              <Card className="rounded-2xl border-stone-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Restaurant Management</CardTitle>
                      <CardDescription>Verify and manage restaurant listings</CardDescription>
                    </div>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        placeholder="Search restaurants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {restaurantsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-stone-50">
                            <TableHead>Restaurant</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRestaurants.map((restaurant) => (
                            <TableRow key={restaurant.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100">
                                    {restaurant.cover_image && (
                                      <img src={restaurant.cover_image} alt="" className="w-full h-full object-cover" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">{restaurant.name}</p>
                                    <p className="text-sm text-stone-500 capitalize">{restaurant.cuisine}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{restaurant.owner_email || '-'}</TableCell>
                              <TableCell>{restaurant.city}</TableCell>
                              <TableCell>
                                {restaurant.average_rating > 0 ? (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    {Number(restaurant.average_rating || 0).toFixed(1)}
                                  </div>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className={restaurant.is_verified
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-100 text-amber-700 border-amber-200'
                                }>
                                  {restaurant.is_verified ? 'Verified' : 'Pending'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigate(`/AdminRestaurantReview?id=${restaurant.id}`)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      Review & Verify
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          }

          {/* Reviews Tab Content */}
          {
            activeTab === 'reviews' && (
              <Card className="rounded-2xl border-stone-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Review Moderation</CardTitle>
                      <CardDescription>Monitor and moderate user reviews</CardDescription>
                    </div>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        placeholder="Search reviews..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {reviewsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredReviews.slice(0, 20).map((review) => (
                        <div
                          key={review.id}
                          className={`p-4 rounded-xl border ${review.is_flagged ? 'border-red-200 bg-red-50' : 'border-stone-200 bg-white'}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">{review.reviewer_name}</span>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                  <span className="text-sm">{review.overall_rating}</span>
                                </div>
                                {review.is_flagged && (
                                  <Badge className="bg-red-100 text-red-700">Flagged</Badge>
                                )}
                              </div>
                              <p className="text-sm text-stone-600 line-clamp-2">{review.review_text}</p>
                              <p className="text-xs text-stone-400 mt-2">
                                {review.created_date && format(parseISO(review.created_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!review.is_flagged ? (
                                  <DropdownMenuItem
                                    onClick={() => flagReview.mutate({ id: review.id, flagged: true })}
                                    className="text-amber-600"
                                  >
                                    <Flag className="w-4 h-4 mr-2" />
                                    Flag Review
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => flagReview.mutate({ id: review.id, flagged: false })}
                                    className="text-emerald-600"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Unflag Review
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setItemToDelete(review);
                                    setDeleteType('review');
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Review
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          }

          {/* Customers Tab Content */}
          {
            activeTab === 'customers' && (
              <Card className="rounded-2xl border-stone-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Customer Management</CardTitle>
                      <CardDescription>View and manage platform customers</CardDescription>
                    </div>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {customersLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-stone-50">
                            <TableHead>Customer</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCustomers.slice(0, 20).map((u) => (
                            <TableRow key={u.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{u.full_name || 'No name'}</p>
                                  <p className="text-sm text-stone-500">{u.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {u.created_date ? format(parseISO(u.created_date), 'MMM d, yyyy') : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setItemToDelete(u);
                                    setDeleteType('customer');
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          }

          {/* Owners Tab Content */}
          {
            activeTab === 'owners' && (
              <Card className="rounded-2xl border-stone-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Owner Management</CardTitle>
                      <CardDescription>View and manage platform owners</CardDescription>
                    </div>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        placeholder="Search owners..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {ownersLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-stone-50">
                            <TableHead>Owner</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOwners.slice(0, 20).map((u) => (
                            <TableRow key={u.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{u.full_name || 'No name'}</p>
                                  <p className="text-sm text-stone-500">{u.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {u.created_date ? format(parseISO(u.created_date), 'MMM d, yyyy') : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setItemToDelete(u);
                                    setDeleteType('owner');
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          }
        </div>
      </main>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-stone-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteType}? This action cannot be undone.
              {itemToDelete && (
                <div className="mt-2 p-3 bg-stone-50 rounded-lg border border-stone-100 italic text-stone-600 text-xs text-left">
                  {deleteType === 'review' ? itemToDelete.review_text : (itemToDelete.full_name || itemToDelete.email)}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              onClick={() => {
                if (deleteType === 'review') {
                  deleteReview.mutate(itemToDelete.id);
                } else {
                  deleteUserMutation.mutate(itemToDelete.id);
                }
                setIsDeleteDialogOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
