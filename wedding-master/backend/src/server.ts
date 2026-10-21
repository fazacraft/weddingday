import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import app from './app';
import { initSocket } from './socket';

const PORT = Number(process.env.PORT ?? 5000);
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/wedding';

const httpServer = http.createServer(app);
initSocket(httpServer);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
