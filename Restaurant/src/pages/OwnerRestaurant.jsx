import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Globe,
  Clock,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  Plus,
  X,
  ChevronLeft
} from 'lucide-react';
import { motion } from 'framer-motion';

const cuisineOptions = [
  { value: 'italian', label: 'Italian' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'indian', label: 'Indian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'french', label: 'French' },
  { value: 'american', label: 'American' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'thai', label: 'Thai' },
  { value: 'korean', label: 'Korean' },
  { value: 'other', label: 'Other' },
];

const priceRangeOptions = [
  { value: '$', label: '$ - Budget Friendly' },
  { value: '$$', label: '$$ - Moderate' },
  { value: '$$$', label: '$$$ - Upscale' },
  { value: '$$$$', label: '$$$$ - Fine Dining' },
];

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function OwnerRestaurant() {
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cuisine: '',
    price_range: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    cover_image: '',
    gallery: [],
    opening_hours: {},
    features: [],
    table_capacity: 0
  });

  const [newFeature, setNewFeature] = useState('');

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

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['owner-restaurants', user?.email],
    queryFn: () => base44.entities.Restaurant.filter({ owner_email: user.email }),
    enabled: !!user?.email,
  });

  const restaurant = restaurants[0];

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        cuisine: restaurant.cuisine || '',
        price_range: restaurant.price_range || '',
        address: restaurant.address || '',
        city: restaurant.city || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        website: restaurant.website || '',
        cover_image: restaurant.cover_image || '',
        gallery: restaurant.gallery || [],
        opening_hours: restaurant.opening_hours || {},
        features: restaurant.features || [],
        table_capacity: restaurant.table_capacity || 0
      });
    }
  }, [restaurant]);

  const updateRestaurant = useMutation({
    mutationFn: (data) => base44.entities.Restaurant.update(restaurant.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-restaurants'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    await updateRestaurant.mutateAsync(formData);
    setIsSaving(false);
  };

  const handleOpeningHoursChange = (day, value) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: value
      }
    }));
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    
    if (type === 'cover') {
      setFormData(prev => ({ ...prev, cover_image: file_url }));
    } else {
      setFormData(prev => ({ ...prev, gallery: [...prev.gallery, file_url] }));
    }
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">No Restaurant Found</h2>
          <Link to={createPageUrl('OwnerDashboard')}>
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            to={createPageUrl('OwnerDashboard')}
            className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-stone-900">
                Edit Restaurant
              </h1>
              <p className="text-stone-500">Update your restaurant information</p>
            </div>
            <div className="flex items-center gap-3">
              {saveSuccess && (
                <motion.span 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1 text-emerald-600 text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Saved!
                </motion.span>
              )}
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full justify-start mb-8 bg-stone-100 rounded-xl p-1.5 h-auto overflow-x-auto">
            <TabsTrigger value="basic" className="rounded-lg py-3 px-6">Basic Info</TabsTrigger>
            <TabsTrigger value="images" className="rounded-lg py-3 px-6">Images</TabsTrigger>
            <TabsTrigger value="hours" className="rounded-lg py-3 px-6">Hours</TabsTrigger>
            <TabsTrigger value="features" className="rounded-lg py-3 px-6">Features</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card className="rounded-2xl border-stone-200">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your restaurant's essential details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name">Restaurant Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="h-12 mt-2"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-2 min-h-24"
                      placeholder="Tell customers about your restaurant..."
                    />
                  </div>

                  <div>
                    <Label>Cuisine Type</Label>
                    <Select 
                      value={formData.cuisine} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, cuisine: value }))}
                    >
                      <SelectTrigger className="h-12 mt-2">
                        <SelectValue placeholder="Select cuisine" />
                      </SelectTrigger>
                      <SelectContent>
                        {cuisineOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Price Range</Label>
                    <Select 
                      value={formData.price_range} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, price_range: value }))}
                    >
                      <SelectTrigger className="h-12 mt-2">
                        <SelectValue placeholder="Select price range" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceRangeOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="h-12 mt-2"
                      placeholder="Street address"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="h-12 mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="h-12 mt-2"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="h-12 mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="h-12 mt-2"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="capacity">Table Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.table_capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, table_capacity: parseInt(e.target.value) || 0 }))}
                      className="h-12 mt-2"
                      placeholder="Total seating capacity"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images">
            <Card className="rounded-2xl border-stone-200">
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>Showcase your restaurant with photos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cover Image */}
                <div>
                  <Label>Cover Image</Label>
                  <div className="mt-2">
                    {formData.cover_image ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden">
                        <img 
                          src={formData.cover_image} 
                          alt="Cover" 
                          className="w-full h-full object-cover"
                        />
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute top-2 right-2"
                          onClick={() => setFormData(prev => ({ ...prev, cover_image: '' }))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors">
                        <ImageIcon className="w-8 h-8 text-stone-400 mb-2" />
                        <span className="text-sm text-stone-500">Click to upload cover image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'cover')}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Gallery */}
                <div>
                  <Label>Gallery</Label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {formData.gallery.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden">
                        <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => removeGalleryImage(idx)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors">
                      <Plus className="w-6 h-6 text-stone-400 mb-1" />
                      <span className="text-xs text-stone-500">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'gallery')}
                      />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours">
            <Card className="rounded-2xl border-stone-200">
              <CardHeader>
                <CardTitle>Opening Hours</CardTitle>
                <CardDescription>Set your restaurant's operating hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="flex items-center gap-4">
                      <span className="w-28 capitalize text-stone-700">{day}</span>
                      <Input
                        value={formData.opening_hours[day] || ''}
                        onChange={(e) => handleOpeningHoursChange(day, e.target.value)}
                        placeholder="e.g., 11:00 AM - 10:00 PM"
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card className="rounded-2xl border-stone-200">
              <CardHeader>
                <CardTitle>Features & Amenities</CardTitle>
                <CardDescription>Highlight what makes your restaurant special</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature (e.g., Outdoor Seating, WiFi)"
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  />
                  <Button onClick={addFeature} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-2 bg-stone-100 text-stone-700 rounded-full px-4 py-2"
                    >
                      {feature}
                      <button 
                        onClick={() => removeFeature(feature)}
                        className="text-stone-400 hover:text-stone-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                  {formData.features.length === 0 && (
                    <p className="text-stone-500 text-sm">No features added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}