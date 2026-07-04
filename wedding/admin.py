from django import forms
from django.contrib import admin

from .models import Invitation, ScheduleEvent


class InvitationAdminForm(forms.ModelForm):
    class Meta:
        model = Invitation
        fields = "__all__"
        widgets = {
            "names_color": forms.TextInput(attrs={"type": "color"}),
            "heading_color": forms.TextInput(attrs={"type": "color"}),
            "accent_color": forms.TextInput(attrs={"type": "color"}),
            "text_color": forms.TextInput(attrs={"type": "color"}),
        }


class ScheduleEventInline(admin.TabularInline):
    model = ScheduleEvent
    extra = 1


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    form = InvitationAdminForm
    list_display = ("__str__", "wedding_datetime", "venue_name", "is_active")
    list_filter = ("is_active",)
    inlines = [ScheduleEventInline]
    fieldsets = (
        ("Kelin-kuyov", {
            "fields": ("groom_name", "bride_name", "wedding_datetime", "is_active"),
        }),
        ("Taklif matni", {
            "fields": ("greeting_heading", "greeting_message"),
        }),
        ("Konvert (kirish qismi)", {
            "fields": ("envelope_title", "envelope_script", "envelope_signature", "open_button_text"),
        }),
        ("To'y manzili", {
            "fields": ("venue_name", "venue_city", "venue_landmark", "yandex_map_url", "google_map_url"),
        }),
        ("Media (ixtiyoriy)", {
            "fields": ("groom_photo", "bride_photo", "couple_photo", "background_music"),
        }),
        ("Bezaklar", {
            "fields": ("horn_count",),
        }),
        ("Ranglar", {
            "fields": ("names_color", "heading_color", "accent_color", "text_color"),
        }),
    )
