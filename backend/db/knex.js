// 📁 backend/db/knex.js
import knex from 'knex';
import knexConfig from '../knexfile.js';
import config from '../config.js';

const db = knex(knexConfig[config.NODE_ENV || 'development']);

export default db;