// 📁 backend/knexfile.js
import config from './config.js';

export default {
  development: {
    client: 'pg',
    connection: config.DATABASE_URL,
    migrations: {
      directory: './db/migrations',
      extension: 'js',
    },
    useNullAsDefault: true,
  },
};