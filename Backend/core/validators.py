from django.core.exceptions import ValidationError


def validate_positive(value):
    if value <= 0:
        raise ValidationError("Value must be positive.")


def validate_answer_key(value):
    """Validates {"1":"A","2":"B",...} shape."""
    if not isinstance(value, dict):
        raise ValidationError("Answer key must be a JSON object.")
    for k, v in value.items():
        if not str(k).isdigit():
            raise ValidationError(f"Key '{k}' must be numeric.")
        if not isinstance(v, str) or len(v) > 5:
            raise ValidationError(f"Answer for Q{k} must be a short string.")