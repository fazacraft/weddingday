from django.core.exceptions import ValidationError
from django.db import models


class Invitation(models.Model):
    groom_name = models.CharField(max_length=100, default="Kuyov")
    bride_name = models.CharField(max_length=100, default="Kelin")

    wedding_datetime = models.DateTimeField(
        help_text="To'y boshlanish sanasi va vaqti"
    )

    greeting_heading = models.CharField(
        max_length=200,
        default="Aziz va qadrdon insonimiz!",
        help_text="Taklifnoma ochilgach chiqadigan sarlavha",
    )
    greeting_message = models.TextField(
        default=(
            "Hayotimizdagi eng baxtli kunlardan biri - to'yimizni siz bilan "
            "birga nishonlashni niyat qildik.\n\n"
            "Sizni ushbu kechamizga samimiy taklif etamiz.\n\n"
            "Quvonchli kunimizda aziz mehmonimiz bo'lishingizni intizorlik "
            "bilan kutamiz."
        ),
        help_text="Har bir bo'sh qatordan keyin yangi paragraf boshlanadi",
    )

    envelope_title = models.TextField(
        default="Siz\nTo'yimizga",
        verbose_name="Konvertdagi qalin matn",
        help_text="Har bir satr konvertda alohida qatorda, katta harflarda chiqadi",
    )
    envelope_script = models.CharField(
        max_length=120,
        default="taklif etilgansiz",
        verbose_name="Konvertdagi yozma matn",
        help_text="Qalin matn ostidagi kursiv qizil yozuv",
    )
    envelope_signature = models.CharField(
        max_length=120,
        default="muhabbat ila,",
        verbose_name="Konvert imzosi",
        help_text="Konvert pastidagi yozuv - ostida kelin-kuyov ismlari avtomatik chiqadi",
    )
    open_button_text = models.CharField(
        max_length=30,
        default="Ochish",
        verbose_name="Ochish tugmasi matni",
    )

    venue_name = models.CharField(max_length=200, default="To'yxona nomi")
    venue_city = models.CharField(max_length=120, default="Shahar")
    venue_landmark = models.CharField(
        max_length=250,
        blank=True,
        help_text="Mo'ljal, masalan: Qarshi-Beshkent yo'li, TATU Qarshi filiali",
    )
    yandex_map_url = models.URLField(blank=True)
    google_map_url = models.URLField(blank=True)

    couple_photo = models.ImageField(
        upload_to="couple/", blank=True, null=True,
        help_text="Kelin-kuyov birga tushgan surat (ixtiyoriy)",
    )
    groom_photo = models.ImageField(
        upload_to="couple/", blank=True, null=True,
        help_text="Kuyov portreti (ixtiyoriy)",
    )
    bride_photo = models.ImageField(
        upload_to="couple/", blank=True, null=True,
        help_text="Kelin portreti (ixtiyoriy)",
    )
    background_music = models.FileField(
        upload_to="music/", blank=True, null=True,
        help_text="Fon musiqasi mp3 fayli (ixtiyoriy, keyinroq qo'shsa ham bo'ladi)",
    )

    horn_count = models.PositiveSmallIntegerField(
        default=3,
        choices=[
            (0, "Ko'rsatilmasin"),
            (1, "1 ta"),
            (2, "2 ta"),
            (3, "3 ta"),
            (4, "4 ta"),
        ],
        verbose_name="Karnaylar soni",
        help_text="Ismlar yonidagi karnaylar soni (har tomonda)",
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Saytda aynan shu taklifnoma ko'rsatilsin",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Taklifnoma"
        verbose_name_plural = "Taklifnomalar"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.groom_name} va {self.bride_name}"

    def clean(self):
        if self.is_active:
            conflicting = Invitation.objects.filter(is_active=True).exclude(pk=self.pk)
            if conflicting.exists():
                raise ValidationError(
                    "Bir vaqtning o'zida faqat bitta taklifnoma faol bo'lishi mumkin. "
                    "Avval boshqasini nofaol qiling."
                )


class ScheduleEvent(models.Model):
    invitation = models.ForeignKey(
        Invitation,
        on_delete=models.CASCADE,
        related_name="schedule_events",
        verbose_name="Taklifnoma",
    )
    time = models.TimeField(
        verbose_name="Vaqti",
        help_text="Tadbir boshlanish vaqti, masalan 18:00",
    )
    title = models.CharField(
        max_length=150,
        verbose_name="Tadbir nomi",
        help_text="Masalan: Nikoh marosimi",
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Tartib",
        help_text="Odatda tegmasangiz ham bo'ladi - vaqt bo'yicha saralanadi",
    )

    class Meta:
        verbose_name = "Dastur bandi"
        verbose_name_plural = "To'y dasturi"
        ordering = ["order", "time"]

    def __str__(self):
        return f"{self.time:%H:%M} — {self.title}"
