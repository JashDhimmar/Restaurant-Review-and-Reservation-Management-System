import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Home, ChefHat, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-8">
          <ChefHat className="w-12 h-12 text-stone-400" />
        </div>
        
        <h1 className="font-display text-6xl font-bold text-stone-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-stone-700 mb-4">Page Not Found</h2>
        <p className="text-stone-500 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={createPageUrl('Home')}>
            <Button className="bg-amber-500 hover:bg-amber-600 gap-2 w-full sm:w-auto">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Search className="w-4 h-4" />
              Find Restaurants
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}