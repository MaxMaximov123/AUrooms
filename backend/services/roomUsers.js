// services/roomUsers.js
import db from '../db/knex.js';

export async function addRoomUser(roomId, userData) {
  return db('room_users')
    .insert({
      room_id: roomId,
      user_id: userData.user_id,
      name: userData.name,
      last_name: userData.last_name,
      photo_url: userData.photo_url,
      source: userData.source,
      username: userData.username || null,
    })
    .onConflict(['room_id', 'user_id'])
    .merge();
}

export async function removeRoomUser(roomId, userId) {
  return db('room_users')
    .where({ room_id: roomId, user_id: userId })
    .del();
}

export async function getRoomUsers(roomId) {
  return db('room_users')
    .where({ room_id: roomId })
    .orderBy('created_at', 'asc');
}