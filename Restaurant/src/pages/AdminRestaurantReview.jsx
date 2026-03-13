import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, CheckCircle, XCircle, Building2, MapPin,
    Globe, Phone, Star, Clock, Info, AlertCircle, Loader2
} from 'lucide-react';
import RestaurantService from '@/services/RestaurantService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

export default function AdminRestaurantReview() {
    const [searchParams] = useSearchParams();
    const restaurantId = searchParams.get('id');
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

    const { data: restaurant, isLoading, isError } = useQuery({
        queryKey: ['admin-restaurant-review', restaurantId],
        queryFn: () => RestaurantService.getRestaurant(restaurantId),
        enabled: !!restaurantId,
    });

    const reviewMutation = useMutation({
        mutationFn: ({ action, comment }) => RestaurantService.reviewRestaurant(restaurantId, action, comment),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
            queryClient.invalidateQueries({ queryKey: ['admin-restaurant-review', restaurantId] });
            toast({
                title: "Success",
                description: data.message,
            });
            if (isRejectDialogOpen) setIsRejectDialogOpen(false);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to process review.",
                variant: "destructive",
            });
        }
    });

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-[400px] lg:col-span-2" />
                    <Skeleton className="h-[400px]" />
                </div>
            </div>
        );
    }

    if (isError || !restaurant) {
        return (
            <div className="container mx-auto p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold">Restaurant not found</h2>
                <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
                </Button>
            </div>
        );
    }

    const handleApprove = () => {
        reviewMutation.mutate({ action: 'approve', comment: 'Restaurant details verified.' });
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            toast({ title: "Reason Required", description: "Please provide a reason for rejection.", variant: "destructive" });
            return;
        }
        reviewMutation.mutate({ action: 'reject', comment: rejectionReason });
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold text-stone-900 leading-tight">Review Application</h1>
                            <p className="text-xs text-stone-500">{restaurant.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!restaurant.is_verified && (
                            <>
                                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                                            <XCircle className="w-4 h-4 mr-2" /> Reject
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Reject Application</DialogTitle>
                                            <DialogDescription>
                                                Please provide a specific reason for rejection. This will be emailed to the owner.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <Textarea
                                                placeholder="e.g., Missing valid documents, Invalid address, Poor image quality..."
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                className="min-h-[120px] rounded-xl"
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                                            <Button
                                                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                                                onClick={handleReject}
                                                disabled={reviewMutation.isPending}
                                            >
                                                {reviewMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                Confirm Reject
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                                    onClick={handleApprove}
                                    disabled={reviewMutation.isPending}
                                >
                                    {reviewMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    <CheckCircle className="w-4 h-4 mr-2" /> Approve
                                </Button>
                            </>
                        )}
                        {restaurant.is_verified && (
                            <Badge className="bg-emerald-100 text-emerald-700 h-9 px-4 text-sm font-medium border-emerald-200">
                                <CheckCircle className="w-4 h-4 mr-2" /> Verified
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="rounded-2xl border-stone-200 overflow-hidden shadow-sm">
                            <div className="aspect-video relative bg-stone-100">
                                {restaurant.cover_image ? (
                                    <img
                                        src={restaurant.cover_image}
                                        alt={restaurant.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-stone-400">
                                        <Building2 className="w-16 h-16" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <Badge className="bg-white/90 backdrop-blur text-stone-900 border-none shadow-sm">
                                        {restaurant.cuisine}
                                    </Badge>
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-stone-900 mb-2">{restaurant.name}</h2>
                                        <div className="flex items-center text-stone-500 gap-4 text-sm">
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4 text-amber-600" /> {restaurant.city}
                                            </span>
                                            <span className="font-medium text-amber-700">
                                                {restaurant.price_range}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-amber-600 mb-1">
                                            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                                            <span className="text-lg font-bold">{restaurant.average_rating}</span>
                                        </div>
                                        <p className="text-xs text-stone-400">{restaurant.total_reviews} reviews</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider mb-2">Description</h3>
                                        <p className="text-stone-600 text-sm leading-relaxed">{restaurant.description || 'No description provided.'}</p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-semibold text-stone-900">Gallery Photos</h3>
                                            <div className="grid grid-cols-3 gap-2">
                                                {restaurant.gallery?.map((img, i) => (
                                                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-stone-100 border border-stone-100">
                                                        <img src={img.image_source} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                                {(!restaurant.gallery || restaurant.gallery.length === 0) && (
                                                    <div className="col-span-3 py-4 text-center text-stone-400 text-sm italic">
                                                        No gallery images uploaded.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-semibold text-stone-900">Features & Amenities</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {restaurant.features?.map((f, i) => (
                                                    <Badge key={i} variant="secondary" className="bg-stone-100 text-stone-600 border-none">
                                                        {f}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-stone-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Location & Content</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-stone-900">Full Address</p>
                                        <p className="text-sm text-stone-500">{restaurant.address}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                            <Phone className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-stone-900">Phone</p>
                                            <p className="text-sm text-stone-500">{restaurant.phone || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                            <Globe className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-stone-900">Website</p>
                                            <p className="text-sm text-stone-500">{restaurant.website || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <Card className="rounded-2xl border-stone-200 shadow-sm border-l-4 border-l-amber-500">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Info className="w-5 h-5 text-amber-600" /> Application Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 bg-stone-50 rounded-xl space-y-2">
                                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Owner Email</p>
                                    <p className="text-sm font-medium break-all">{restaurant.owner_email}</p>
                                </div>
                                <div className="p-3 bg-stone-50 rounded-xl space-y-2">
                                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Table Capacity</p>
                                    <p className="text-sm font-medium">{restaurant.table_capacity} Persons</p>
                                </div>
                                <div className="p-3 bg-stone-50 rounded-xl space-y-2">
                                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Verification Comment</p>
                                    <p className="text-sm text-stone-600 italic">
                                        {restaurant.verification_comment || 'No comments yet.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-stone-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-amber-600" /> Opening Hours
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(restaurant.opening_hours || {}).map(([day, hours]) => (
                                        <div key={day} className="flex justify-between items-center text-sm">
                                            <span className="capitalize text-stone-500">{day}</span>
                                            <span className="font-medium text-stone-900">{hours}</span>
                                        </div>
                                    ))}
                                    {(!restaurant.opening_hours || Object.keys(restaurant.opening_hours).length === 0) && (
                                        <p className="text-stone-400 text-sm italic text-center py-2">No hours provided.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
