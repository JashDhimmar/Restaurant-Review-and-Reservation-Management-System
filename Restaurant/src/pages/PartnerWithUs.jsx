import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import RestaurantService from '@/services/RestaurantService';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
    Loader2,
    CheckCircle,
    Plus,
    X,
    ChevronLeft,
    User,
    Utensils,
    Image as ImageIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

const cuisineOptions = [
    { value: 'Italian', label: 'Italian' },
    { value: 'Japanese', label: 'Japanese' },
    { value: 'Mexican', label: 'Mexican' },
    { value: 'Indian', label: 'Indian' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'French', label: 'French' },
    { value: 'American', label: 'American' },
    { value: 'Mediterranean', label: 'Mediterranean' },
    { value: 'Thai', label: 'Thai' },
    { value: 'Korean', label: 'Korean' },
    { value: 'Other', label: 'Other' },
];

const priceRangeOptions = [
    { value: '$', label: '$ - Budget Friendly' },
    { value: '$$', label: '$$ - Moderate' },
    { value: '$$$', label: '$$$ - Upscale' },
    { value: '$$$$', label: '$$$$ - Fine Dining' },
];

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function PartnerWithUs() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState("account");
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        // Account
        email: '',
        password: '',
        full_name: '',
        phone: '',

        // Restaurant
        restaurant_name: '',
        description: '',
        cuisine: '',
        price_range: '',
        address: '',
        city: '',
        restaurant_phone: '',
        website: '',
        table_capacity: 0,
        cover_image: null,
        cover_image_url: '',
        opening_hours: {},
        features: [],
        gallery: []
    });

    const [newFeature, setNewFeature] = useState('');

    const partnerMutation = useMutation({
        mutationFn: (data) => RestaurantService.partnerWithUs(data),
        onSuccess: () => {
            setSubmitSuccess(true);
            setTimeout(() => navigate('/Login'), 5000);
        },
    });

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Prepare data for submission
            const submissionData = { ...formData };

            // JSON fields must be stringified for multipart/form-data
            submissionData.opening_hours = JSON.stringify(formData.opening_hours);
            submissionData.features = JSON.stringify(formData.features);

            // Clean cover_image_url if it's a blob URL (local preview)
            if (formData.cover_image_url && formData.cover_image_url.startsWith('blob:')) {
                submissionData.cover_image_url = '';
            }

            // Filter out blob URLs from gallery if any (though they should be File objects)
            if (Array.isArray(formData.gallery)) {
                submissionData.gallery = formData.gallery.filter(item =>
                    !(typeof item === 'string' && item.startsWith('blob:'))
                );
            }

            await partnerMutation.mutateAsync(submissionData);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpeningHoursChange = (day, value) => {
        setFormData(prev => ({
            ...prev,
            opening_hours: { ...prev.opening_hours, [day]: value }
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                cover_image: file,
                cover_image_url: URL.createObjectURL(file)
            }));
        }
    };

    const handleGalleryFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setFormData(prev => ({
                ...prev,
                gallery: [...prev.gallery, ...files]
            }));
        }
    };

    const removeGalleryImage = (index) => {
        setFormData(prev => ({
            ...prev,
            gallery: prev.gallery.filter((_, i) => i !== index)
        }));
    };

    if (submitSuccess) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-stone-100"
                >
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-stone-900 mb-4">Application Submitted!</h2>
                    <p className="text-stone-600 mb-8">
                        Thank you for partnering with us. Our team will review your application and notify you via email once verified.
                    </p>
                    <p className="text-sm text-stone-400 mb-8">Redirecting to login in 5 seconds...</p>
                    <Link to="/Login">
                        <Button className="w-full bg-amber-500 hover:bg-amber-600 rounded-xl h-12">
                            Go to Login
                        </Button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 pb-20">
            {/* Header */}
            <div className="bg-stone-50">
                {/* Centered Logo + Title */}
                <div className="text-center py-10 pb-4">
                    <div className="flex justify-center mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg">
                            <Building2 className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-stone-900">Partner With Us</h1>
                    <p className="mt-2 text-sm text-stone-500">Register your restaurant and grow your business with TableTaste</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start mb-8 bg-stone-100 rounded-2xl p-1.5 h-auto overflow-x-auto scrollbar-hide">
                        <TabsTrigger value="account" className="rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <User className="w-4 h-4 mr-2" />
                            Account
                        </TabsTrigger>
                        <TabsTrigger value="basic" className="rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Utensils className="w-4 h-4 mr-2" />
                            Basic Info
                        </TabsTrigger>
                        <TabsTrigger value="images" className="rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Images
                        </TabsTrigger>
                        <TabsTrigger value="hours" className="rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Hours</TabsTrigger>
                        <TabsTrigger value="features" className="rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Features</TabsTrigger>
                    </TabsList>

                    {/* Account Tab */}
                    <TabsContent value="account">
                        <Card className="rounded-3xl border-stone-200 overflow-hidden shadow-sm">
                            <CardHeader className="bg-stone-50/50 border-b border-stone-100">
                                <CardTitle className="text-xl">Owner Information</CardTitle>
                                <CardDescription>Your personal account details</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="sm:col-span-2">
                                        <Label htmlFor="full_name">Full Name</Label>
                                        <Input
                                            id="full_name"
                                            placeholder="Enter your full name"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                            className="h-12 mt-2 rounded-xl border-stone-200 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Email for your account"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="h-12 mt-2 rounded-xl border-stone-200"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Minimum 8 characters"
                                            value={formData.password}
                                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                            className="h-12 mt-2 rounded-xl border-stone-200"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            placeholder="Personal contact number"
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="h-12 mt-2 rounded-xl border-stone-200"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <Button onClick={() => setActiveTab("basic")} variant="secondary" className="rounded-xl px-8 h-12">
                                        Next
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Restaurant Basic Tab */}
                    <TabsContent value="basic">
                        <Card className="rounded-3xl border-stone-200 overflow-hidden shadow-sm">
                            <CardHeader className="bg-stone-50/50 border-b border-stone-100">
                                <CardTitle className="text-xl">Restaurant Profile</CardTitle>
                                <CardDescription>What customers will see first</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="sm:col-span-2">
                                        <Label htmlFor="rname">Restaurant Name</Label>
                                        <Input
                                            id="rname"
                                            placeholder="Publicly visible name"
                                            value={formData.restaurant_name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, restaurant_name: e.target.value }))}
                                            className="h-12 mt-2 rounded-xl"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <Label htmlFor="description">Short Description</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            className="mt-2 min-h-24 rounded-xl"
                                            placeholder="Tell customers about your kitchen..."
                                        />
                                    </div>

                                    <div>
                                        <Label>Cuisine Type</Label>
                                        <Select
                                            value={formData.cuisine}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, cuisine: value }))}
                                        >
                                            <SelectTrigger className="h-12 mt-2 rounded-xl">
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
                                        <Label>Price Range</Label>
                                        <Select
                                            value={formData.price_range}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, price_range: value }))}
                                        >
                                            <SelectTrigger className="h-12 mt-2 rounded-xl">
                                                <SelectValue placeholder="Select price range" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
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
                                            className="h-12 mt-2 rounded-xl"
                                            placeholder="Full street address"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                            className="h-12 mt-2 rounded-xl"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="capacity">Seating Capacity</Label>
                                        <Input
                                            id="capacity"
                                            type="number"
                                            value={formData.table_capacity}
                                            onChange={(e) => setFormData(prev => ({ ...prev, table_capacity: parseInt(e.target.value) || 0 }))}
                                            className="h-12 mt-2 rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-between">
                                    <Button onClick={() => setActiveTab("account")} variant="secondary" className="rounded-xl px-8 h-12">
                                        Back
                                    </Button>
                                    <Button onClick={() => setActiveTab("images")} variant="secondary" className="rounded-xl px-8 h-12">
                                        Next
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Images Tab */}
                    <TabsContent value="images">
                        <Card className="rounded-3xl border-stone-200 overflow-hidden shadow-sm">
                            <CardHeader className="bg-stone-50/50 border-b border-stone-100">
                                <CardTitle className="text-xl text-stone-900">Images</CardTitle>
                                <CardDescription>Showcase your restaurant with photos</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div>
                                    <Label className="text-base font-semibold text-stone-900 mb-4 block">Cover Image</Label>
                                    <input
                                        type="file"
                                        id="cover-image-file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    <div
                                        className="relative aspect-[21/9] w-full rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 hover:bg-stone-100/50 transition-colors flex items-center justify-center cursor-pointer group"
                                        onClick={() => document.getElementById('cover-image-file')?.click()}
                                    >
                                        {formData.cover_image_url ? (
                                            <img
                                                src={formData.cover_image_url}
                                                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                                                alt="Cover preview"
                                            />
                                        ) : (
                                            <div className="text-center group-hover:scale-105 transition-transform duration-200">
                                                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
                                                    <ImageIcon className="w-6 h-6 text-stone-400" />
                                                </div>
                                                <p className="text-sm font-medium text-stone-600">Click to upload cover image</p>
                                                <p className="text-xs text-stone-400 mt-1">Recommended size: 1200x500px</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <Label htmlFor="cover-image-input" className="text-xs text-stone-500 uppercase tracking-wider mb-2 block">Or paste image URL</Label>
                                        <Input
                                            id="cover-image-input"
                                            placeholder="https://images.unsplash.com/..."
                                            value={formData.cover_image_url}
                                            onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value, cover_image: null }))}
                                            className="h-10 rounded-xl border-stone-200 text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-base font-semibold text-stone-900 mb-4 block">Gallery</Label>
                                    <input
                                        type="file"
                                        id="gallery-file-input"
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                        onChange={handleGalleryFileChange}
                                    />
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {formData.gallery.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group">
                                                <img
                                                    src={img instanceof File ? URL.createObjectURL(img) : img}
                                                    alt={`Gallery ${idx}`}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeGalleryImage(idx);
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-stone-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <div
                                            className="aspect-square rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 flex items-center justify-center cursor-pointer hover:bg-stone-100/50 transition-colors"
                                            onClick={() => document.getElementById('gallery-file-input')?.click()}
                                        >
                                            <div className="text-center">
                                                <Plus className="w-6 h-6 text-stone-300 mx-auto mb-1" />
                                                <span className="text-xs font-medium text-stone-400">Add Photo</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-between">
                                    <Button onClick={() => setActiveTab("basic")} variant="secondary" className="rounded-xl px-8 h-12">
                                        Back
                                    </Button>
                                    <Button onClick={() => setActiveTab("hours")} variant="secondary" className="rounded-xl px-8 h-12">
                                        Next
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Hours & Contact */}
                    <TabsContent value="hours">
                        <Card className="rounded-3xl border-stone-200 overflow-hidden shadow-sm">
                            <CardHeader className="bg-stone-50/50 border-b border-stone-100">
                                <CardTitle className="text-xl">Operating Hours & Contact</CardTitle>
                                <CardDescription>When you're open and how customers can reach you</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div>
                                    <h3 className="font-semibold text-stone-900 mb-4 block">Operating Hours</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {daysOfWeek.map((day) => (
                                            <div key={day} className="flex items-center gap-4">
                                                <span className="w-24 capitalize text-stone-600 text-sm font-medium">{day}</span>
                                                <Input
                                                    value={formData.opening_hours[day] || ''}
                                                    onChange={(e) => handleOpeningHoursChange(day, e.target.value)}
                                                    placeholder="11:00 AM - 10:00 PM"
                                                    className="flex-1 h-10 rounded-lg text-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-stone-100">
                                    <h3 className="font-semibold text-stone-900 mb-4 block">Public Contact Information</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <Label htmlFor="rphone">Business Phone</Label>
                                            <Input
                                                id="rphone"
                                                value={formData.restaurant_phone}
                                                onChange={(e) => setFormData(prev => ({ ...prev, restaurant_phone: e.target.value }))}
                                                className="h-12 mt-2 rounded-xl"
                                                placeholder="Visible to customers"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="website">Website URL (Optional)</Label>
                                            <Input
                                                id="website"
                                                value={formData.website}
                                                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                                className="h-12 mt-2 rounded-xl"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-between">
                                    <Button onClick={() => setActiveTab("images")} variant="secondary" className="rounded-xl px-8 h-12">
                                        Back
                                    </Button>
                                    <Button onClick={() => setActiveTab("features")} variant="secondary" className="rounded-xl px-8 h-12">
                                        Next
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Features Tab */}
                    <TabsContent value="features">
                        <Card className="rounded-3xl border-stone-200 overflow-hidden shadow-sm">
                            <CardHeader className="bg-stone-50/50 border-b border-stone-100">
                                <CardTitle className="text-xl">Features & Amenities</CardTitle>
                                <CardDescription>Highlight what makes you special</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="flex gap-2 mb-8">
                                    <Input
                                        value={newFeature}
                                        onChange={(e) => setNewFeature(e.target.value)}
                                        placeholder="Add features (e.g., Outdoor Seating, WiFi, Live Music)"
                                        onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                                        className="h-12 rounded-xl"
                                    />
                                    <Button onClick={addFeature} variant="secondary" className="h-12 w-12 rounded-xl">
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {formData.features.map((feature, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-3 bg-amber-50 text-amber-900 border border-amber-100 rounded-full px-5 py-2.5 text-sm font-medium shadow-sm"
                                        >
                                            {feature}
                                            <button
                                                onClick={() => removeFeature(feature)}
                                                className="text-amber-400 hover:text-amber-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </span>
                                    ))}
                                    {formData.features.length === 0 && (
                                        <div className="text-center py-12 w-full">
                                            <Building2 className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                                            <p className="text-stone-400">No features added yet</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-12 bg-stone-50 -mx-8 -mb-8 p-8 border-t border-stone-100">
                                    <div className="flex items-start space-x-3 mb-8">
                                        <Checkbox
                                            id="terms"
                                            checked={agreeToTerms}
                                            onCheckedChange={(checked) => setAgreeToTerms(checked)}
                                            className="mt-0.5 border-stone-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 rounded text-white"
                                        />
                                        <label
                                            htmlFor="terms"
                                            className="text-stone-500 text-sm leading-snug cursor-pointer select-none"
                                        >
                                            By submitting, you agree to TableTaste's partner terms and conditions.
                                        </label>
                                    </div>
                                    <div className="flex justify-between items-center w-full">
                                        <Button onClick={() => setActiveTab("hours")} variant="secondary" className="rounded-xl px-8 h-12">
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || !agreeToTerms}
                                            className="bg-amber-500 hover:bg-amber-600 rounded-xl px-12 h-12 text-lg font-semibold shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                                        >
                                            {isSubmitting ? 'Processing...' : 'Finish & Submit'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
