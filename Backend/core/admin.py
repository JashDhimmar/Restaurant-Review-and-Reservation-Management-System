from django.contrib import admin
from .models import Restaurant, RestaurantGallery, Reservation, Review


class RestaurantGalleryInline(admin.TabularInline):
    model = RestaurantGallery
    extra = 1


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ['name', 'cuisine', 'city', 'price_range', 'average_rating', 'is_verified', 'is_active', 'owner']
    list_filter = ['cuisine', 'city', 'price_range', 'is_verified', 'is_active']
    search_fields = ['name', 'city', 'cuisine']
    inlines = [RestaurantGalleryInline]
    ordering = ['-created_date']


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['guest_name', 'restaurant', 'date', 'time', 'guests', 'status']
    list_filter = ['status', 'date']
    search_fields = ['guest_name', 'guest_email', 'restaurant__name']
    ordering = ['-created_at']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['reviewer_name', 'restaurant', 'overall_rating', 'is_verified', 'created_at']
    list_filter = ['is_verified', 'overall_rating']
    search_fields = ['reviewer_name', 'restaurant__name', 'review_text']
    ordering = ['-created_at']
