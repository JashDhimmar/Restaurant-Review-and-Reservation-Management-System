from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'full_name', 'role', 'phone', 'created_date', 'updated_date']
        read_only_fields = ['id', 'created_date', 'updated_date']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def update(self, instance, validated_data):
        if hasattr(self, 'initial_data') and 'full_name' in self.initial_data:
            full_name = self.initial_data['full_name']
            instance.first_name = full_name.split(' ')[0] if ' ' in full_name else full_name
            instance.last_name = full_name.split(' ', 1)[1] if ' ' in full_name else ''
        return super().update(instance, validated_data)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label='Confirm password')
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'password', 'password2']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        full_name = validated_data.pop('full_name', '')
        password = validated_data.pop('password')
        first_name = full_name.split(' ')[0] if ' ' in full_name else full_name
        last_name = full_name.split(' ', 1)[1] if ' ' in full_name else ''
        user = User(
            email=validated_data['email'],
            username=validated_data['email'],
            first_name=first_name,
            last_name=last_name,
            role='user',           # Always assign 'user' role
            is_active=True,
        )
        user.set_password(password)
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT token with extra user data."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data
