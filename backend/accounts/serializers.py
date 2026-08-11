from django.contrib.auth import get_user_model
from rest_framework import serializers

from organizations.models import Organization
from organizations.serializers import OrganizationSerializer

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    """Registration payload: creates the organization and the user."""

    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    organization_name = serializers.CharField(max_length=255)
    organization_type = serializers.ChoiceField(
        choices=Organization.OrganizationType.choices,
        default=Organization.OrganizationType.COMPANY,
    )
    designation = serializers.CharField(max_length=255, allow_blank=True, default="")
    department = serializers.CharField(max_length=255, allow_blank=True, default="")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("confirm_password"):
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        full_name = attrs.get("full_name", "").strip()
        if not full_name:
            raise serializers.ValidationError({"full_name": "Full name is required."})
        return attrs

    def create(self, validated_data):
        organization = Organization.objects.create(
            name=validated_data["organization_name"].strip(),
            organization_type=validated_data["organization_type"],
        )
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data["full_name"].strip(),
            organization=organization,
            designation=validated_data.get("designation", ""),
            department=validated_data.get("department", ""),
        )
        return user


class ProfileSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "full_name", "email", "role", "designation", "department",
            "organization", "created_at",
        ]
        read_only_fields = ["id", "email", "role", "organization", "created_at"]

    def update(self, instance, validated_data):
        instance.full_name = validated_data.get("full_name", instance.full_name)
        instance.designation = validated_data.get("designation", instance.designation)
        instance.department = validated_data.get("department", instance.department)
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Your current password is incorrect.")
        return value
