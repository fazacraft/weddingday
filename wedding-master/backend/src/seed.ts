/**
 * Lokal ishlab chiqish uchun boshlang'ich ma'lumot: demo foydalanuvchi va
 * fozilovlar (Django) saytidagi Feruz & Dilfuza taklifnomasi.
 *
 *   npm run seed -w backend
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User';
import { Invitation } from './models/Invitation';
import { saveUpload, uploadExists } from './storage';

const DEMO_EMAIL = 'demo@fozilovlar.uz';
// Repo ochiq — production'da parol faqat SEED_PASSWORD env orqali beriladi
const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? (process.env.NODE_ENV === 'production' ? '' : 'demo1234');
if (!DEMO_PASSWORD) throw new Error('SEED_PASSWORD must be set in production');
const SEED_PHOTO = 'seed-feruz-dilfuza.webp';
const DJANGO_PHOTO = path.resolve(__dirname, '../../../media/couple/kelin-kiyov_Irs7FLk.webp');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/wedding');

  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({
      name: 'Demo',
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
    });
  }

  // Django saytidagi kelin-kuyov surati (faqat lokalda mavjud) GridFS'ga yuklanadi
  let couplePhoto = '';
  if (await uploadExists(SEED_PHOTO)) {
    couplePhoto = `/uploads/${SEED_PHOTO}`;
  } else if (fs.existsSync(DJANGO_PHOTO)) {
    couplePhoto = await saveUpload(fs.readFileSync(DJANGO_PHOTO), 'image/webp', SEED_PHOTO);
  }

  await Invitation.findOneAndUpdate(
    { slug: 'feruz-dilfuza' },
    {
      owner: user._id,
      slug: 'feruz-dilfuza',
      template: 'anor',
      status: 'published',
      groomName: 'Feruz',
      brideName: 'Dilfuza',
      date: '2026-10-29',
      time: '17:00',
      eventTitle: "Fotiha to'yi",
      inviteText: "Sizni Fotiha to'yimizga taklif etamiz",
      greetingHeading: 'Aziz va qadrdon insonimiz!',
      greetingMessage: [
        "Hayotimizdagi eng baxtli kunlardan biri - to'yimizni siz bilan birga nishonlashni niyat qildik.",
        'Sizni ushbu kechamizga samimiy taklif etamiz.',
        "Quvonchli kunimizda aziz mehmonimiz bo'lishingizni intizorlik bilan kutamiz.",
      ].join('\n\n'),
      venueName: "Jahon to'yxonasi",
      venueAddress: 'Jizzah shahar',
      googleMapUrl:
        "https://www.google.com/maps/place/JAHON+to'yxona/@40.1347799,67.832079,687m/data=!3m2!1e3!4b1!4m6!3m5!1s0x38b295b783e5020b:0xce62b710199fe97f!8m2!3d40.1347758!4d67.8346539!16s%2Fg%2F11rkg15lpb?entry=t",
      yandexMapUrl: 'https://yandex.uz/maps/org/jahon_to_yxona/10130354302/?ll=67.822091%2C40.128344&z=13.1',
      schedule: [
        { time: '17:00', title: 'Fotiha marosimi ochilishi' },
        { time: '17:30', title: 'Ota-Onalar tabrigi' },
        { time: '18:00', title: 'Raqsga tushish' },
      ],
      couplePhoto,
      features: { wishes: true, rsvp: true, gift: false },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Seed tayyor: ${DEMO_EMAIL} → /feruz-dilfuza`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
