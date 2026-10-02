from rest_framework.routers import DefaultRouter
from .views import TestViewSet, AttemptViewSet

router = DefaultRouter()
router.register(r"tests", TestViewSet, basename="test")
router.register(r"attempts", AttemptViewSet, basename="attempt")

urlpatterns = router.urls