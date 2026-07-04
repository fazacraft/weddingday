from django.urls import path

from .views import InvitationView, count_open

app_name = "wedding"

urlpatterns = [
    path("", InvitationView.as_view(), name="invitation"),
    path("ochildi/", count_open, name="count-open"),
]
