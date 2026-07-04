from django import forms
from django.contrib import admin

from .models import Invitation, ScheduleEvent


class InvitationAdminForm(forms.ModelForm):
    class Meta:
        model = Invitation
        fields = "__all__"
        # Barcha c_* rang maydonlariga brauzerning rang tanlagichi
        widgets = {
            field.name: forms.TextInput(attrs={"type": "color"})
            for field in Invitation._meta.fields
            if field.name.startswith("c_")
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
        ("Ranglar: Konvert", {
            "classes": ("collapse",),
            "fields": ("c_env_title", "c_env_script", "c_env_sign", "c_env_sign_names", "c_seal_text"),
        }),
        ("Ranglar: Bosh sahifa", {
            "classes": ("collapse",),
            "fields": ("c_hero_names", "c_hero_va", "c_scroll_hint"),
        }),
        ("Ranglar: Taklif matni", {
            "classes": ("collapse",),
            "fields": ("c_greeting_title", "c_greeting_text"),
        }),
        ("Ranglar: Kalendar", {
            "classes": ("collapse",),
            "fields": ("c_cal_month", "c_cal_weekdays", "c_cal_days", "c_cal_wday_text", "c_cal_wday_bg"),
        }),
        ("Ranglar: To'y dasturi", {
            "classes": ("collapse",),
            "fields": ("c_sch_title", "c_sch_time", "c_sch_event"),
        }),
        ("Ranglar: Manzil", {
            "classes": ("collapse",),
            "fields": ("c_loc_title", "c_loc_venue", "c_loc_address", "c_map_link"),
        }),
        ("Ranglar: Sanoq", {
            "classes": ("collapse",),
            "fields": ("c_cd_title", "c_cd_numbers", "c_cd_labels", "c_cd_message"),
        }),
    )
