from rest_framework import serializers
from .models import Test, Attempt


class TestSerializer(serializers.ModelSerializer):
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
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "pdf_url", "answer_key"]

    def get_pdf_url(self, obj):
        request = self.context.get("request")
        if obj.pdf and request:
            return request.build_absolute_uri(obj.pdf.url)
        return None


class AnswerKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = Test
        fields = ["answer_key"]


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
    responses = serializers.DictField(
        child=serializers.CharField(allow_null=True, allow_blank=True)
    )
    marked = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )
    time_per_q = serializers.DictField(
        child=serializers.IntegerField(), required=False, default=dict
    )