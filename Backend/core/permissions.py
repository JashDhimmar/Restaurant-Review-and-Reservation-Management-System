from rest_framework.permissions import BasePermission

class IsOwnerOrAdmin(BasePermission):
    """
    Allow access if the user is an admin/superuser or owns the related object.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user
        # Django superusers and users with admin role always have access
        if user.is_superuser or user.is_staff or getattr(user, 'role', None) == 'admin':
            return True
        # For restaurants: check if user is the owner
        if hasattr(obj, 'owner'):
            return obj.owner == user
        # For reservations/reviews: check if user created it
        if hasattr(obj, 'user'):
            return obj.user == user
        if hasattr(obj, 'reviewer'):
            return obj.reviewer == user
        return False


class IsOwnerOfRestaurant(BasePermission):
    """
    Allow access only if the user owns the restaurant being modified.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin' or request.user.is_staff:
            return True
        return obj.owner == request.user

class IsPlatformAdmin(BasePermission):
    """
    Allow access only if the user is a platform admin (staff or role='admin').
    """
    def has_permission(self, request, view):
        user = request.user
        return user and user.is_authenticated and (user.is_staff or getattr(user, 'role', None) == 'admin')
