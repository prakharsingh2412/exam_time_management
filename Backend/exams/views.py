from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Max, Avg, Count, Q

from .models import Test, Attempt
from .parser import extract_answer_key
from .permissions import IsOwnerStrict
from .scoring import score_attempt, build_time_analytics
from .serializers import (
    TestSerializer,
    AnswerKeySerializer,
    AttemptSerializer,
    SubmitSerializer,
)
from core.mixins import EnvelopeResponseMixin


class TestViewSet(viewsets.ModelViewSet):
    """
    CRUD for the logged-in user's tests.

    POST /api/tests/                -> create test (multipart, includes pdf)
    GET  /api/tests/                -> list
    GET  /api/tests/{id}/           -> detail
    PATCH /api/tests/{id}/answer-key/  -> manual answer-key override
    """

    serializer_class = TestSerializer
    permission_classes = [IsAuthenticated, IsOwnerStrict]

    def get_queryset(self):
        return Test.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        test = serializer.save(owner=self.request.user)

        # Best-effort answer-key extraction on upload
        if not test.answer_key:
            try:
                extracted = extract_answer_key(
                    test.pdf.path, test.total_questions
                )
                if extracted:
                    test.answer_key = extracted
                    test.save(update_fields=["answer_key"])
            except Exception:
                # Silent fallback: user can PATCH the key manually
                pass

    @action(
        detail=True,
        methods=["patch"],
        url_path="answer-key",
        serializer_class=AnswerKeySerializer,
    )
    def answer_key(self, request, pk=None):
        test = self.get_object()
        serializer = self.get_serializer(test, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AttemptViewSet(viewsets.ModelViewSet):
    """
    Attempt lifecycle.

    POST /api/attempts/                    -> start attempt {test: <id>}
    GET  /api/attempts/                    -> user's history
    GET  /api/attempts/{id}/               -> detail
    POST /api/attempts/{id}/submit/        -> submit answers -> score
    GET  /api/attempts/{id}/report/        -> re-fetch scored report
    """

    serializer_class = AttemptSerializer
    permission_classes = [IsAuthenticated, IsOwnerStrict]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return (
            Attempt.objects.filter(user=self.request.user)
            .select_related("test")
        )

    def create(self, request, *args, **kwargs):
        test_id = request.data.get("test")
        if not test_id:
            return Response(
                {"detail": "Field 'test' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            test = Test.objects.get(id=test_id, owner=request.user)
        except (Test.DoesNotExist, ValueError):
            return Response(
                {"detail": "Test not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        attempt = Attempt.objects.create(test=test, user=request.user)
        return Response(
            AttemptSerializer(attempt, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        attempt = self.get_object()

        if attempt.submitted_at:
            return Response(
                {"detail": "Attempt already submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        attempt.responses = data["responses"]
        attempt.marked = data.get("marked", [])
        attempt.time_per_q = data.get("time_per_q", {})

        result = score_attempt(attempt.test, attempt.responses)
        attempt.score = result["score"]
        attempt.correct = result["correct"]
        attempt.wrong = result["wrong"]
        attempt.skipped = result["skipped"]
        attempt.submitted_at = timezone.now()
        attempt.save()

        analytics = build_time_analytics(attempt.test, attempt)

        return Response(
            {
                "attempt": AttemptSerializer(
                    attempt, context={"request": request}
                ).data,
                "analytics": analytics,
            }
        )

    @action(detail=True, methods=["get"])
    def report(self, request, pk=None):
        attempt = self.get_object()
        if not attempt.submitted_at:
            return Response(
                {"detail": "Attempt not submitted yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        analytics = build_time_analytics(attempt.test, attempt)
        return Response(
            {
                "attempt": AttemptSerializer(
                    attempt, context={"request": request}
                ).data,
                "analytics": analytics,
            }
        )


class DashboardSummaryView(EnvelopeResponseMixin, APIView):
    """
    GET /api/dashboard/summary/
    Returns aggregate stats + recent activity for the logged-in user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        tests = Test.objects.filter(owner=user)
        attempts = Attempt.objects.filter(user=user, submitted_at__isnull=False)

        # Per-test stats
        recent_attempts = (
            attempts.select_related("test")
            .order_by("-submitted_at")[:5]
        )

        best = attempts.aggregate(best=Max("score"))["best"] or 0
        avg = attempts.aggregate(avg=Avg("score"))["avg"] or 0
        accuracy_avg = (
            attempts.aggregate(
                a=Avg("correct") * 100.0 / (Avg("correct") + Avg("wrong") + 1)
            )["a"]
            or 0
        )

        return self.success_response(
            data={
                "stats": {
                    "total_tests": tests.count(),
                    "total_attempts": attempts.count(),
                    "best_score": float(best),
                    "avg_score": round(float(avg), 2),
                    "avg_accuracy": round(float(accuracy_avg), 1),
                },
                "recent_attempts": AttemptSerializer(
                    recent_attempts, many=True, context={"request": request}
                ).data,
                "tests": TestSerializer(
                    tests.order_by("-created_at")[:10],
                    many=True,
                    context={"request": request},
                ).data,
            }
        )