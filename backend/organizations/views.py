from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import OrganizationSerializer


class OrganizationView(APIView):
    """The current user's organization (create-if-missing, view, update)."""

    def get(self, request):
        org = request.user.organization
        if org is None:
            return Response({"detail": "Organization not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrganizationSerializer(org).data)

    def patch(self, request):
        org = request.user.organization
        if org is None:
            return Response({"detail": "Organization not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = OrganizationSerializer(org, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
