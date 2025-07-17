import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default {
  NODE_ENV: process.env.NODE_ENV || 'development',

  PORT: process.env.PORT || 8000,

  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgres@db:5432/music_app',

  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_BOT_URL: process.env.TELEGRAM_BOT_URL || '',

  // Время жизни комнаты (в миллисекундах)
  ROOM_TTL: parseInt(process.env.ROOM_TTL, 10) || 24 * 60 * 60 * 1000, // 24ч
};