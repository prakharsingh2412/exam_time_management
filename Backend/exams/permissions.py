from rest_framework.permissions import BasePermission


class IsOwnerStrict(BasePermission):
    """
    Object-level permission: only the owner may access the object,
    for ALL methods (including GET).

    Relies on the model exposing `owner_id` — either directly
    (Test.owner_id) or via a property alias (Attempt.owner_id -> user_id).
    """

    def has_object_permission(self, request, view, obj):
        owner_id = getattr(obj, "owner_id", None)
        if owner_id is None:
            return False
        return owner_id == request.user.id