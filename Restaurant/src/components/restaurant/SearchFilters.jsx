import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const cuisines = [
  { value: 'all', label: 'All Cuisines' },
  { value: 'italian', label: '🍝 Italian' },
  { value: 'japanese', label: '🍣 Japanese' },
  { value: 'mexican', label: '🌮 Mexican' },
  { value: 'indian', label: '🍛 Indian' },
  { value: 'chinese', label: '🥢 Chinese' },
  { value: 'french', label: '🥐 French' },
  { value: 'american', label: '🍔 American' },
  { value: 'mediterranean', label: '🫒 Mediterranean' },
  { value: 'thai', label: '🍜 Thai' },
  { value: 'korean', label: '🥘 Korean' },
];

const priceRanges = [
  { value: 'all', label: 'Any Price' },
  { value: '$', label: '$ - Budget' },
  { value: '$$', label: '$$ - Moderate' },
  { value: '$$$', label: '$$$ - Upscale' },
  { value: '$$$$', label: '$$$$ - Fine Dining' },
];

const ratings = [
  { value: 'all', label: 'Any Rating' },
  { value: '4.5', label: '4.5+ ⭐' },
  { value: '4', label: '4+ ⭐' },
  { value: '3.5', label: '3.5+ ⭐' },
];

export default function SearchFilters({ filters, onFilterChange, onSearch }) {
  const activeFiltersCount = [
    filters.cuisine !== 'all' && filters.cuisine,
    filters.price_range !== 'all' && filters.price_range,
    filters.rating !== 'all' && filters.rating,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFilterChange({
      search: '',
      cuisine: 'all',
      price_range: 'all',
      rating: 'all'
    });
  };

  const FilterControls = () => (
    <div className="space-y-6">
      {/* Cuisine */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">Cuisine Type</label>
        <Select 
          value={filters.cuisine} 
          onValueChange={(value) => onFilterChange({ ...filters, cuisine: value })}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Select cuisine" />
          </SelectTrigger>
          <SelectContent>
            {cuisines.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">Price Range</label>
        <Select 
          value={filters.price_range} 
          onValueChange={(value) => onFilterChange({ ...filters, price_range: value })}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Select price" />
          </SelectTrigger>
          <SelectContent>
            {priceRanges.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">Minimum Rating</label>
        <Select 
          value={filters.rating} 
          onValueChange={(value) => onFilterChange({ ...filters, rating: value })}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Select rating" />
          </SelectTrigger>
          <SelectContent>
            {ratings.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFiltersCount > 0 && (
        <Button 
          variant="ghost" 
          onClick={clearFilters}
          className="w-full text-stone-500 hover:text-stone-700"
        >
          <X className="w-4 h-4 mr-2" />
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <Input
            type="text"
            placeholder="Search restaurants, cuisines, or locations..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-12 h-12 bg-white border-stone-200 rounded-xl text-base focus-visible:ring-amber-500"
          />
        </div>
        
        {/* Mobile Filter Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-12 w-12 md:hidden rounded-xl border-stone-200 relative"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
            <SheetHeader className="mb-6">
              <SheetTitle className="font-display">Filter Restaurants</SheetTitle>
            </SheetHeader>
            <FilterControls />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:flex items-center gap-3">
        <Select 
          value={filters.cuisine} 
          onValueChange={(value) => onFilterChange({ ...filters, cuisine: value })}
        >
          <SelectTrigger className="w-44 bg-white border-stone-200 rounded-xl">
            <SelectValue placeholder="Cuisine" />
          </SelectTrigger>
          <SelectContent>
            {cuisines.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.price_range} 
          onValueChange={(value) => onFilterChange({ ...filters, price_range: value })}
        >
          <SelectTrigger className="w-40 bg-white border-stone-200 rounded-xl">
            <SelectValue placeholder="Price" />
          </SelectTrigger>
          <SelectContent>
            {priceRanges.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.rating} 
          onValueChange={(value) => onFilterChange({ ...filters, rating: value })}
        >
          <SelectTrigger className="w-36 bg-white border-stone-200 rounded-xl">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            {ratings.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearFilters}
            className="text-stone-500 hover:text-stone-700"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}