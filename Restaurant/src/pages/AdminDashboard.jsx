import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
  TrendingUp
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // Fetch all data
  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => base44.entities.Restaurant.list('-created_date'),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date'),
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => base44.entities.Review.list('-created_date'),
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['admin-reservations'],
    queryFn: () => base44.entities.Reservation.list('-created_date', 100),
  });

  // Mutations
  const verifyRestaurant = useMutation({
    mutationFn: ({ id, verified }) => base44.entities.Restaurant.update(id, { is_verified: verified }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] }),
  });

  const flagReview = useMutation({
    mutationFn: ({ id, flagged }) => base44.entities.Review.update(id, { is_flagged: flagged }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  const deleteReview = useMutation({
    mutationFn: (id) => base44.entities.Review.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    const weekAgo = subDays(today, 7);
    
    const newRestaurants = restaurants.filter(r => 
      r.created_date && parseISO(r.created_date) >= weekAgo
    ).length;
    
    const newUsers = users.filter(u => 
      u.created_date && parseISO(u.created_date) >= weekAgo
    ).length;
    
    const newReservations = reservations.filter(r => 
      r.created_date && parseISO(r.created_date) >= weekAgo
    ).length;

    const pendingVerification = restaurants.filter(r => !r.is_verified).length;
    const flaggedReviews = reviews.filter(r => r.is_flagged).length;

    return {
      totalRestaurants: restaurants.length,
      totalUsers: users.length,
      totalReviews: reviews.length,
      totalReservations: reservations.length,
      newRestaurants,
      newUsers,
      newReservations,
      pendingVerification,
      flaggedReviews
    };
  }, [restaurants, users, reviews, reservations]);

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

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-stone-900">Admin Dashboard</h1>
              <p className="text-stone-500">Platform overview and management</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-2xl border-stone-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  <Badge variant="outline" className="text-xs text-emerald-600">
                    +{stats.newRestaurants} this week
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-stone-900">{stats.totalRestaurants}</p>
                <p className="text-sm text-stone-500">Total Restaurants</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-2xl border-stone-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-5 h-5 text-emerald-500" />
                  <Badge variant="outline" className="text-xs text-emerald-600">
                    +{stats.newUsers} this week
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-stone-900">{stats.totalUsers}</p>
                <p className="text-sm text-stone-500">Total Users</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="rounded-2xl border-stone-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Star className="w-5 h-5 text-amber-500" />
                  {stats.flaggedReviews > 0 && (
                    <Badge className="bg-red-100 text-red-700 text-xs">
                      {stats.flaggedReviews} flagged
                    </Badge>
                  )}
                </div>
                <p className="text-3xl font-bold text-stone-900">{stats.totalReviews}</p>
                <p className="text-sm text-stone-500">Total Reviews</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="rounded-2xl border-stone-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <Badge variant="outline" className="text-xs text-emerald-600">
                    +{stats.newReservations} this week
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-stone-900">{stats.totalReservations}</p>
                <p className="text-sm text-stone-500">Total Reservations</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="restaurants" className="w-full">
          <TabsList className="w-full justify-start mb-8 bg-stone-100 rounded-xl p-1.5 h-auto overflow-x-auto">
            <TabsTrigger value="restaurants" className="rounded-lg py-3 px-6">
              <Building2 className="w-4 h-4 mr-2" />
              Restaurants
              {stats.pendingVerification > 0 && (
                <Badge className="ml-2 bg-amber-100 text-amber-700">{stats.pendingVerification}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg py-3 px-6">
              <Star className="w-4 h-4 mr-2" />
              Reviews
              {stats.flaggedReviews > 0 && (
                <Badge className="ml-2 bg-red-100 text-red-700">{stats.flaggedReviews}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg py-3 px-6">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants">
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
                                {restaurant.average_rating.toFixed(1)}
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
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {!restaurant.is_verified ? (
                                  <DropdownMenuItem
                                    onClick={() => verifyRestaurant.mutate({ id: restaurant.id, verified: true })}
                                    className="text-emerald-600"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Verify
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => verifyRestaurant.mutate({ id: restaurant.id, verified: false })}
                                    className="text-red-600"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Revoke Verification
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
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
                                onClick={() => deleteReview.mutate(review.id)}
                                className="text-red-600"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
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
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="rounded-2xl border-stone-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View and manage platform users</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50">
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.slice(0, 20).map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{u.full_name || 'No name'}</p>
                              <p className="text-sm text-stone-500">{u.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={u.role === 'admin' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-stone-100 text-stone-600'
                            }>
                              {u.role || 'user'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {u.created_date ? format(parseISO(u.created_date), 'MMM d, yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}