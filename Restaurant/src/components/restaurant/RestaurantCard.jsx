import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Star, MapPin, Clock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const cuisineEmoji = {
  italian: '🍝',
  japanese: '🍣',
  mexican: '🌮',
  indian: '🍛',
  chinese: '🥢',
  french: '🥐',
  american: '🍔',
  mediterranean: '🫒',
  thai: '🍜',
  korean: '🥘',
  other: '🍽️'
};

export default function RestaurantCard({ restaurant }) {
  const {
    name,
    slug,
    cuisine,
    price_range,
    address,
    city,
    cover_image,
    average_rating,
    total_reviews,
    features
  } = restaurant;

  return (
    <Link to={createPageUrl(`RestaurantDetail?slug=${slug}`)}>
      <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100">
        {/* Image */}
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <img
            src={cover_image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80`}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Price Badge */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-white/90 backdrop-blur-sm text-stone-800 font-semibold px-3 py-1">
              {price_range}
            </Badge>
          </div>

          {/* Rating Badge */}
          {average_rating > 0 && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-stone-800">
                {average_rating?.toFixed(1)}
              </span>
            </div>
          )}

          {/* Cuisine Tag */}
          <div className="absolute bottom-4 left-4">
            <span className="text-white/90 text-sm font-medium flex items-center gap-1.5">
              <span className="text-lg">{cuisineEmoji[cuisine] || '🍽️'}</span>
              <span className="capitalize">{cuisine?.replace('_', ' ')}</span>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-display font-semibold text-lg text-stone-900 group-hover:text-amber-700 transition-colors mb-2">
            {name}
          </h3>
          
          <div className="flex items-center gap-1.5 text-stone-500 text-sm mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{city}</span>
            {total_reviews > 0 && (
              <>
                <span className="mx-1">·</span>
                <span>{total_reviews} reviews</span>
              </>
            )}
          </div>

          {/* Features */}
          {features && features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {features.slice(0, 3).map((feature, idx) => (
                <span 
                  key={idx}
                  className="text-xs text-stone-500 bg-stone-100 rounded-full px-2.5 py-1"
                >
                  {feature}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}