import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RestaurantService from '@/services/RestaurantService';
import ReviewService from '@/services/ReviewService';
import ReservationService from '@/services/ReservationService';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ReviewCard from '../components/restaurant/ReviewCard';
import BookingForm from '../components/booking/BookingForm';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/lib/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Star,
  MapPin,
  Phone,
  Globe,
  Clock,
  Wifi,
  ParkingCircle,
  Music,
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  CheckCircle,
  X,
  UtensilsCrossed,
  Shield,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const featureIcons = {
  'WiFi': Wifi,
  'Parking': ParkingCircle,
  'Live Music': Music,
  'Outdoor Seating': UtensilsCrossed,
};

export default function RestaurantDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const queryClient = useQueryClient();

  // Fetch Restaurant Details
  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => RestaurantService.getRestaurant(id),
    enabled: !!id,
  });

  // Fetch Reviews
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => ReviewService.getReviews({ restaurant: id }),
    enabled: !!id,
  });

  // Verification Mutation
  const verifyMutation = useMutation({
    mutationFn: () => RestaurantService.verifyRestaurant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', id] });
      toast({
        title: "Restaurant Verified",
        description: "The restaurant has been successfully verified and is now live.",
      });
    },
  });

  const createReservation = useMutation({
    mutationFn: (data) => ReservationService.createReservation(data),
    onSuccess: () => {
      setBookingSuccess(true);
      setTimeout(() => {
        setShowBookingDialog(false);
        setBookingSuccess(false);
      }, 3000);
    },
  });

  const handleBooking = async (bookingData) => {
    if (!user) {
      navigate('/Login');
      return;
    }
    createReservation.mutate({
      ...bookingData,
      restaurant: id
    });
  };

  if (restaurantLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Skeleton className="h-[50vh] w-full" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-4">Restaurant not found</h2>
          <Link to={createPageUrl('Home')}>
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const gallery = restaurant.gallery?.length > 0
    ? restaurant.gallery.map(item => item.image_source)
    : [restaurant.cover_image_source || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80'];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Admin Verification Bar */}
      {isAdmin && !restaurant.is_verified && (
        <div className="bg-amber-600 text-white py-3 px-4 sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <div>
                <span className="font-semibold">Verification Pending</span>
                <p className="text-xs text-amber-100 hidden sm:block">Please review restaurant details and verify if accurate.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
                className="bg-white text-amber-700 hover:bg-amber-50 h-9 rounded-full px-6 font-semibold"
              >
                {verifyMutation.isPending ? 'Verifying...' : 'Approve & Verify'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Gallery */}
      <section className="relative h-[50vh] lg:h-[60vh] bg-stone-900">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={gallery[currentImageIndex]}
            alt={restaurant.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80';
            }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Gallery Navigation */}
        {gallery.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev + 1) % gallery.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
              {gallery.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Restaurant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-white/90 backdrop-blur-sm text-stone-800 font-semibold px-3 py-1">
                {restaurant.price_range}
              </Badge>
              <Badge className="bg-white/90 backdrop-blur-sm text-stone-800 px-3 py-1 capitalize">
                {restaurant.cuisine?.replace('_', ' ')}
              </Badge>
              {restaurant.is_verified && (
                <Badge className="bg-emerald-500 text-white px-3 py-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>

            <h1 className="font-display text-3xl lg:text-5xl font-bold text-white mb-3">
              {restaurant.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{restaurant.address}, {restaurant.city}</span>
              </div>
              {restaurant.average_rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{Number(restaurant.average_rating || 0).toFixed(1)}</span>
                  <span className="text-white/70">({restaurant.total_reviews} reviews)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI Summary */}
            {restaurant.ai_summary && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                <h3 className="font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs">AI</span>
                  Review Summary
                </h3>
                <p className="text-stone-600 leading-relaxed">{restaurant.ai_summary}</p>
              </div>
            )}

            {/* Description */}
            {restaurant.description && (
              <div>
                <h3 className="font-display text-xl font-bold text-stone-900 mb-3">About</h3>
                <p className="text-stone-600 leading-relaxed">{restaurant.description}</p>
              </div>
            )}

            {/* Features */}
            {restaurant.features && restaurant.features.length > 0 && (
              <div>
                <h3 className="font-display text-xl font-bold text-stone-900 mb-4">Amenities</h3>
                <div className="flex flex-wrap gap-3">
                  {restaurant.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-2"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-stone-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {restaurant.opening_hours && (
              <div>
                <h3 className="font-display text-xl font-bold text-stone-900 mb-4">Opening Hours</h3>
                <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
                  {Object.entries(restaurant.opening_hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between items-center px-5 py-3">
                      <span className="capitalize text-stone-700">{day}</span>
                      <span className="text-stone-500">{hours || 'Closed'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div>
              <Tabs defaultValue="reviews" className="w-full">
                <TabsList className="w-full justify-start mb-6 bg-stone-100 rounded-xl p-1">
                  <TabsTrigger value="reviews" className="rounded-lg">
                    Reviews ({reviews.length})
                  </TabsTrigger>
                  <TabsTrigger value="photos" className="rounded-lg">
                    Photos ({gallery.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="reviews" className="space-y-4">
                  {reviewsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                      ))}
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-stone-100">
                      <Star className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-stone-900 mb-2">No reviews yet</h4>
                      <p className="text-stone-500">Be the first to share your experience!</p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="photos" className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className="aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={img}
                        alt={`${restaurant.name} photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl border border-stone-200 shadow-lg p-6">
                <h3 className="font-display text-xl font-bold text-stone-900 mb-2">
                  Make a Reservation
                </h3>
                <p className="text-stone-500 text-sm mb-6">
                  Book your table in seconds
                </p>

                {/* Quick Info */}
                <div className="space-y-3 mb-6 pb-6 border-b border-stone-100">
                  {restaurant.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-stone-400" />
                      <span className="text-stone-600">{restaurant.phone}</span>
                    </div>
                  )}
                  {restaurant.website && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="w-4 h-4 text-stone-400" />
                      <a
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mt-6 pt-6 border-t border-stone-100 space-y-4">
                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Owner Contact</h4>
                      <div className="bg-stone-50 rounded-xl p-4 space-y-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-stone-500">Email Address</span>
                          <span className="text-sm font-medium text-stone-900">{restaurant.owner_email || 'Not provided'}</span>
                        </div>
                        {restaurant.phone && (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-stone-500">Business Phone</span>
                            <span className="text-sm font-medium text-stone-900">{restaurant.phone}</span>
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-stone-500">Member Since</span>
                          <span className="text-sm font-medium text-stone-900">
                            {restaurant.created_date ? new Date(restaurant.created_date).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setShowBookingDialog(true)}
                  className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-lg"
                >
                  <CalendarPlus className="w-5 h-5 mr-2" />
                  Reserve a Table
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {bookingSuccess ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-2">Booking Confirmed!</h3>
              <p className="text-stone-500">
                Your reservation at {restaurant.name} has been confirmed. Check your email for details.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  Reserve at {restaurant.name}
                </DialogTitle>
              </DialogHeader>

              {!user ? (
                <div className="text-center py-8">
                  <p className="text-stone-500 mb-6">Please sign in to make a reservation</p>
                  <Button
                    onClick={() => navigate('/Login')}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    Sign In to Continue
                  </Button>
                </div>
              ) : (
                <BookingForm
                  restaurant={restaurant}
                  user={user}
                  onSubmit={handleBooking}
                  isSubmitting={createReservation.isPending}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}