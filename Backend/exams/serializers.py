from rest_framework import serializers

from .models import Test, Question, Attempt


# ─────────────────────────────────────────────────────────────
# Test
# ─────────────────────────────────────────────────────────────

class TestPublicSerializer(serializers.ModelSerializer):
    """
    Safe for examinees during an exam.
    Includes pdf_url so the exam room can embed the original PDF if needed,
    but NOT answer_key.
    """
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = [
            "id",
            "name",
            "duration_sec",
            "total_questions",
            "marks_per_q",
            "negative_marks",
            "pdf_url",
            "parsing_status",
            "created_at",
        ]
        read_only_fields = fields

    def get_pdf_url(self, obj):
        if obj.pdf and obj.pdf.name:
            return obj.pdf.url  # → "/media/pdfs/…"
        return None


class TestAdminSerializer(serializers.ModelSerializer):
    """
    Full serializer for staff/owner — includes answer_key and the raw pdf file.
    """
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = [
            "id",
            "name",
            "duration_sec",
            "total_questions",
            "marks_per_q",
            "negative_marks",
            "pdf",
            "pdf_url",
            "answer_key",
            "parsing_status",
            "parsing_error",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "pdf_url",
            "parsing_status",
            "parsing_error",
        ]

    def get_pdf_url(self, obj):
        if obj.pdf and obj.pdf.name:
            return obj.pdf.url
        return None


class AnswerKeySerializer(serializers.ModelSerializer):
    """Owned by staff — returns just the answer_key."""
    class Meta:
        model = Test
        fields = ["answer_key"]


# ─────────────────────────────────────────────────────────────
# Question
# ─────────────────────────────────────────────────────────────

class QuestionPublicSerializer(serializers.ModelSerializer):
    """
    What an examinee sees per question. Deliberately omits `correct`.
    """
    class Meta:
        model = Question
        fields = [
            "number",
            "text",
            "option_a",
            "option_b",
            "option_c",
            "option_d",
        ]
        read_only_fields = fields


class QuestionAdminSerializer(serializers.ModelSerializer):
    """Includes `correct` — staff only."""
    class Meta:
        model = Question
        fields = [
            "id",
            "number",
            "text",
            "option_a",
            "option_b",
            "option_c",
            "option_d",
            "correct",
        ]


# ─────────────────────────────────────────────────────────────
# Attempt
# ─────────────────────────────────────────────────────────────

class AttemptSerializer(serializers.ModelSerializer):
    test_name = serializers.CharField(source="test.name", read_only=True)

    class Meta:
        model = Attempt
        fields = [
            "id",
            "test",
            "test_name",
            "responses",
            "marked",
            "time_per_q",
            "score",
            "correct",
            "wrong",
            "skipped",
            "started_at",
            "submitted_at",
        ]
        read_only_fields = [
            "id",
            "test_name",
            "score",
            "correct",
            "wrong",
            "skipped",
            "started_at",
            "submitted_at",
        ]


class SubmitSerializer(serializers.Serializer):
    """Validates the body of POST /attempts/<id>/submit/."""
    responses = serializers.DictField(
        child=serializers.CharField(allow_null=True, allow_blank=True),
        default=dict,
    )
    marked = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )
    time_per_q = serializers.DictField(
        child=serializers.IntegerField(), required=False, default=dict
    )