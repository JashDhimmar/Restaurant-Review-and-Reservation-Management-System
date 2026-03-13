import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class SoftDeleteModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_created"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_updated"
    )

    class Meta:
        abstract = True


class Restaurant(SoftDeleteModel):
    PRICE_CHOICES = [
        ('$', 'Budget'),
        ('$$', 'Moderate'),
        ('$$$', 'Upscale'),
        ('$$$$', 'Fine Dining'),
    ]

    name = models.CharField(max_length=255)
    cuisine = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    city = models.CharField(max_length=100)
    address = models.CharField(max_length=255)
    price_range = models.CharField(max_length=4, choices=PRICE_CHOICES, default='$$')
    cover_image = models.ImageField(upload_to='restaurants/', blank=True, null=True)
    cover_image_url = models.URLField(blank=True, null=True)  # For external URLs

    # Ratings (auto-calculated)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    total_reviews = models.PositiveIntegerField(default=0)

    # Ownership & Status
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='restaurants'
    )
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    verification_comment = models.TextField(blank=True, null=True)
    
    # Flexible fields for tabs
    opening_hours = models.JSONField(default=dict, blank=True)
    features = models.JSONField(default=list, blank=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    table_capacity = models.PositiveIntegerField(default=0)

    # Meta
    created_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_date']

    def __str__(self):
        return self.name

    def update_rating(self):
        """Recalculate average_rating and total_reviews from reviews."""
        from django.db.models import Avg
        reviews = self.reviews.filter(is_deleted=False)
        self.total_reviews = reviews.count()
        avg = reviews.aggregate(Avg('overall_rating'))['overall_rating__avg']
        self.average_rating = round(avg, 2) if avg else 0.0
        self.save(update_fields=['average_rating', 'total_reviews'])


class RestaurantGallery(SoftDeleteModel):
    """Additional images for a restaurant."""
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='gallery')
    image = models.ImageField(upload_to='restaurants/gallery/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Gallery image for {self.restaurant.name}"


class Reservation(SoftDeleteModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reservations')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reservations'
    )

    # Guest info (for display / if user is not logged in)
    guest_name = models.CharField(max_length=255)
    guest_email = models.EmailField()
    guest_phone = models.CharField(max_length=30)

    # Booking details
    date = models.DateField()
    time = models.TimeField()
    guests = models.PositiveSmallIntegerField(default=2)
    special_requests = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    has_reviewed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.guest_name} @ {self.restaurant.name} on {self.date}"


class Review(SoftDeleteModel):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reviews')
    reservation = models.OneToOneField(
        Reservation, on_delete=models.SET_NULL, null=True, blank=True, related_name='review'
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reviews'
    )

    # Reviewer display name
    reviewer_name = models.CharField(max_length=255)

    # Ratings (1-5)
    overall_rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    food_rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    service_rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    ambiance_rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    value_rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])

    review_text = models.TextField()
    is_verified = models.BooleanField(default=False)
    is_flagged = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.reviewer_name} for {self.restaurant.name}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Auto-update the restaurant's aggregate rating
        self.restaurant.update_rating()


class EmailSetting(models.Model):
    SMTP = "smtp"
    SENDGRID = "send_grid"

    MAIL_TYPES = [
        (SMTP, "SMTP"),
        (SENDGRID, "SendGrid"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mail_type = models.CharField(max_length=20, choices=MAIL_TYPES)
    smtp_from_email = models.EmailField(max_length=100, null=True, blank=True)
    smtp_password = models.CharField(max_length=255, null=True, blank=True)
    smtp_from_name = models.CharField(max_length=100, null=True, blank=True)
    send_grid_sender_email = models.EmailField(max_length=100, null=True, blank=True)
    send_grid_api_key = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "email_settings"
        
    def __str__(self):
        return f"{self.mail_type} - {'Active' if self.is_active else 'Inactive'}"


class EmailTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "email_templates"

    def __str__(self):
        return self.name
