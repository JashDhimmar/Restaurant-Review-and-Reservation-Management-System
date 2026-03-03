import React from 'react';
import { Star, ThumbsUp, MessageCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ReviewCard({ review }) {
  const {
    reviewer_name,
    overall_rating,
    food_rating,
    service_rating,
    ambiance_rating,
    value_rating,
    review_text,
    sentiment,
    keywords,
    is_verified,
    owner_response,
    created_date
  } = review;

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'fill-amber-400 text-amber-400' 
                : 'text-stone-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const sentimentColors = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    neutral: 'bg-stone-50 text-stone-600 border-stone-200',
    negative: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            <span className="text-amber-700 font-semibold text-lg">
              {reviewer_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-stone-900">{reviewer_name || 'Anonymous'}</h4>
              {is_verified && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500">
              {created_date ? format(new Date(created_date), 'MMM d, yyyy') : 'Recently'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {renderStars(overall_rating)}
          <span className="font-semibold text-stone-900">{overall_rating}</span>
        </div>
      </div>

      {/* Review Text */}
      <p className="text-stone-600 leading-relaxed mb-4">{review_text}</p>

      {/* Aspect Ratings */}
      {(food_rating || service_rating || ambiance_rating || value_rating) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 p-4 bg-stone-50 rounded-xl">
          {food_rating > 0 && (
            <div className="text-center">
              <p className="text-xs text-stone-500 mb-1">Food</p>
              <div className="flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-stone-700">{food_rating}</span>
              </div>
            </div>
          )}
          {service_rating > 0 && (
            <div className="text-center">
              <p className="text-xs text-stone-500 mb-1">Service</p>
              <div className="flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-stone-700">{service_rating}</span>
              </div>
            </div>
          )}
          {ambiance_rating > 0 && (
            <div className="text-center">
              <p className="text-xs text-stone-500 mb-1">Ambiance</p>
              <div className="flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-stone-700">{ambiance_rating}</span>
              </div>
            </div>
          )}
          {value_rating > 0 && (
            <div className="text-center">
              <p className="text-xs text-stone-500 mb-1">Value</p>
              <div className="flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-stone-700">{value_rating}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keywords */}
      {keywords && keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {keywords.map((keyword, idx) => (
            <span 
              key={idx}
              className="text-xs bg-amber-50 text-amber-700 rounded-full px-3 py-1"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      {/* Sentiment Badge */}
      {sentiment && (
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs font-medium px-3 py-1 rounded-full border ${sentimentColors[sentiment]}`}>
            {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} Experience
          </span>
        </div>
      )}

      {/* Owner Response */}
      {owner_response && (
        <div className="mt-4 pl-4 border-l-2 border-amber-300 bg-amber-50/50 rounded-r-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Owner Response</span>
          </div>
          <p className="text-sm text-stone-600">{owner_response}</p>
        </div>
      )}
    </div>
  );
}