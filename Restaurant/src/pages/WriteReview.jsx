import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { mockApi } from '@/services/api';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Star,
  ChevronLeft,
  Loader2,
  CheckCircle,
  UtensilsCrossed,
  Users,
  Sparkles,
  Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function WriteReview() {
  const urlParams = new URLSearchParams(window.location.search);
  const reservationId = urlParams.get('reservation_id');

  const [user, setUser] = useState(null);
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [foodRating, setFoodRating] = useState([4]);
  const [serviceRating, setServiceRating] = useState([4]);
  const [ambianceRating, setAmbianceRating] = useState([4]);
  const [valueRating, setValueRating] = useState([4]);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: () => mockApi.entities.Reservation.filter({ id: reservationId }),
    enabled: !!reservationId,
  });

  const reservation = reservations[0];

  const { data: restaurants = [] } = useQuery({
    queryKey: ['restaurant-for-review', reservation?.restaurant_id],
    queryFn: () => mockApi.entities.Restaurant.filter({ id: reservation.restaurant_id }),
    enabled: !!reservation?.restaurant_id,
  });

  const restaurant = restaurants[0];

  const submitReview = useMutation({
    mutationFn: async (reviewData) => {
      // Create the review
      await mockApi.entities.Review.create(reviewData);

      // Mark reservation as reviewed
      if (reservationId) {
        await mockApi.entities.Reservation.update(reservationId, { has_reviewed: true });
      }

      // Update restaurant average rating
      const allReviews = await mockApi.entities.Review.filter({ restaurant_id: reviewData.restaurant_id });
      const totalRating = allReviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0);
      const avgRating = totalRating / allReviews.length;

      await mockApi.entities.Restaurant.update(reviewData.restaurant_id, {
        average_rating: avgRating,
        total_reviews: allReviews.length
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!overallRating || !reviewText.trim()) return;

    submitReview.mutate({
      restaurant_id: reservation?.restaurant_id || restaurant?.id,
      reservation_id: reservationId,
      reviewer_email: user?.email,
      reviewer_name: user?.full_name,
      overall_rating: overallRating,
      food_rating: foodRating[0],
      service_rating: serviceRating[0],
      ambiance_rating: ambianceRating[0],
      value_rating: valueRating[0],
      review_text: reviewText,
      is_verified: !!reservationId,
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-3xl p-12 shadow-lg max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-3">Thank You!</h2>
          <p className="text-stone-500 mb-8">
            Your review has been submitted successfully. It helps other diners discover great restaurants!
          </p>
          <Link to={createPageUrl('MyReservations')}>
            <Button className="bg-amber-500 hover:bg-amber-600">
              Back to My Reservations
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Star className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Sign in to write a review</h2>
          <Button
            onClick={() => mockApi.auth.redirectToLogin()}
            className="bg-amber-500 hover:bg-amber-600"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const restaurantName = restaurant?.name || reservation?.restaurant_name || 'Restaurant';

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to={createPageUrl('MyReservations')}
            className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Reservations
          </Link>
          <h1 className="font-display text-2xl font-bold text-stone-900">
            Review {restaurantName}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Overall Rating */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <h3 className="font-semibold text-stone-900 mb-4">Overall Rating</h3>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setOverallRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${star <= (hoverRating || overallRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-stone-200'
                      }`}
                  />
                </button>
              ))}
            </div>
            {overallRating > 0 && (
              <p className="text-center mt-3 text-stone-600">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][overallRating]}
              </p>
            )}
          </div>

          {/* Aspect Ratings */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-6">
            <h3 className="font-semibold text-stone-900">Rate Different Aspects</h3>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-stone-700">
                  <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                  Food Quality
                </span>
                <span className="font-medium text-amber-600">{foodRating[0]}/5</span>
              </div>
              <Slider
                value={foodRating}
                onValueChange={setFoodRating}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-stone-700">
                  <Users className="w-4 h-4 text-amber-500" />
                  Service
                </span>
                <span className="font-medium text-amber-600">{serviceRating[0]}/5</span>
              </div>
              <Slider
                value={serviceRating}
                onValueChange={setServiceRating}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-stone-700">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Ambiance
                </span>
                <span className="font-medium text-amber-600">{ambianceRating[0]}/5</span>
              </div>
              <Slider
                value={ambianceRating}
                onValueChange={setAmbianceRating}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-stone-700">
                  <Wallet className="w-4 h-4 text-amber-500" />
                  Value for Money
                </span>
                <span className="font-medium text-amber-600">{valueRating[0]}/5</span>
              </div>
              <Slider
                value={valueRating}
                onValueChange={setValueRating}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Review Text */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <h3 className="font-semibold text-stone-900 mb-4">Share Your Experience</h3>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us about your dining experience. What did you love? What could be improved?"
              className="min-h-40 resize-none"
            />
            <p className="text-xs text-stone-400 mt-2">
              Minimum 20 characters ({reviewText.length}/20)
            </p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!overallRating || reviewText.length < 20 || submitReview.isPending}
            className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-lg disabled:opacity-50"
          >
            {submitReview.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}