from django.core.management.base import BaseCommand

from wedding.models import PHOTO_FIELDS, Invitation, compress_photo


class Command(BaseCommand):
    help = "Bazadagi mavjud taklifnoma rasmlarini WebP'ga siqadi"

    def handle(self, *args, **options):
        for invitation in Invitation.objects.all():
            changed = []
            for field_name in PHOTO_FIELDS:
                photo = getattr(invitation, field_name)
                if photo and compress_photo(photo):
                    changed.append(field_name)
            if changed:
                invitation.save(update_fields=changed)
                self.stdout.write(
                    self.style.SUCCESS(f"{invitation}: {', '.join(changed)} siqildi")
                )
            else:
                self.stdout.write(f"{invitation}: siqishga hojat yo'q")
