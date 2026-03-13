from rest_framework import serializers
from .models import Restaurant, RestaurantGallery, Reservation, Review
from users.serializers import UserSerializer


class RestaurantGallerySerializer(serializers.ModelSerializer):
    image_source = serializers.SerializerMethodField()

    class Meta:
        model = RestaurantGallery
        fields = ['id', 'image_source', 'order']

    def get_image_source(self, obj):
        request = self.context.get('request')
        url = None
        if obj.image:
            url = obj.image.url
        else:
            url = obj.image_url
            
        if url and url.startswith('/') and request:
            return request.build_absolute_uri(url)
        return url


class RestaurantListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    cover_image_source = serializers.SerializerMethodField()
    owner_email = serializers.SerializerMethodField()
    gallery = RestaurantGallerySerializer(many=True, read_only=True)

    class Meta:
        model = Restaurant
        fields = [
            'id', 'name', 'cuisine', 'description', 'city', 'address', 'price_range',
            'average_rating', 'total_reviews', 'is_active', 'is_verified',
            'cover_image_source', 'owner_email', 'gallery',
            'opening_hours', 'features', 'phone', 'website', 'table_capacity',
            'created_by', 'updated_by', 'created_date',
        ]

    def get_cover_image_source(self, obj):
        request = self.context.get('request')
        url = None
        if obj.cover_image:
            url = obj.cover_image.url
        else:
            url = obj.cover_image_url
            
        if url and url.startswith('/') and request:
            return request.build_absolute_uri(url)
        return url

    def get_owner_email(self, obj):
        return obj.owner.email if obj.owner else None


class RestaurantDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail views including gallery."""
    cover_image_source = serializers.SerializerMethodField()
    gallery = RestaurantGallerySerializer(many=True, read_only=True)
    owner_email = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            'id', 'name', 'cuisine', 'description', 'city', 'address',
            'price_range', 'average_rating', 'total_reviews', 'is_active',
            'is_verified', 'cover_image_source', 'gallery', 'owner_email', 
            'opening_hours', 'features', 'phone', 'website', 'table_capacity',
            'created_by', 'updated_by', 'created_date',
        ]

    def get_cover_image_source(self, obj):
        request = self.context.get('request')
        url = None
        if obj.cover_image:
            url = obj.cover_image.url
        else:
            url = obj.cover_image_url
            
        if url and url.startswith('/') and request:
            return request.build_absolute_uri(url)
        return url

    def get_owner_email(self, obj):
        return obj.owner.email if obj.owner else None


class RestaurantWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating restaurants."""
    gallery = serializers.ListField(
        required=False,
        write_only=True
    )

    class Meta:
        model = Restaurant
        fields = [
            'name', 'cuisine', 'description', 'city', 'address', 'price_range',
            'cover_image', 'cover_image_url', 'is_active', 'is_verified',
            'opening_hours', 'features', 'phone', 'website', 'table_capacity',
            'created_by', 'updated_by', 'gallery',
        ]
        read_only_fields = ['created_by', 'updated_by']

    def to_internal_value(self, data):
        # Handle JSON strings in multipart/form-data
        import json
        from django.http import QueryDict
        
        if isinstance(data, QueryDict):
            # Convert to plain dict, but keep gallery as a list
            new_data = data.dict()
            if 'gallery' in data:
                new_data['gallery'] = data.getlist('gallery')
            data = new_data
        elif hasattr(data, 'copy'):
            data = data.copy()
            
        for field in ['opening_hours', 'features', 'gallery']:
            if field in data and isinstance(data[field], str):
                try:
                    parsed = json.loads(data[field])
                    if parsed is not None:
                        data[field] = parsed
                except (ValueError, TypeError):
                    # If it's not valid JSON, we leave it as is 
                    # so DRF's JSONField can raise its own error
                    pass
                
        return super().to_internal_value(data)

    def update(self, instance, validated_data):
        gallery_data = validated_data.pop('gallery', None)
        
        # If cover_image is provided, clear cover_image_url
        if 'cover_image' in validated_data and validated_data['cover_image']:
            validated_data['cover_image_url'] = ''
        # If cover_image_url is provided, clear cover_image file
        elif 'cover_image_url' in validated_data and validated_data['cover_image_url']:
            instance.cover_image = None

        instance = super().update(instance, validated_data)

        if gallery_data is not None:
            # Sync gallery: clear existing and add new ones
            instance.gallery.all().delete()
            for i, item in enumerate(gallery_data):
                if isinstance(item, str):
                    if item.startswith('http') or item.startswith('/media/'):
                        RestaurantGallery.objects.create(
                            restaurant=instance,
                            image_url=item,
                            order=i
                        )
                else:
                    # Assume it's an uploaded file
                    RestaurantGallery.objects.create(
                        restaurant=instance,
                        image=item,
                        order=i
                    )
        return instance

    def validate_name(self, value):
        """Uniqueness check that ignores soft-deleted restaurants."""
        value = value.strip()
        qs = Restaurant.objects.filter(name__iexact=value, is_deleted=False)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("A restaurant with this name already exists.")
        return value


class PartnerWithUsSerializer(serializers.Serializer):
    """Serializer for external 'Partner With Us' application."""
    # Owner Information
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)
    restaurant_phone = serializers.CharField(required=False, allow_blank=True)

    # Restaurant Information
    restaurant_name = serializers.CharField()
    cuisine = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField()
    address = serializers.CharField()
    price_range = serializers.CharField()
    opening_hours = serializers.JSONField(required=False, default=dict)
    features = serializers.JSONField(required=False, default=list)
    website = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    table_capacity = serializers.IntegerField(required=False, default=0)
    cover_image = serializers.ImageField(required=False, allow_null=True)
    cover_image_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    gallery = serializers.ListField(
        required=False,
        default=list
    )

    def to_internal_value(self, data):
        # Handle JSON strings in multipart/form-data
        import json
        from django.http import QueryDict
        
        if isinstance(data, QueryDict):
            # Convert to plain dict, but keep gallery as a list
            new_data = data.dict()
            if 'gallery' in data:
                new_data['gallery'] = data.getlist('gallery')
            data = new_data
        elif hasattr(data, 'copy'):
            data = data.copy()
            
        for field in ['opening_hours', 'features', 'gallery']:
            if field in data and isinstance(data[field], str):
                try:
                    parsed = json.loads(data[field])
                    if parsed is not None:
                        data[field] = parsed
                except (ValueError, TypeError):
                    pass
                
        return super().to_internal_value(data)

    def validate_email(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_restaurant_name(self, value):
        if Restaurant.objects.filter(name__iexact=value, is_deleted=False).exists():
            raise serializers.ValidationError("A restaurant with this name already exists.")
        return value


class ReservationSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id', 'restaurant', 'restaurant_name', 'user', 'user_email',
            'guest_name', 'guest_email', 'guest_phone', 'date', 'time',
            'guests', 'special_requests', 'status', 'has_reviewed', 
            'created_by', 'updated_by', 'created_at',
        ]
        read_only_fields = ['id', 'user', 'status', 'has_reviewed', 'created_by', 'updated_by', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)


class ReviewSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'restaurant', 'restaurant_name', 'reservation',
            'reviewer', 'reviewer_name', 'overall_rating', 'food_rating',
            'service_rating', 'ambiance_rating', 'value_rating',
            'review_text', 'is_verified', 'is_flagged', 'created_by', 'updated_by', 'created_at',
        ]
        read_only_fields = ['id', 'reviewer', 'is_verified', 'created_by', 'updated_by', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['reviewer'] = request.user
        return super().create(validated_data)
