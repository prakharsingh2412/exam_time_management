from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TestViewSet, AttemptViewSet, DashboardSummaryView

router = DefaultRouter()
router.register(r"tests", TestViewSet, basename="test")
router.register(r"attempts", AttemptViewSet, basename="attempt")

urlpatterns = [
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("", include(router.urls)),
]