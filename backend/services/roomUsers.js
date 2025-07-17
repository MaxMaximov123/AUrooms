import db from '../db/knex.js';

export async function addRoomUser(roomId, userData) {
  return db('room_users').insert({
    room_id: roomId,
    user_id: userData.id,
    name: userData.name,
    last_name: userData.lastName,
    photo_url: userData.photoUrl,
    is_telegram: userData.isTelegram,
    joined_at: db.fn.now()
  });
}

export async function removeRoomUser(roomId, userId) {
  return db('room_users')
    .where({ room_id: roomId, user_id: userId })
    .del();
}

export async function getRoomUsers(roomId) {
  return db('room_users')
    .where({ room_id: roomId })
    .orderBy('joined_at', 'asc');
}