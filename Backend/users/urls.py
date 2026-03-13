from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, UserListCreateAPIView, UserDetailAPIView, 
    CustomTokenObtainPairView, MeView, CustomerListAPIView, OwnerListAPIView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    
    # User Management
    path('users/', UserListCreateAPIView.as_view(), name='user-list'),
    path('customers/', CustomerListAPIView.as_view(), name='customer-list'),
    path('owners/', OwnerListAPIView.as_view(), name='owner-list'),
    path('users/<uuid:pk>/', UserDetailAPIView.as_view(), name='user-detail'),
]
