import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/services/api';
import OwnerSidebar from '@/components/owner/OwnerSidebar';
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
  ChevronLeft,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";

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
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();

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
    cover_image_file: null,
    gallery: [],
    opening_hours: {},
    features: [],
    table_capacity: 0
  });

  const [newFeature, setNewFeature] = useState('');

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

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['owner-restaurants', user?.email],
    queryFn: () => mockApi.entities.Restaurant.filter({ owner_email: user.email }),
    enabled: !!user?.email,
  });

  const restaurant = restaurants[0];

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        cuisine: restaurant.cuisine ? restaurant.cuisine.toLowerCase() : '',
        price_range: restaurant.price_range || '',
        address: restaurant.address || '',
        city: restaurant.city || '',
        phone: restaurant.phone || '',
        email: restaurant.owner_email || '',
        website: restaurant.website || '',
        cover_image: restaurant.cover_image_source || '',
        cover_image_file: null,
        gallery: restaurant.gallery ? restaurant.gallery.map(img => img.image_source) : [],
        opening_hours: restaurant.opening_hours || {},
        features: restaurant.features || [],
        table_capacity: restaurant.table_capacity || 0
      });
    }
  }, [restaurant]);

  const updateRestaurant = useMutation({
    mutationFn: (data) => mockApi.entities.Restaurant.update(restaurant.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-restaurants'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Strictly only send fields the backend expects in RestaurantWriteSerializer
      const dataToSend = {
        name: formData.name,
        cuisine: formData.cuisine,
        description: formData.description,
        city: formData.city,
        address: formData.address,
        price_range: formData.price_range,
        phone: formData.phone,
        website: formData.website,
        table_capacity: formData.table_capacity,
        opening_hours: formData.opening_hours,
        features: formData.features,
        gallery: formData.gallery.filter(item => {
          if (item instanceof File) return true;
          if (typeof item === 'string') return !item.startsWith('blob:');
          return true;
        }),
      };

      // Handle Image logic
      if (formData.cover_image_file) {
        dataToSend.cover_image = formData.cover_image_file;
      } else if (typeof formData.cover_image === 'string' && !formData.cover_image.startsWith('blob:')) {
        dataToSend.cover_image_url = formData.cover_image;
      }

      await updateRestaurant.mutateAsync(dataToSend);
      toast({
        title: "Success",
        description: "Restaurant details updated successfully.",
      });
    } catch (error) {
      console.error("Save error:", error);

      // More descriptive error parsing
      let errorMsg = "Failed to save changes. Please check your connection.";
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          errorMsg = Object.entries(errors)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join(' | ');
        } else if (typeof errors === 'string') {
          errorMsg = errors;
        }
      }

      toast({
        title: "Error Saving Changes",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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

    const file_url = URL.createObjectURL(file);

    if (type === 'cover') {
      setFormData(prev => ({
        ...prev,
        cover_image: file_url,
        cover_image_file: file
      }));
    } else {
      setFormData(prev => ({ ...prev, gallery: [...prev.gallery, file] }));
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
    <div className="flex min-h-screen bg-stone-50">
      <OwnerSidebar activePage="settings" />

      <div className="flex-1 min-w-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-stone-900">Restaurant Settings</h1>
              <p className="text-stone-500 mt-1">Manage your restaurant's profile, photos, and availability</p>
            </div>
            <div className="flex items-center gap-3">
              {saveSuccess && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-2 text-emerald-600 text-xs font-bold border border-emerald-100 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  CHANGES SAVED
                </motion.span>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-stone-200 transition-all active:scale-95"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Inner Sidebar / Tabs */}
            <div className="w-full lg:w-[300px] bg-white rounded-2xl shadow-sm border border-stone-200 flex flex-col shrink-0 overflow-hidden sticky top-8">
              <div className="p-8 flex flex-col items-center border-b border-stone-100 text-center bg-stone-50/50">
                <div className="relative mb-4 group cursor-pointer" onClick={() => setActiveTab('images')}>
                  <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center border-2 border-stone-200 shadow-sm overflow-hidden group-hover:border-amber-400 transition-colors">
                    {formData.cover_image ? (
                      <img src={formData.cover_image} alt="Restaurant" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-10 h-10 text-stone-300" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white border-2 border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                </div>
                <h2 className="font-bold text-stone-900 line-clamp-1">{formData.name || 'Your Restaurant'}</h2>
                <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-widest font-bold">{formData.cuisine || 'Cuisine Type'}</p>
              </div>

              <nav className="p-3 space-y-1">
                {[
                  { id: 'basic', label: 'Basic Profile', icon: Building2 },
                  { id: 'images', label: 'Visual Gallery', icon: ImageIcon },
                  { id: 'hours', label: 'Opening Hours', icon: Clock },
                  { id: 'features', label: 'Restaurant Features', icon: CheckCircle },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-4 w-full px-5 py-3.5 rounded-xl text-sm font-bold transition-all ${
                      activeTab === tab.id
                        ? 'bg-amber-50 text-amber-900 border-l-4 border-amber-500'
                        : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-amber-500' : 'text-stone-400'}`} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 w-full">
              <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden relative min-h-[600px]">
                <div className="p-8 sm:p-10">
                  {/* Basic Info Tab */}
                  {activeTab === 'basic' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                      <section>
                        <div className="flex items-center gap-2 mb-8">
                          <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                          <h3 className="text-lg font-bold text-stone-900">General Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="md:col-span-2">
                            <Label className="text-xs font-bold text-stone-400 tracking-widest uppercase mb-2 block ml-1">Restaurant Name</Label>
                            <Input
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              className="h-12 rounded-xl border-stone-200 focus:border-amber-500 focus:ring-amber-500 bg-stone-50/30"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs font-bold text-stone-400 tracking-widest uppercase mb-2 block ml-1">Short Bio / Description</Label>
                            <Textarea
                              value={formData.description}
                              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                              className="rounded-xl border-stone-200 focus:border-amber-500 focus:ring-amber-500 bg-stone-50/30 min-h-[120px]"
                              placeholder="Describe your restaurant's unique experience..."
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-bold text-stone-400 tracking-widest uppercase mb-2 block ml-1">Cuisine Type</Label>
                            <Select
                              value={formData.cuisine}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, cuisine: value }))}
                            >
                              <SelectTrigger className="h-12 border-stone-200 rounded-xl bg-stone-50/30">
                                <SelectValue placeholder="Select cuisine" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {cuisineOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs font-bold text-stone-400 tracking-widest uppercase mb-2 block ml-1">Pricing Tier</Label>
                            <Select
                              value={formData.price_range}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, price_range: value }))}
                            >
                              <SelectTrigger className="h-12 border-stone-200 rounded-xl bg-stone-50/30">
                                <SelectValue placeholder="Select price range" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {priceRangeOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </section>

                      <section>
                        <div className="flex items-center gap-2 mb-8">
                          <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                          <h3 className="text-lg font-bold text-stone-900">Communication & Address</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="md:col-span-2">
                            <Label className="text-xs font-bold text-stone-400 tracking-widest uppercase mb-2 block ml-1">Physical Address</Label>
                            <Input
                              value={formData.address}
                              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                              className="h-12 border-stone-200 rounded-xl bg-stone-50/30"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-bold text-stone-400 tracking-widest uppercase mb-2 block ml-1">Locality / City</Label>
                            <Input
                              value={formData.city}
                              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                              className="h-12 border-stone-200 rounded-xl bg-stone-50/30"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-bold text-stone-400 tracking-widest uppercase mb-2 block ml-1">Public Contact Number</Label>
                            <Input
                              value={formData.phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                              className="h-12 border-stone-200 rounded-xl bg-stone-50/30"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-bold text-stone-400 tracking-widest uppercase mb-2 block ml-1">Official Website (Optional)</Label>
                            <Input
                              value={formData.website}
                              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                              className="h-12 border-stone-200 rounded-xl bg-stone-50/30"
                              placeholder="https://..."
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-bold text-stone-400 tracking-widest uppercase mb-2 block ml-1">Max Seating Capacity</Label>
                            <Input
                              type="number"
                              value={formData.table_capacity}
                              onChange={(e) => setFormData(prev => ({ ...prev, table_capacity: parseInt(e.target.value) || 0 }))}
                              className="h-12 border-stone-200 rounded-xl bg-stone-50/30"
                            />
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Images Tab */}
                  {activeTab === 'images' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                      <section>
                        <div className="flex items-center gap-2 mb-8">
                          <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                          <h3 className="text-lg font-bold text-stone-900">Brand Representation</h3>
                        </div>
                        <div className="space-y-10">
                          <div>
                            <Label className="text-xs font-bold text-stone-400 tracking-widest uppercase mb-4 block ml-1">Primary Cover Photo</Label>
                            {formData.cover_image ? (
                              <div className="relative aspect-video rounded-3xl overflow-hidden border border-stone-200 group shadow-sm">
                                <img src={formData.cover_image} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="rounded-xl font-bold gap-2"
                                    onClick={() => setFormData(prev => ({ ...prev, cover_image: '' }))}
                                  >
                                    <X className="w-4 h-4" />
                                    Change Photo
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-stone-200 rounded-3xl cursor-pointer hover:bg-stone-50/50 transition-all group bg-stone-50/20">
                                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4 border border-stone-100 shadow-sm group-hover:scale-110 transition-transform">
                                  <ImageIcon className="w-7 h-7 text-stone-300 group-hover:text-amber-500 transition-colors" />
                                </div>
                                <span className="text-sm font-bold text-stone-600">Click to upload cover image</span>
                                <p className="text-xs text-stone-400 mt-1">Recommended: 1200x800px or larger</p>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} />
                              </label>
                            )}
                          </div>

                          <div>
                            <Label className="text-xs font-bold text-stone-400 tracking-widest uppercase mb-4 block ml-1">Restaurant Gallery</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                              {formData.gallery.map((img, idx) => {
                                const isFile = img instanceof File;
                                const src = isFile ? URL.createObjectURL(img) : img;
                                return (
                                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-stone-200 group shadow-sm">
                                    <img src={src} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <Button
                                      size="icon"
                                      variant="destructive"
                                      className="absolute top-2 right-2 h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                      onClick={() => removeGalleryImage(idx)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                              <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-stone-200 rounded-2xl cursor-pointer hover:bg-stone-50/50 transition-all group bg-stone-50/20">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-stone-100 shadow-sm group-hover:scale-110 transition-transform">
                                  <Plus className="w-6 h-6 text-stone-300 group-hover:text-amber-500 transition-colors" />
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'gallery')} />
                              </label>
                            </div>
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Hours Tab */}
                  {activeTab === 'hours' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                       <section>
                        <div className="flex items-center gap-2 mb-8">
                          <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                          <h3 className="text-lg font-bold text-stone-900">Weekly Schedule</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {daysOfWeek.map((day) => (
                            <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 border border-stone-100 rounded-2xl bg-stone-50/30 group hover:bg-stone-50 transition-colors">
                              <span className="w-28 capitalize font-bold text-stone-700 text-sm">{day}</span>
                              <div className="flex-1 flex items-center gap-4">
                                <Clock className="w-4 h-4 text-stone-300" />
                                <Input
                                  value={formData.opening_hours[day] || ''}
                                  onChange={(e) => handleOpeningHoursChange(day, e.target.value)}
                                  placeholder="Ex: 09:00 AM - 11:00 PM"
                                  className="flex-1 border-stone-200 rounded-xl h-11 focus:border-amber-500 focus:ring-amber-500 bg-white"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Features Tab */}
                  {activeTab === 'features' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                      <section>
                        <div className="flex items-center gap-2 mb-8">
                          <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                          <h3 className="text-lg font-bold text-stone-900">Amenities & Highlights</h3>
                        </div>
                        <div className="flex gap-3 mb-10">
                          <div className="relative flex-1">
                            <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <Input
                              value={newFeature}
                              onChange={(e) => setNewFeature(e.target.value)}
                              placeholder="Describe feature (e.g. Free Wi-Fi, Rooftop Seating)"
                              className="pl-11 h-12 border-stone-200 rounded-xl focus:border-amber-500 focus:ring-amber-500 bg-stone-50/30"
                              onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                            />
                          </div>
                          <Button onClick={addFeature} className="bg-stone-900 hover:bg-stone-800 text-white px-8 h-12 rounded-xl font-bold shadow-md transition-all active:scale-95">
                            Add Tag
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                          {formData.features.map((feature, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2.5 bg-white text-stone-700 border border-stone-200 rounded-xl px-5 py-3 text-sm font-bold shadow-sm hover:border-amber-300 hover:bg-amber-50/30 transition-all hover:-translate-y-0.5"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              {feature}
                              <button onClick={() => removeFeature(feature)} className="ml-1 text-stone-300 hover:text-red-500 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          {formData.features.length === 0 && (
                            <div className="w-full py-16 text-center bg-stone-50/50 rounded-2xl border-2 border-dashed border-stone-200">
                              <AlertCircle className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                              <p className="text-stone-400 font-medium">Highlight your best amenities to attract more diners!</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}