from django.urls import path

from .views import InvitationView, count_open

app_name = "wedding"

urlpatterns = [
    path("", InvitationView.as_view(), name="invitation"),
    path("ochildi/", count_open, name="count-open"),
    path("<slug:slug>/", InvitationView.as_view(), name="invitation-by-slug"),
    path("<slug:slug>/ochildi/", count_open, name="count-open-slug"),
]
