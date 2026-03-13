from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import models
from django.db.models import Count
from django.db.models.functions import TruncDay
from .models import Restaurant, Reservation, Review
from .serializers import (
    RestaurantListSerializer, RestaurantDetailSerializer, RestaurantWriteSerializer,
    ReservationSerializer, ReviewSerializer, PartnerWithUsSerializer,
)
from .permissions import IsOwnerOrAdmin, IsPlatformAdmin
from .logger_function import logger_function
from django.contrib.auth import get_user_model
import os

User = get_user_model()
filename = os.path.basename(__file__)[:-3]


# --- PARTNER WORKFLOW ---

class PartnerWithUsAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            serializer = PartnerWithUsSerializer(data=request.data)
            if serializer.is_valid():
                data = serializer.validated_data
                
                # 1. Create User (Inactive)
                user = User.objects.create_user(
                    email=data['email'],
                    username=data['email'], # Use email as username
                    password=data['password'],
                    first_name=data['full_name'].split(' ')[0] if ' ' in data['full_name'] else data['full_name'],
                    last_name=data['full_name'].split(' ')[1] if ' ' in data['full_name'] else '',
                    role='owner',
                    phone=data.get('phone', ''),
                    is_active=False
                )
                
                # 2. Create Restaurant (Unverified)
                opening_hours = data.get('opening_hours', {})
                features = data.get('features', [])

                restaurant = Restaurant.objects.create(
                    name=data['restaurant_name'],
                    cuisine=data['cuisine'],
                    description=data.get('description', ''),
                    city=data['city'],
                    address=data['address'],
                    price_range=data['price_range'],
                    opening_hours=opening_hours,
                    features=features,
                    website=data.get('website'),
                    phone=data.get('restaurant_phone', ''),
                    table_capacity=data.get('table_capacity', 0),
                    cover_image=data.get('cover_image'),
                    cover_image_url=data.get('cover_image_url'),
                    owner=user,
                    is_active=True,
                    is_verified=False
                )

                # 3. Create Gallery Images
                gallery_data = data.get('gallery', [])
                if gallery_data:
                    from .models import RestaurantGallery
                    for i, item in enumerate(gallery_data):
                        if isinstance(item, str):
                            if item.startswith('http') or item.startswith('/media/'):
                                RestaurantGallery.objects.create(
                                    restaurant=restaurant,
                                    image_url=item,
                                    order=i
                                )
                        else:
                            # Assume it's an uploaded file
                            RestaurantGallery.objects.create(
                                restaurant=restaurant,
                                image=item,
                                order=i
                            )
                
                logger_function(filename, f"New partner application: {restaurant.name} by {user.email}", 1)
                return Response({
                    "message": "Application submitted successfully. Please wait for admin verification.",
                    "restaurant_id": restaurant.id
                }, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger_function(filename, f"Error in PartnerWithUs: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from .utils.email_service import EmailService

class AdminApproveRejectRestaurantAPIView(APIView):
    permission_classes = [IsPlatformAdmin]

    def post(self, request, pk):
        try:
            action = request.data.get('action') # 'approve' or 'reject'
            comment = request.data.get('comment', '')
            restaurant = get_object_or_404(Restaurant, id=pk)
            owner = restaurant.owner
            
            if action == 'approve':
                # Verify restaurant
                restaurant.is_verified = True
                restaurant.verification_comment = comment
                restaurant.updated_by = request.user
                restaurant.save()
                
                # Activate owner
                if owner:
                    owner.is_active = True
                    owner.save()
                
                # Send Email
                EmailService.send_email(
                    template_name="RESTAURANT_APPROVED",
                    to_emails=[owner.email],
                    context={
                        "owner_name": owner.get_full_name() or owner.email,
                        "restaurant_name": restaurant.name,
                        "comment": comment
                    }
                )
                
                logger_function(filename, f"Restaurant approved: {restaurant.name} by admin {request.user}", 1)
                return Response({"message": f"Restaurant '{restaurant.name}' approved successfully."})
            
            elif action == 'reject':
                # Reject restaurant (keep unverified)
                restaurant.is_verified = False
                restaurant.verification_comment = comment
                restaurant.updated_by = request.user
                restaurant.save()
                
                # Send Email
                EmailService.send_email(
                    template_name="RESTAURANT_REJECTED",
                    to_emails=[owner.email],
                    context={
                        "owner_name": owner.get_full_name() or owner.email,
                        "restaurant_name": restaurant.name,
                        "reason": comment
                    }
                )
                
                logger_function(filename, f"Restaurant rejected: {restaurant.name} by admin {request.user}", 1)
                return Response({"message": f"Restaurant '{restaurant.name}' rejected successfully."})
            
            else:
                return Response({"error": "Invalid action. Use 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger_function(filename, f"Error in approve/reject restaurant: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- PAGINATION ---

class CustomPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100

# --- RESTAURANT VIEWS ---

class MyRestaurantsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    pagination_class = CustomPagination

    def get(self, request):
        try:
            queryset = Restaurant.objects.filter(is_deleted=False, owner=request.user).order_by('-created_date')
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(queryset, request)
            serializer = RestaurantListSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            logger_function(filename, f"Error fetching owner's restaurants: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RestaurantListCreateAPIView(APIView):
    pagination_class = CustomPagination

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    def get(self, request):
        try:
            user = request.user
            # Admins see all. Owners see all and their own unverified. Others see only verified.
            queryset = Restaurant.objects.filter(is_deleted=False).select_related('owner')
            
            if user.is_authenticated:
                if user.is_staff or getattr(user, 'role', None) == 'admin':
                    # Full access already set by initial filter
                    pass
                else:
                    # Owners see verified OR their own unverified
                    from django.db.models import Q
                    queryset = queryset.filter(Q(is_verified=True, is_active=True) | Q(owner=user))
            else:
                queryset = queryset.filter(is_active=True, is_verified=True)
                
            queryset = queryset.order_by('-created_date')
            
            cuisine = request.query_params.get('cuisine')
            if cuisine:
                queryset = queryset.filter(cuisine__icontains=cuisine)
                
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(queryset, request)
            serializer = RestaurantListSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            logger_function(filename, f"Error listing restaurants: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            serializer = RestaurantWriteSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                instance = serializer.save(
                    owner=request.user,
                    created_by=request.user,
                    updated_by=request.user
                )
                logger_function(filename, f"Restaurant created: {instance.name} by {request.user}", 1)
                return Response(RestaurantDetailSerializer(instance, context={'request': request}).data, status=status.HTTP_201_CREATED)
            
            logger_function(filename, f"Validation error creating restaurant: {serializer.errors}", 2)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger_function(filename, f"Error creating restaurant: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RestaurantDetailAPIView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    def get_object(self, pk):
        return get_object_or_404(Restaurant, id=pk, is_deleted=False)

    def get(self, request, pk):
        restaurant = self.get_object(pk)
        serializer = RestaurantDetailSerializer(restaurant, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        try:
            restaurant = self.get_object(pk)
            serializer = RestaurantWriteSerializer(restaurant, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                logger_function(filename, f"Restaurant updated: {restaurant.name} by {request.user}", 1)
                return Response(RestaurantDetailSerializer(restaurant, context={'request': request}).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger_function(filename, f"Error updating restaurant: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            restaurant = self.get_object(pk)
            restaurant.is_deleted = True
            restaurant.deleted_at = timezone.now()
            restaurant.updated_by = request.user
            restaurant.save()
            logger_function(filename, f"Restaurant soft-deleted: {restaurant.name} by {request.user}", 1)
            return Response({'message': 'Deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger_function(filename, f"Error deleting restaurant: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# --- RESERVATION VIEWS ---

class ReservationListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = CustomPagination

    def get(self, request):
        try:
            user = request.user
            qs = Reservation.objects.filter(is_deleted=False).order_by('-created_at')
            
            if user.is_superuser or user.is_staff or getattr(user, 'role', None) == 'admin':
                pass 
            elif getattr(user, 'role', None) == 'owner':
                owned_ids = Restaurant.objects.filter(owner=user, is_deleted=False).values_list('id', flat=True)
                qs = qs.filter(models.Q(restaurant_id__in=owned_ids) | models.Q(user=user))
            else:
                qs = qs.filter(user=user)

            paginator = self.pagination_class()
            page = paginator.paginate_queryset(qs, request)
            serializer = ReservationSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            logger_function(filename, f"Error listing reservations: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            serializer = ReservationSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                instance = serializer.save(
                    user=request.user if request.user.is_authenticated else None,
                    created_by=request.user,
                    updated_by=request.user
                )
                logger_function(filename, f"Reservation created ID: {instance.id} by {request.user}", 1)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger_function(filename, f"Error creating reservation: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReservationDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_object(self, pk):
        return get_object_or_404(Reservation, id=pk, is_deleted=False)

    def get(self, request, pk):
        reservation = self.get_object(pk)
        serializer = ReservationSerializer(reservation, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        try:
            reservation = self.get_object(pk)
            serializer = ReservationSerializer(reservation, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                logger_function(filename, f"Reservation updated ID: {reservation.id} by {request.user}", 1)
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger_function(filename, f"Error updating reservation: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            reservation = self.get_object(pk)
            reservation.is_deleted = True
            reservation.deleted_at = timezone.now()
            reservation.updated_by = request.user
            reservation.save()
            logger_function(filename, f"Reservation soft-deleted ID: {reservation.id} by {request.user}", 1)
            return Response({'message': 'Deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger_function(filename, f"Error deleting reservation: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# --- REVIEW VIEWS ---

class ReviewListCreateAPIView(APIView):
    pagination_class = CustomPagination

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        try:
            qs = Review.objects.filter(is_deleted=False).select_related('restaurant', 'reviewer').order_by('-created_at')
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(qs, request)
            serializer = ReviewSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            logger_function(filename, f"Error listing reviews: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            serializer = ReviewSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                instance = serializer.save(
                    reviewer=request.user,
                    created_by=request.user,
                    updated_by=request.user
                )
                logger_function(filename, f"Review created ID: {instance.id} by {request.user}", 1)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger_function(filename, f"Error creating review: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReviewDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_object(self, pk):
        return get_object_or_404(Review, id=pk, is_deleted=False)

    def get(self, request, pk):
        review = self.get_object(pk)
        serializer = ReviewSerializer(review, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        try:
            review = self.get_object(pk)
            serializer = ReviewSerializer(review, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                logger_function(filename, f"Review updated ID: {review.id} by {request.user}", 1)
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger_function(filename, f"Error updating review: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            review = self.get_object(pk)
            review.is_deleted = True
            review.deleted_at = timezone.now()
            review.updated_by = request.user
            review.save()
            logger_function(filename, f"Review soft-deleted ID: {review.id} by {request.user}", 1)
            return Response({'message': 'Deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger_function(filename, f"Error deleting review: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# --- ADMIN DASHBOARD VIEWS ---

class AdminDashboardStatsAPIView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        try:
            today = timezone.now()
            week_ago = today - timezone.timedelta(days=7)

            # Total counts
            total_restaurants = Restaurant.objects.filter(is_deleted=False).count()
            total_customers = User.objects.filter(is_deleted=False, role='user').count()
            total_owners = User.objects.filter(is_deleted=False, role='owner').count()
            total_reviews = Review.objects.filter(is_deleted=False).count()
            total_reservations = Reservation.objects.filter(is_deleted=False).count()

            # Weekly counts
            new_restaurants = Restaurant.objects.filter(is_deleted=False, created_date__gte=week_ago).count()
            new_customers = User.objects.filter(is_deleted=False, role='user', created_date__gte=week_ago).count()
            new_owners = User.objects.filter(is_deleted=False, role='owner', created_date__gte=week_ago).count()
            new_reservations = Reservation.objects.filter(is_deleted=False, created_at__gte=week_ago).count()

            # Actionable counts
            pending_verification = Restaurant.objects.filter(is_deleted=False, is_verified=False).count()
            verified_restaurants = total_restaurants - pending_verification
            flagged_reviews = Review.objects.filter(is_deleted=False, is_flagged=True).count()

            # Chart Data: User Distribution
            user_distribution = [
                {"name": "Customers", "value": total_customers},
                {"name": "Owners", "value": total_owners}
            ]

            # Chart Data: Restaurant Status
            restaurant_status = [
                {"name": "Verified", "value": verified_restaurants},
                {"name": "Pending", "value": pending_verification}
            ]

            # Chart Data: Reservation Trend (Last 7 Days)
            trend_qs = Reservation.objects.filter(
                is_deleted=False, 
                created_at__gte=week_ago
            ).annotate(day=TruncDay('created_at')).values('day').annotate(count=Count('id')).order_by('day')
            
            # Formating trend data to ensure all 7 days are present if possible
            reservation_trend = []
            for i in range(7):
                d = (today - timezone.timedelta(days=6-i)).date()
                match = next((item for item in trend_qs if item['day'].date() == d), None)
                reservation_trend.append({
                    "date": d.strftime("%m/%d"),
                    "count": match['count'] if match else 0
                })

            # Chart Data: Rating Distribution
            rating_qs = Review.objects.filter(is_deleted=False).values('overall_rating').annotate(count=Count('id')).order_by('overall_rating')
            rating_distribution = []
            for i in range(1, 6):
                match = next((item for item in rating_qs if int(item['overall_rating']) == i), None)
                rating_distribution.append({
                    "rating": f"{i} Star",
                    "count": match['count'] if match else 0
                })

            data = {
                "totalRestaurants": total_restaurants,
                "totalCustomers": total_customers,
                "totalOwners": total_owners,
                "totalReviews": total_reviews,
                "totalReservations": total_reservations,
                "newRestaurants": new_restaurants,
                "newCustomers": new_customers,
                "newOwners": new_owners,
                "newReservations": new_reservations,
                "pendingVerification": pending_verification,
                "flaggedReviews": flagged_reviews,
                "charts": {
                    "userDistribution": user_distribution,
                    "restaurantStatus": restaurant_status,
                    "reservationTrend": reservation_trend,
                    "ratingDistribution": rating_distribution
                }
            }

            return Response(data)
        except Exception as e:
            logger_function(filename, f"Error fetching admin stats: {str(e)}", 2)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
