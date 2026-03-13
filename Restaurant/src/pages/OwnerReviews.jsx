import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/services/api';
import OwnerSidebar from '@/components/owner/OwnerSidebar';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Send,
  Loader2,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';

const sentimentColors = {
  positive: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  neutral: 'bg-stone-100 text-stone-600 border-stone-200',
  negative: 'bg-red-100 text-red-700 border-red-200'
};

const sentimentIcons = {
  positive: TrendingUp,
  neutral: Minus,
  negative: TrendingDown
};

export default function OwnerReviews() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);

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

  const { data: restaurants = [] } = useQuery({
    queryKey: ['owner-restaurants', user?.email],
    queryFn: () => mockApi.entities.Restaurant.filter({ owner_email: user.email }),
    enabled: !!user?.email,
  });

  const restaurant = restaurants[0];

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['owner-reviews', restaurant?.id],
    queryFn: () => mockApi.entities.Review.filter({ restaurant_id: restaurant.id }, '-created_date'),
    enabled: !!restaurant?.id,
  });

  const updateReview = useMutation({
    mutationFn: ({ id, data }) => mockApi.entities.Review.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-reviews'] });
      setSelectedReview(null);
      setResponseText('');
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    if (reviews.length === 0) return null;

    const avgRating = reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / reviews.length;
    const avgFood = reviews.filter(r => r.food_rating).reduce((sum, r) => sum + r.food_rating, 0) / reviews.filter(r => r.food_rating).length || 0;
    const avgService = reviews.filter(r => r.service_rating).reduce((sum, r) => sum + r.service_rating, 0) / reviews.filter(r => r.service_rating).length || 0;
    const avgAmbiance = reviews.filter(r => r.ambiance_rating).reduce((sum, r) => sum + r.ambiance_rating, 0) / reviews.filter(r => r.ambiance_rating).length || 0;
    const avgValue = reviews.filter(r => r.value_rating).reduce((sum, r) => sum + r.value_rating, 0) / reviews.filter(r => r.value_rating).length || 0;

    const sentimentCounts = {
      positive: reviews.filter(r => r.sentiment === 'positive').length,
      neutral: reviews.filter(r => r.sentiment === 'neutral').length,
      negative: reviews.filter(r => r.sentiment === 'negative').length,
    };

    return {
      avgRating,
      avgFood,
      avgService,
      avgAmbiance,
      avgValue,
      sentimentCounts,
      total: reviews.length
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        if (!review.review_text?.toLowerCase().includes(search) &&
          !review.reviewer_name?.toLowerCase().includes(search)) {
          return false;
        }
      }

      if (sentimentFilter !== 'all' && review.sentiment !== sentimentFilter) {
        return false;
      }

      if (ratingFilter !== 'all') {
        const minRating = parseInt(ratingFilter);
        if (review.overall_rating < minRating) return false;
      }

      return true;
    });
  }, [reviews, searchQuery, sentimentFilter, ratingFilter]);

  const generateAIInsights = async () => {
    if (reviews.length === 0) return;

    setIsGeneratingInsights(true);

    // In our mock implementation, we don't have access to the AI. So, mock response.
    // Delay slightly to show standard loading symbol
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = {
      summary: "Customer sentiment is largely positive, focusing on great service and excellent quality. Several diners pointed out some longer wait times on weekends.",
      strengths: ["Great service", "Excellent food", "Good atmosphere"],
      improvements: ["Wait times", "Noise levels", "Parking availability"],
      keywords: {
        positive: ["delicious", "friendly", "amazing"],
        negative: ["loud", "slow", "expensive"]
      }
    };

    setAiInsights(result);
    setIsGeneratingInsights(false);
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText.trim()) return;

    await updateReview.mutateAsync({
      id: selectedReview.id,
      data: { owner_response: responseText }
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'
              }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      <OwnerSidebar activePage="reviews" />

      <div className="flex-1 min-w-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-stone-900">Review Insights</h1>
              <p className="text-stone-500">Understand and respond to customer feedback</p>
            </div>
            <Button
              onClick={generateAIInsights}
              disabled={isGeneratingInsights || reviews.length === 0}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 gap-2 shadow-sm rounded-xl"
            >
              {isGeneratingInsights ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Insights
                </>
              )}
            </Button>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
              <Card className="rounded-2xl border-stone-200 shadow-sm overflow-hidden">
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Overall</p>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="text-2xl font-bold text-stone-900">{stats.avgRating.toFixed(1)}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-stone-200 shadow-sm overflow-hidden">
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Food</p>
                  <p className="text-2xl font-bold text-stone-900">{stats.avgFood.toFixed(1)}</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-stone-200 shadow-sm overflow-hidden">
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Service</p>
                  <p className="text-2xl font-bold text-stone-900">{stats.avgService.toFixed(1)}</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-stone-200 shadow-sm overflow-hidden">
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Ambiance</p>
                  <p className="text-2xl font-bold text-stone-900">{stats.avgAmbiance.toFixed(1)}</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-stone-200 shadow-sm overflow-hidden">
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Value</p>
                  <p className="text-2xl font-bold text-stone-900">{stats.avgValue.toFixed(1)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Insights Panel */}
          {aiInsights && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <Card className="rounded-2xl border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-stone-900">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    AI-Powered Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-bold text-stone-900 mb-2">Summary</h4>
                    <p className="text-stone-600 leading-relaxed">{aiInsights.summary}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Key Strengths
                      </h4>
                      <ul className="space-y-2.5">
                        {aiInsights.strengths?.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-stone-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Areas for Improvement
                      </h4>
                      <ul className="space-y-2.5">
                        {aiInsights.improvements?.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-stone-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-8 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-stone-200 rounded-xl focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                  <SelectTrigger className="w-[160px] h-11 border-stone-200 rounded-xl bg-white">
                    <SelectValue placeholder="Sentiment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sentiments</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-[160px] h-11 border-stone-200 rounded-xl bg-white">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="2">2+ Stars</SelectItem>
                    <SelectItem value="1">1+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-5">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-2xl" />
              ))
            ) : filteredReviews.length === 0 ? (
              <Card className="rounded-2xl border-stone-200 border-dashed">
                <CardContent className="py-24 text-center">
                  <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-100">
                    <MessageSquare className="w-8 h-8 text-stone-300" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-1">No reviews found</h3>
                  <p className="text-stone-500">Try adjusting your filters to see more results</p>
                </CardContent>
              </Card>
            ) : (
              filteredReviews.map((review) => {
                const SentimentIcon = sentimentIcons[review.sentiment] || Minus;
                return (
                  <Card key={review.id} className="rounded-2xl border-stone-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 font-bold text-lg border border-stone-200 uppercase">
                            {review.reviewer_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 text-lg leading-tight mb-1">{review.reviewer_name}</p>
                            <p className="text-xs text-stone-500 flex items-center gap-1.5 font-medium">
                              <Calendar className="w-3.5 h-3.5" />
                              {review.created_date ? format(parseISO(review.created_date), 'MMM d, yyyy') : 'Recently'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-3">
                            {review.sentiment && (
                              <Badge className={`${sentimentColors[review.sentiment]} border text-[10px] font-bold uppercase tracking-wider shadow-sm`}>
                                <SentimentIcon className="w-3 h-3 mr-1" />
                                {review.sentiment}
                              </Badge>
                            )}
                            {renderStars(review.overall_rating)}
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <p className="text-stone-600 text-base leading-relaxed mb-6 italic">"{review.review_text}"</p>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {review.keywords?.map((kw, idx) => (
                          <span key={idx} className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-500 rounded-lg px-2.5 py-1.5 border border-stone-200 group-hover:bg-amber-50 group-hover:text-amber-800 group-hover:border-amber-100 transition-colors">
                            {kw}
                          </span>
                        ))}
                      </div>

                      {review.owner_response ? (
                        <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <p className="text-xs font-bold text-amber-900 uppercase tracking-widest leading-none">Your Response</p>
                          </div>
                          <p className="text-sm text-stone-600 leading-relaxed font-medium italic">"{review.owner_response}"</p>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReview(review)}
                          className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-xl px-4 py-2 font-bold text-sm"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Send a Response
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Response Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-xl rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-display">Respond to Guest</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-bold text-stone-900">{selectedReview?.reviewer_name}</span>
                <div className="w-px h-3 bg-stone-200" />
                {renderStars(selectedReview?.overall_rating || 0)}
              </div>
              <p className="text-stone-600 text-sm italic leading-relaxed">"{selectedReview?.review_text}"</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-bold text-stone-900 ml-1">Your Message</p>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Ex: Thank you for the kind words! We hope to see you again soon..."
                className="min-h-40 rounded-2xl border-stone-200 focus:border-amber-500 focus:ring-amber-500 p-4"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setSelectedReview(null)} className="rounded-xl px-6 font-bold">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitResponse}
                disabled={!responseText.trim() || updateReview.isPending}
                className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-8 font-bold shadow-lg shadow-stone-200"
              >
                {updateReview.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit Response
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}