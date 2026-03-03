import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin,
  Star,
  X,
  ChevronRight,
  CalendarDays,
  History
} from 'lucide-react';
import { format, isPast, parseISO, isToday } from 'date-fns';
import { motion } from 'framer-motion';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-stone-100 text-stone-600 border-stone-200',
  no_show: 'bg-red-100 text-red-700 border-red-200'
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No Show'
};

export default function MyReservations() {
  const [user, setUser] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

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

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['my-reservations', user?.email],
    queryFn: () => base44.entities.Reservation.filter({ customer_email: user.email }, '-date'),
    enabled: !!user?.email,
  });

  const cancelReservation = useMutation({
    mutationFn: (id) => base44.entities.Reservation.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      setCancelDialogOpen(false);
      setSelectedReservation(null);
    },
  });

  const handleCancelClick = (reservation) => {
    setSelectedReservation(reservation);
    setCancelDialogOpen(true);
  };

  const upcomingReservations = reservations.filter(r => {
    const resDate = parseISO(r.date);
    return !isPast(resDate) || isToday(resDate);
  }).filter(r => !['cancelled', 'completed', 'no_show'].includes(r.status));

  const pastReservations = reservations.filter(r => {
    const resDate = parseISO(r.date);
    return (isPast(resDate) && !isToday(resDate)) || ['cancelled', 'completed', 'no_show'].includes(r.status);
  });

  const ReservationCard = ({ reservation, isPast: isPastReservation }) => {
    const canCancel = !isPastReservation && !['cancelled', 'completed', 'no_show'].includes(reservation.status);
    const canReview = isPastReservation && reservation.status === 'completed' && !reservation.has_reviewed;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-lg text-stone-900 mb-1">
                {reservation.restaurant_name}
              </h3>
              <Badge className={`${statusColors[reservation.status]} border`}>
                {statusLabels[reservation.status]}
              </Badge>
            </div>
            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancelClick(reservation)}
                className="text-stone-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-stone-500 mb-1">Date</p>
              <p className="font-medium text-stone-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-500" />
                {format(parseISO(reservation.date), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-stone-500 mb-1">Time</p>
              <p className="font-medium text-stone-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                {reservation.time}
              </p>
            </div>
            <div>
              <p className="text-stone-500 mb-1">Guests</p>
              <p className="font-medium text-stone-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-500" />
                {reservation.party_size} {reservation.party_size === 1 ? 'Guest' : 'Guests'}
              </p>
            </div>
            <div className="flex items-end">
              {canReview ? (
                <Link to={createPageUrl(`WriteReview?reservation_id=${reservation.id}`)}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Star className="w-4 h-4" />
                    Write Review
                  </Button>
                </Link>
              ) : (
                <Link to={createPageUrl(`RestaurantDetail?slug=${reservation.restaurant_id}`)}>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-stone-500">
                    View Restaurant
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {reservation.special_requests && (
            <div className="mt-4 pt-4 border-t border-stone-100">
              <p className="text-sm text-stone-500">
                <span className="font-medium">Special Requests:</span> {reservation.special_requests}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Sign in to view your reservations</h2>
          <p className="text-stone-500 mb-6">Keep track of your upcoming and past bookings</p>
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

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-display text-3xl font-bold text-stone-900 mb-2">
            My Reservations
          </h1>
          <p className="text-stone-500">
            Manage your upcoming and past dining experiences
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full justify-start mb-8 bg-stone-100 rounded-xl p-1.5 h-auto">
            <TabsTrigger 
              value="upcoming" 
              className="rounded-lg py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Upcoming ({upcomingReservations.length})
            </TabsTrigger>
            <TabsTrigger 
              value="past" 
              className="rounded-lg py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <History className="w-4 h-4 mr-2" />
              Past ({pastReservations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                ))}
              </div>
            ) : upcomingReservations.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
                <CalendarDays className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-stone-900 mb-2">No upcoming reservations</h3>
                <p className="text-stone-500 mb-6">Ready to discover your next favorite restaurant?</p>
                <Link to={createPageUrl('Home')}>
                  <Button className="bg-amber-500 hover:bg-amber-600">
                    Browse Restaurants
                  </Button>
                </Link>
              </div>
            ) : (
              upcomingReservations.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} isPast={false} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                ))}
              </div>
            ) : pastReservations.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
                <History className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-stone-900 mb-2">No past reservations</h3>
                <p className="text-stone-500">Your dining history will appear here</p>
              </div>
            ) : (
              pastReservations.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} isPast={true} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your reservation at {selectedReservation?.restaurant_name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelReservation.mutate(selectedReservation?.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Cancel Reservation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}