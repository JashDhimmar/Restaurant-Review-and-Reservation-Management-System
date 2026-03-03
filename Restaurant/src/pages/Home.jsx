import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RestaurantCard from '../components/restaurant/RestaurantCard';
import SearchFilters from '../components/restaurant/SearchFilters';
import { Skeleton } from "@/components/ui/skeleton";
import { ChefHat, Sparkles, TrendingUp, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [filters, setFilters] = useState({
    search: '',
    cuisine: 'all',
    price_range: 'all',
    rating: 'all'
  });

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => base44.entities.Restaurant.filter({ is_active: true }),
  });

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(restaurant => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          restaurant.name?.toLowerCase().includes(searchLower) ||
          restaurant.cuisine?.toLowerCase().includes(searchLower) ||
          restaurant.city?.toLowerCase().includes(searchLower) ||
          restaurant.address?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Cuisine filter
      if (filters.cuisine !== 'all' && restaurant.cuisine !== filters.cuisine) {
        return false;
      }

      // Price range filter
      if (filters.price_range !== 'all' && restaurant.price_range !== filters.price_range) {
        return false;
      }

      // Rating filter
      if (filters.rating !== 'all') {
        const minRating = parseFloat(filters.rating);
        if (!restaurant.average_rating || restaurant.average_rating < minRating) {
          return false;
        }
      }

      return true;
    });
  }, [restaurants, filters]);

  // Trending restaurants (highest rated)
  const trendingRestaurants = useMemo(() => {
    return [...restaurants]
      .filter(r => r.average_rating > 0)
      .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      .slice(0, 4);
  }, [restaurants]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Discover Your Next Favorite
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Find & Book the
              <span className="block text-amber-400">Perfect Table</span>
            </h1>
            
            <p className="text-lg text-stone-300 mb-10 max-w-2xl mx-auto">
              Explore curated restaurants, read authentic reviews, and secure your reservation in seconds.
            </p>

            {/* Search Bar in Hero */}
            <div className="bg-white rounded-2xl p-2 shadow-2xl max-w-2xl mx-auto">
              <SearchFilters 
                filters={filters} 
                onFilterChange={setFilters}
              />
            </div>
          </motion.div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#fafaf9"/>
          </svg>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Trending Section */}
        {trendingRestaurants.length > 0 && !filters.search && filters.cuisine === 'all' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-stone-900">Trending Now</h2>
                <p className="text-sm text-stone-500">Popular picks by local foodies</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          </motion.div>
        )}

        {/* All Restaurants */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-stone-700" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-stone-900">
                  {filters.search || filters.cuisine !== 'all' ? 'Search Results' : 'All Restaurants'}
                </h2>
                <p className="text-sm text-stone-500">
                  {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden">
                  <Skeleton className="h-56 w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-10 h-10 text-stone-400" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-2">No restaurants found</h3>
              <p className="text-stone-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-amber-500 to-amber-600 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
            Own a Restaurant?
          </h2>
          <p className="text-amber-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of restaurants growing their business with TableTaste. 
            Get discovered by food lovers and manage your reservations effortlessly.
          </p>
          <button className="bg-white text-amber-600 font-semibold px-8 py-4 rounded-full hover:bg-amber-50 transition-colors shadow-lg">
            Partner With Us
          </button>
        </div>
      </section>
    </div>
  );
}