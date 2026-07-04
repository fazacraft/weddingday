import calendar

from django.db.models import F
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.views.generic import TemplateView

from .models import Invitation

UZ_MONTHS = [
    "", "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
]
UZ_WEEKDAYS = ["DU", "SE", "CHOR", "PAY", "JU", "SHA", "YA"]


def build_month_grid(target_date):
    cal = calendar.Calendar(firstweekday=0)
    weeks = cal.monthdayscalendar(target_date.year, target_date.month)
    return [
        [
            {"day": day, "is_wedding_day": day == target_date.day}
            for day in week
        ]
        for week in weeks
    ]


def text_color_vars(invitation):
    """Modeldagi c_* rang maydonlarini CSS --c-... o'zgaruvchilariga aylantiradi."""
    return {
        f"--{field.name.replace('_', '-')}": getattr(invitation, field.name)
        for field in invitation._meta.fields
        if field.name.startswith("c_")
    }


def build_horn_fan(count):
    """Karnaylar soniga qarab yelpig'ich burchaklarini hisoblaydi.

    Yelpig'ich markazi 14 gradusda, umumiy yoyilish esa 28 gradusdan oshmaydi.
    Lokalizatsiya vergul qo'ymasligi uchun qiymatlar satr ko'rinishida qaytadi.
    """
    if not count:
        return []
    if count == 1:
        angles = [14.0]
    else:
        spread = min(14.0 * (count - 1), 28.0)
        start = 14.0 - spread / 2
        step = spread / (count - 1)
        angles = [start + i * step for i in range(count)]
    return [
        {"angle": f"{angle:g}", "delay": f"{0.9 + i * 0.15:g}"}
        for i, angle in enumerate(angles)
    ]


@csrf_exempt
@require_POST
def count_open(request):
    """OCHISH tugmasi bosilganda hisoblagichni oshiradi (poyga holatisiz, F() bilan)."""
    updated = Invitation.objects.filter(is_active=True).update(
        open_count=F("open_count") + 1
    )
    return JsonResponse({"ok": bool(updated)})


class InvitationView(TemplateView):
    template_name = "wedding/invitation.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        invitation = Invitation.objects.filter(is_active=True).first()
        context["invitation"] = invitation

        if invitation:
            local_wedding_date = timezone.localtime(invitation.wedding_datetime)
            context["wedding_datetime_iso"] = local_wedding_date.isoformat()
            context["month_label"] = f"{UZ_MONTHS[local_wedding_date.month]}, {local_wedding_date.year}"
            context["weekday_labels"] = UZ_WEEKDAYS
            context["calendar_weeks"] = build_month_grid(local_wedding_date)
            context["greeting_paragraphs"] = [
                paragraph for paragraph in invitation.greeting_message.split("\n\n") if paragraph.strip()
            ]

            schedule_events = list(invitation.schedule_events.all())
            context["schedule_events"] = schedule_events
            # O'rtadagi bandda romb o'rniga gul chiqadi
            context["schedule_flower_index"] = (len(schedule_events) + 1) // 2

            context["horns"] = build_horn_fan(invitation.horn_count)
            context["envelope_title_lines"] = [
                line.strip() for line in invitation.envelope_title.splitlines() if line.strip()
            ]
            context["text_colors"] = text_color_vars(invitation)

        return context
