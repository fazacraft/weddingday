import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import invitationsRouter from './routes/invitations';
import publicRouter from './routes/public';
import uploadsRouter from './routes/uploads';
import adminRouter from './routes/admin';
import telegramRouter from './routes/telegram';
import { serveUpload } from './storage';
import { errorHandler } from './middleware/errorHandler';

/** Production'da frontend build'i ham shu serverdan beriladi (bitta Render servisi). */
const WEB_DIST = path.resolve(__dirname, '../../frontend/dist');

/** Sayt domen ichidagi yo'lda ham ishlay oladi: BASE_PATH=/erbotayev → beluga.uz/erbotayev */
export const BASE_PATH = (process.env.BASE_PATH ?? '').replace(/\/+$/, '');

const app = express();
const site = express.Router();

// Render/nginx ortida — haqiqiy protokol va IP X-Forwarded-* dan olinadi
app.set('trust proxy', 1);

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

site.use(express.json({ limit: '200kb' }));

site.use('/api/auth', authRouter);
site.use('/api/invitations', invitationsRouter);
site.use('/api/public', publicRouter);
site.use('/api/uploads', uploadsRouter);
site.use('/api/admin', adminRouter);
site.use('/api/telegram', telegramRouter);
site.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

site.get('/uploads/:name', serveUpload);

site.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (fs.existsSync(WEB_DIST)) {
  const indexHtml = path.join(WEB_DIST, 'index.html');
  site.use(
    express.static(WEB_DIST, {
      index: false,
      maxAge: '7d',
      setHeaders: (res, filePath) => {
        // Vite build fayllari nomida hash bor — o'zgarmaydi
        if (/[\\/]assets[\\/].+-[A-Za-z0-9_-]{8}\.(js|css)$/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );
  // SPA: /feruz-dilfuza, /kabinet va h.k. — marshrutlash React'da
  site.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexHtml);
  });
}

app.use(BASE_PATH || '/', site);

// Sayt ichki yo'lda bo'lsa, domen ildizi (beluga.uz/) shu yo'lga yo'naltiriladi
if (BASE_PATH) {
  app.get('/', (_req, res) => res.redirect(302, `${BASE_PATH}/`));
}

app.use(errorHandler);

export default app;
