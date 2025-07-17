import express from 'express';
import { createRoom, getRoomByCode } from '../services/rooms.js';
import db from '../db/knex.js';

const router = express.Router();

// POST /api/rooms — создать комнату
router.post('/', async (req, res) => {
  const { telegram_id } = req.body;
  if (!telegram_id) return res.status(400).json({ error: 'Missing telegram_id' });

  let user = await db('users').where({ telegram_id }).first();
  if (!user) {
    [user] = await db('users')
      .insert({ telegram_id })
      .returning('*');
  }

  const room = await createRoom(user.id);
  res.json(room); // { id, code }
});

// GET /api/rooms/:code — получить комнату по коду
router.get('/:code', async (req, res) => {
  const { code } = req.params;
  const room = await getRoomByCode(code);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

export default router;