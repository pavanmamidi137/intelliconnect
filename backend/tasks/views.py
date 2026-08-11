from rest_framework import status
from rest_framework.mixins import (
    CreateModelMixin,
    DestroyModelMixin,
    ListModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
)
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from meetings.models import Meeting
from people.models import Person

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(
    ListModelMixin,
    RetrieveModelMixin,
    CreateModelMixin,
    UpdateModelMixin,
    DestroyModelMixin,
    GenericViewSet,
):
    serializer_class = TaskSerializer
    queryset = Task.objects.none()
    lookup_field = "id"

    def get_queryset(self):
        user = self.request.user
        if user.organization_id is None:
            return Task.objects.none()
        qs = Task.objects.filter(meeting__organization=user.organization).select_related(
            "person", "meeting"
        )
        meeting_id = self.request.query_params.get("meeting")
        if meeting_id:
            qs = qs.filter(meeting_id=meeting_id)
        return qs

    def get_object(self):
        obj = super().get_object()
        if obj.meeting.organization_id != self.request.user.organization_id:
            from rest_framework.exceptions import NotFound

            raise NotFound("You don't have permission to access this task.")
        return obj

    def create(self, request, *args, **kwargs):
        meeting_id = request.data.get("meeting")
        if not meeting_id:
            return Response(
                {"error": True, "code": "validation_error", "detail": "meeting is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            meeting = Meeting.objects.get(id=meeting_id)
        except Meeting.DoesNotExist:
            return Response(
                {"error": True, "code": "validation_error", "detail": "Meeting not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if meeting.organization_id != request.user.organization_id:
            return Response(
                {
                    "error": True,
                    "code": "permission_denied",
                    "detail": "You don't have permission to modify this meeting's tasks.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        person_id = request.data.get("person")
        person = None
        if person_id:
            try:
                person = Person.objects.get(id=person_id, organization=meeting.organization)
            except Person.DoesNotExist:
                return Response(
                    {
                        "error": True,
                        "code": "validation_error",
                        "detail": "The assigned person doesn't belong to your organization.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        task = Task.objects.create(
            meeting=meeting,
            person=person,
            mentioned_name=(request.data.get("mentioned_name") or "").strip(),
            task=(request.data.get("task") or "").strip(),
            deadline=request.data.get("deadline") or None,
            priority=request.data.get("priority") or Task.Priority.MEDIUM,
            status=request.data.get("status") or Task.Status.PENDING,
            context=(request.data.get("context") or "").strip(),
            source=Task.Source.MANUAL,
        )
        return Response(
            TaskSerializer(task, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, *args, **kwargs):
        task = self.get_object()
        allowed = ["task", "deadline", "priority", "status", "context", "person", "mentioned_name"]
        for field in allowed:
            if field in request.data:
                if field == "person":
                    value = request.data[field]
                    if value in (None, "", "null"):
                        task.person = None
                    else:
                        person = Person.objects.filter(
                            id=value, organization=request.user.organization
                        ).first()
                        if person is None:
                            return Response(
                                {
                                    "error": True,
                                    "code": "validation_error",
                                    "detail": "The assigned person doesn't belong to your organization.",
                                },
                                status=status.HTTP_400_BAD_REQUEST,
                            )
                        task.person = person
                else:
                    setattr(task, field, request.data[field])
        task.save()
        return Response(TaskSerializer(task, context={"request": request}).data)

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
