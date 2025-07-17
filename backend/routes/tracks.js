import express from 'express';
import db from '../db/knex.js';

const router = express.Router();

// GET /api/tracks/:room_id — очередь треков в комнате
router.get('/:room_id', async (req, res) => {
  const tracks = await db('tracks')
    .where({ room_id: req.params.room_id })
    .orderBy('order');
  res.json(tracks);
});

// POST /api/tracks — добавить трек в комнату
router.post('/', async (req, res) => {
  const { room_id, title, artists, src, cover, type } = req.body;

  const count = await db('tracks').where({ room_id }).count('id');
  const order = parseInt(count[0].count, 10);

  const [track] = await db('tracks')
    .insert({
      room_id,
      order,
      title,
      artists: JSON.stringify(artists),
      src,
      cover,
      type,
      is_playing: order === 0,
    })
    .returning('*');

  res.json(track);
});

export default router;