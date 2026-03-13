from django.urls import path
from .views import (
    RestaurantListCreateAPIView, RestaurantDetailAPIView, MyRestaurantsAPIView,
    ReservationListCreateAPIView, ReservationDetailAPIView,
    ReviewListCreateAPIView, ReviewDetailAPIView,
    PartnerWithUsAPIView, AdminApproveRejectRestaurantAPIView,
    AdminDashboardStatsAPIView
)

urlpatterns = [
    # Admin
    path('admin/stats/', AdminDashboardStatsAPIView.as_view(), name='admin-stats'),

    # Partner Workflow
    path('partner-with-us/', PartnerWithUsAPIView.as_view(), name='partner-with-us'),
    path('review-restaurant/<uuid:pk>/', AdminApproveRejectRestaurantAPIView.as_view(), name='review-restaurant'),

    # Restaurants
    path('restaurants/', RestaurantListCreateAPIView.as_view(), name='restaurant-list'),
    path('restaurants/my_restaurants/', MyRestaurantsAPIView.as_view(), name='my-restaurants'),
    path('restaurants/<uuid:pk>/', RestaurantDetailAPIView.as_view(), name='restaurant-detail'),
    
    # Reservations
    path('reservations/', ReservationListCreateAPIView.as_view(), name='reservation-list'),
    path('reservations/<uuid:pk>/', ReservationDetailAPIView.as_view(), name='reservation-detail'),
    
    # Reviews
    path('reviews/', ReviewListCreateAPIView.as_view(), name='review-list'),
    path('reviews/<uuid:pk>/', ReviewDetailAPIView.as_view(), name='review-detail'),
]
