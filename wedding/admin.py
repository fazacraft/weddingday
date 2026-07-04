from django.contrib import admin

from .models import Invitation, ScheduleEvent


class ScheduleEventInline(admin.TabularInline):
    model = ScheduleEvent
    extra = 1


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
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
        ("To'y manzili", {
            "fields": ("venue_name", "venue_city", "venue_landmark", "yandex_map_url", "google_map_url"),
        }),
        ("Media (ixtiyoriy)", {
            "fields": ("groom_photo", "bride_photo", "couple_photo", "background_music"),
        }),
        ("Bezaklar", {
            "fields": ("horn_count",),
        }),
    )
