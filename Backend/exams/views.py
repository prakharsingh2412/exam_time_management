
from decimal import Decimal
from django.core.cache import cache
from django.utils import timezone
from django.db.models import Max, Avg
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Test, Question, Attempt
from .parsers import extract_answer_key, parse_test_pdf
from .permissions import IsOwnerStrict
from .scoring import score_attempt, build_time_analytics
from .serializers import (
    TestPublicSerializer,
    TestAdminSerializer,
    AnswerKeySerializer,
    QuestionPublicSerializer,
    QuestionAdminSerializer,
    AttemptSerializer,
    SubmitSerializer,
)
from core.mixins import EnvelopeResponseMixin


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def _trigger_parse(test: Test) -> None:
    test.parsing_status = "pending"
    test.save(update_fields=["parsing_status"])

    try:
        from .tasks import parse_test_pdf_task
        parse_test_pdf_task.delay(test.id)
    except Exception:
        import threading
        threading.Thread(
            target=parse_test_pdf, args=(test,), daemon=True
        ).start()

# ─────────────────────────────────────────────────────────────
# Tests
# ─────────────────────────────────────────────────────────────

class TestViewSet(viewsets.ModelViewSet):
    """
    CRUD for the logged-in user's tests.

    POST   /api/tests/                     -> create (multipart, includes pdf)
    GET    /api/tests/                     -> list
    GET    /api/tests/{id}/                -> detail
    PATCH  /api/tests/{id}/answer-key/     -> manual answer-key override
    POST   /api/tests/{id}/reparse/        -> re-run the PDF parser
    GET    /api/tests/{id}/exam-payload/   -> test + questions (cached)
    GET    /api/tests/{id}/questions/      -> questions only (cached list)
    """

    permission_classes = [IsAuthenticated, IsOwnerStrict]

    def get_queryset(self):
        return Test.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        # Staff (or owner) sees answer_key; examinees do not.
        # In this app, "owner" is the only one who creates tests, so the
        # owner always gets the admin serializer here.
        return TestAdminSerializer

    # ── create ───────────────────────────────────────────────

    def perform_create(self, serializer):
        test = serializer.save(owner=self.request.user)

        # Best-effort answer-key extraction on upload (unrelated to
        # question parsing, but useful).
        if not test.answer_key:
            try:
                extracted = extract_answer_key(
                    test.pdf.path, test.total_questions
                )
                if extracted:
                    test.answer_key = extracted
                    test.save(update_fields=["answer_key"])
            except Exception:
                pass  # user can PATCH the key later

        # Now parse the questions themselves
        _trigger_parse(test)

    # ── answer key ───────────────────────────────────────────

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

        # Answer key changed → grading output for existing attempts is stale.
        # (Optional) also bust the payload cache since `correct` might be
        # copied into Question rows by the parser.
        cache.delete(f"test:{test.id}:exam-payload:v1")

        return Response(serializer.data)

    # ── reparse ──────────────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="reparse")
    def reparse(self, request, pk=None):
        test = self.get_object()
        _trigger_parse(test)
        return Response({"status": "queued", "parsing_status": test.parsing_status})

    # ── exam payload (single round-trip) ─────────────────────

    @action(detail=True, methods=["get"], url_path="exam-payload")
    def exam_payload(self, request, pk=None):
        cache_key = f"test:{pk}:exam-payload:v1"
        data = cache.get(cache_key)

        if data is None:
            test = self.get_object()
            if test.parsing_status != "done":
                return Response(
                    {
                        "detail": "Test is not ready yet.",
                        "parsing_status": test.parsing_status,
                        "parsing_error": test.parsing_error,
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            data = {
                "test": TestAdminSerializer(test).data,
                "questions": list(
                    test.questions.order_by("number").values(
                        "number",
                        "text",
                        "option_a",
                        "option_b",
                        "option_c",
                        "option_d",
                    )
                ),
            }
            cache.set(cache_key, data, timeout=60 * 60)

        return Response(data)

    # ── questions only ───────────────────────────────────────

    @action(detail=True, methods=["get"], url_path="questions")
    def questions(self, request, pk=None):
        test = self.get_object()
        qs = test.questions.order_by("number")
        ser = QuestionAdminSerializer(qs, many=True)
        return Response(ser.data)


# ─────────────────────────────────────────────────────────────
# Attempts
# ─────────────────────────────────────────────────────────────

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

        if test.parsing_status != "done":
            return Response(
                {
                    "detail": "Test is still being prepared.",
                    "parsing_status": test.parsing_status,
                },
                status=status.HTTP_409_CONFLICT,
            )

        attempt = Attempt.objects.create(test=test, user=request.user)
        return Response(
            AttemptSerializer(attempt, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    # ── submit ───────────────────────────────────────────────

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

    # ── report ───────────────────────────────────────────────

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


# ─────────────────────────────────────────────────────────────
# Dashboard
# ─────────────────────────────────────────────────────────────

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
                "tests": TestAdminSerializer(
                    tests.order_by("-created_at")[:10],
                    many=True,
                    context={"request": request},
                ).data,
            }
        )