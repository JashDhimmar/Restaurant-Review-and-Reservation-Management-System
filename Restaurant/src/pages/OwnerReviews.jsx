import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
      }
    };
    loadUser();
  }, []);

  const { data: restaurants = [] } = useQuery({
    queryKey: ['owner-restaurants', user?.email],
    queryFn: () => base44.entities.Restaurant.filter({ owner_email: user.email }),
    enabled: !!user?.email,
  });

  const restaurant = restaurants[0];

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['owner-reviews', restaurant?.id],
    queryFn: () => base44.entities.Review.filter({ restaurant_id: restaurant.id }, '-created_date'),
    enabled: !!restaurant?.id,
  });

  const updateReview = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Review.update(id, data),
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
    
    const reviewTexts = reviews.slice(0, 20).map(r => ({
      rating: r.overall_rating,
      text: r.review_text,
      sentiment: r.sentiment
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze these restaurant reviews and provide insights:
        
${JSON.stringify(reviewTexts, null, 2)}

Provide a JSON response with:
1. summary: A brief 2-3 sentence summary of overall customer sentiment
2. strengths: Array of 3-5 positive themes customers mention
3. improvements: Array of 3-5 areas for improvement based on feedback
4. keywords: Array of most frequently mentioned positive and negative keywords`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } },
          keywords: { 
            type: "object",
            properties: {
              positive: { type: "array", items: { type: "string" } },
              negative: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    });

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
            className={`w-4 h-4 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            to={createPageUrl('OwnerDashboard')}
            className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-stone-900">Review Insights</h1>
              <p className="text-stone-500">Understand what your customers are saying</p>
            </div>
            <Button 
              onClick={generateAIInsights}
              disabled={isGeneratingInsights || reviews.length === 0}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 gap-2"
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            <Card className="rounded-xl border-stone-200">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-stone-500 mb-1">Overall</p>
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-stone-200">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-stone-500 mb-1">Food</p>
                <p className="text-2xl font-bold">{stats.avgFood.toFixed(1)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-stone-200">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-stone-500 mb-1">Service</p>
                <p className="text-2xl font-bold">{stats.avgService.toFixed(1)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-stone-200">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-stone-500 mb-1">Ambiance</p>
                <p className="text-2xl font-bold">{stats.avgAmbiance.toFixed(1)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-stone-200">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-stone-500 mb-1">Value</p>
                <p className="text-2xl font-bold">{stats.avgValue.toFixed(1)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Insights Panel */}
        {aiInsights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="rounded-2xl border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-stone-900 mb-2">Summary</h4>
                  <p className="text-stone-600">{aiInsights.summary}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-emerald-700 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {aiInsights.strengths?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-stone-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Areas for Improvement
                    </h4>
                    <ul className="space-y-2">
                      {aiInsights.improvements?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-stone-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {aiInsights.keywords && (
                  <div>
                    <h4 className="font-medium text-stone-900 mb-3">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {aiInsights.keywords.positive?.map((kw, idx) => (
                        <Badge key={idx} className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          {kw}
                        </Badge>
                      ))}
                      {aiInsights.keywords.negative?.map((kw, idx) => (
                        <Badge key={idx} className="bg-red-100 text-red-700 border-red-200">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger className="w-full sm:w-40 h-11">
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiment</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-40 h-11">
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

        {/* Reviews List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))
          ) : filteredReviews.length === 0 ? (
            <Card className="rounded-2xl border-stone-200">
              <CardContent className="py-16 text-center">
                <MessageSquare className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-stone-900 mb-2">No reviews found</h3>
                <p className="text-stone-500">Try adjusting your filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredReviews.map((review) => {
              const SentimentIcon = sentimentIcons[review.sentiment] || Minus;
              return (
                <Card key={review.id} className="rounded-2xl border-stone-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                          <span className="font-semibold text-stone-600">
                            {review.reviewer_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">{review.reviewer_name}</p>
                          <p className="text-sm text-stone-500">
                            {review.created_date ? format(parseISO(review.created_date), 'MMM d, yyyy') : 'Recently'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {review.sentiment && (
                          <Badge className={`${sentimentColors[review.sentiment]} border`}>
                            <SentimentIcon className="w-3 h-3 mr-1" />
                            {review.sentiment}
                          </Badge>
                        )}
                        {renderStars(review.overall_rating)}
                      </div>
                    </div>

                    <p className="text-stone-600 mb-4">{review.review_text}</p>

                    {review.keywords && review.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {review.keywords.map((kw, idx) => (
                          <span key={idx} className="text-xs bg-stone-100 text-stone-600 rounded-full px-2.5 py-1">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {review.owner_response ? (
                      <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-sm font-medium text-amber-800 mb-1">Your Response:</p>
                        <p className="text-sm text-stone-600">{review.owner_response}</p>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedReview(review)}
                        className="mt-2"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Respond
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Response Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-stone-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{selectedReview?.reviewer_name}</span>
                {renderStars(selectedReview?.overall_rating || 0)}
              </div>
              <p className="text-sm text-stone-600">{selectedReview?.review_text}</p>
            </div>
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Write your response..."
              className="min-h-32"
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedReview(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitResponse}
                disabled={!responseText.trim() || updateReview.isPending}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {updateReview.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Response
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}