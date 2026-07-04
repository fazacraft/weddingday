from django.urls import path

from .views import InvitationView

app_name = "wedding"

urlpatterns = [
    path("", InvitationView.as_view(), name="invitation"),
]
