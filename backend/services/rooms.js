import { randomBytes } from 'crypto';
import db from '../db/knex.js';

export async function createRoom(ownerId) {
  const code = randomBytes(3).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [room] = await db('rooms')
    .insert({ owner_id: ownerId, code, expires_at: expiresAt })
    .returning(['id', 'code']);

  return room;
}

export async function getRoomByCode(code) {
  return db('rooms').where({ code }).first();
}

export async function getRoomById(id) {
  return db('rooms').where({ id }).first();
}

export async function updateRoomState(roomId, patch) {
  return db('rooms').where({ id: roomId }).update(patch);
}

export async function deleteExpiredRooms() {
  await db('rooms').where('expires_at', '<', new Date()).del();
}