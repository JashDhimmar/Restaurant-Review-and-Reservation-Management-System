from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
import os

from .serializers import RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer
from core.logger_function import logger_function
from core.views import CustomPagination
from core.permissions import IsPlatformAdmin

User = get_user_model()
filename = os.path.basename(__file__)[:-3]

class RegisterView(APIView):
    """Public registration view."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                logger_function(filename, f"New user registered: {user.email}", 1)
                return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
            
            logger_function(filename, f"Registration validation error: {serializer.errors}", 2)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger_function(filename, f"Error during registration: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserListCreateAPIView(APIView):
    """Admin-level user management (List/Create)."""
    permission_classes = [IsPlatformAdmin]
    pagination_class = CustomPagination

    def get(self, request):
        try:
            users = User.objects.filter(is_deleted=False).order_by('-date_joined')
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(users, request)
            serializer = UserSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            logger_function(filename, f"Error listing users: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                logger_function(filename, f"Admin created user: {user.email} by {request.user}", 1)
                return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger_function(filename, f"Error creating user: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomerListAPIView(APIView):
    """Admin-level customer management (List)."""
    permission_classes = [IsPlatformAdmin]
    pagination_class = CustomPagination

    def get(self, request):
        try:
            customers = User.objects.filter(role='user', is_deleted=False).order_by('-date_joined')
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(customers, request)
            serializer = UserSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            logger_function(filename, f"Error listing customers: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OwnerListAPIView(APIView):
    """Admin-level owner management (List)."""
    permission_classes = [IsPlatformAdmin]
    pagination_class = CustomPagination

    def get(self, request):
        try:
            owners = User.objects.filter(role='owner', is_deleted=False).order_by('-date_joined')
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(owners, request)
            serializer = UserSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            logger_function(filename, f"Error listing owners: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserDetailAPIView(APIView):
    """Admin-level user management (Get/Update/Delete)."""
    permission_classes = [IsPlatformAdmin]

    def get_object(self, pk):
        return get_object_or_404(User, id=pk, is_deleted=False)

    def get(self, request, pk):
        user = self.get_object(pk)
        return Response(UserSerializer(user).data)

    def patch(self, request, pk):
        try:
            user = self.get_object(pk)
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                logger_function(filename, f"User updated: {user.email} by {request.user}", 1)
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger_function(filename, f"Error updating user: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            user = self.get_object(pk)
            user.is_deleted = True
            user.deleted_at = timezone.now()
            user.is_active = False  # Deactivate deleted users
            user.save()
            logger_function(filename, f"User soft-deleted: {user.email} by {request.user}", 1)
            return Response({'message': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger_function(filename, f"Error deleting user: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login view returning JWT tokens + user data."""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    """Get or update the currently authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        try:
            serializer = UserSerializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                logger_function(filename, f"User updated own profile: {request.user.email}", 1)
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger_function(filename, f"Error updating profile: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
