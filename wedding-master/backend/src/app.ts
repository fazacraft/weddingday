import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import invitationsRouter from './routes/invitations';
import publicRouter from './routes/public';
import uploadsRouter from './routes/uploads';
import { serveUpload } from './storage';
import { errorHandler } from './middleware/errorHandler';

/** Production'da frontend build'i ham shu serverdan beriladi (bitta Render servisi). */
const WEB_DIST = path.resolve(__dirname, '../../frontend/dist');

const app = express();

// Render/nginx ortida — haqiqiy protokol va IP X-Forwarded-* dan olinadi
app.set('trust proxy', 1);

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '200kb' }));

app.use('/api/auth', authRouter);
app.use('/api/invitations', invitationsRouter);
app.use('/api/public', publicRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.get('/uploads/:name', serveUpload);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (fs.existsSync(WEB_DIST)) {
  const indexHtml = path.join(WEB_DIST, 'index.html');
  app.use(
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
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexHtml);
  });
}

app.use(errorHandler);

export default app;
