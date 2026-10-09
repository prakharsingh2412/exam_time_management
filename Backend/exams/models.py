from django.conf import settings
from django.db import models


class Test(models.Model):
    id = models.BigAutoField(primary_key=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tests",
    )
    name = models.CharField(max_length=200)
    duration_sec = models.PositiveIntegerField()
    total_questions = models.PositiveIntegerField()
    marks_per_q = models.DecimalField(max_digits=5, decimal_places=2, default=1)
    negative_marks = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    pdf = models.FileField(upload_to="pdfs/")
    answer_key = models.JSONField(default=dict, blank=True)

    parsing_status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("parsing", "Parsing"),
            ("done", "Done"),
            ("failed", "Failed"),
        ],
        default="pending",
        db_index=True,
    )
    parsing_error = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Question(models.Model):
    test = models.ForeignKey(
        Test, related_name="questions", on_delete=models.CASCADE
    )
    number = models.PositiveIntegerField()
    text = models.TextField()
    option_a = models.CharField(max_length=1000, blank=True, default="")
    option_b = models.CharField(max_length=1000, blank=True, default="")
    option_c = models.CharField(max_length=1000, blank=True, default="")
    option_d = models.CharField(max_length=1000, blank=True, default="")
    correct = models.CharField(
        max_length=1,
        choices=[("A", "A"), ("B", "B"), ("C", "C"), ("D", "D")],
        blank=True,
        default="",
    )

    class Meta:
        unique_together = ("test", "number")
        ordering = ["number"]
        indexes = [models.Index(fields=["test", "number"])]

    def __str__(self):
        return f"{self.test_id} #{self.number}"


class Attempt(models.Model):
    id = models.BigAutoField(primary_key=True)
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name="attempts")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="attempts",
    )
    responses = models.JSONField(default=dict, blank=True)
    marked = models.JSONField(default=list, blank=True)
    time_per_q = models.JSONField(default=dict, blank=True)

    score = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    correct = models.PositiveIntegerField(default=0)
    wrong = models.PositiveIntegerField(default=0)
    skipped = models.PositiveIntegerField(default=0)

    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.user} - {self.test.name} - {self.id}"

    @property
    def owner_id(self):
        return self.user_id