import { getRoomByCode, updateRoomState } from '../services/rooms.js';
import { getTracksFromYandex, getTrackUrlYandex, wrappedApi } from '../services/yandex_music.js';
import { getTracksFromMuzlen } from '../services/muzlen_music.js';
import db from '../db/knex.js';

import {
  initRoomState,
  addUserToRoom,
  removeUserFromRoom,
  broadcastToRoom,
  getRoomState,
} from '../services/roomStateManager.js';

let nextUserId = 1;
const currentTimeBuffer = {}; // roomId -> [timestamps]

export function handleWSConnection(ws, req) {
  const urlParts = req.url.split('/');
  const roomCode = urlParts[urlParts.length - 1];

  getRoomByCode(roomCode).then(async (room) => {
    if (!room) {
      ws.close(1008, 'Room not found');
      return;
    }

    const roomId = room.id;
    const userId = nextUserId++;
    addUserToRoom(roomId, userId, ws);
    const state = initRoomState(roomId);

    // загрузка очереди из БД
    const dbQueue = await db('tracks').where({ room_id: roomId }).orderBy('order');
    state.queue = dbQueue.map((t) => ({
      src: t.src,
      currentTime: t.current_time,
      isPlaying: t.is_playing,
      coverUri: t.cover,
      title: t.title,
      artists: JSON.parse(t.artists),
      type: t.type
    }));

    console.log(`>> joinMusic`, state.queue);
    ws.send(JSON.stringify({ type: 'joinMusic', data: state.queue }));

    // Ping-pong keep-alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    ws.on('message', async (message) => {
      let parsed;
      try {
        parsed = JSON.parse(message);
      } catch (e) {
        return;
      }

      const { type, data } = parsed;

      console.log(`<< ${type} room: ${roomId}, user: ${userId}`, data ? data : '');

      switch (type) {
        case 'pong':
          // received pong from client
          break;
        case 'addMusicInQueue': {
          const queueLength = state.queue.length;

          state.queue.push({});
          let newTrack = {
            src: data.type === 'yandex' ? await getTrackUrlYandex(data.id) : data.src,
            currentTime: 0,
            isPlaying: queueLength === 0,
            coverUri: data.coverUri,
            title: data.title,
            artists: data.artists,
            type: data.type,
          };

          state.queue[queueLength] = newTrack;

          // сохранить в БД
          await db('tracks').insert({
            room_id: roomId,
            order: queueLength,
            track_id: data.id,
            title: newTrack.title,
            artists: JSON.stringify(newTrack.artists),
            src: newTrack.src,
            cover: newTrack.coverUri,
            type: newTrack.type,
            is_playing: newTrack.isPlaying,
            current_time: 0,
          });

          broadcastToRoom(roomId, { type: 'queueUpdated', data: newTrack });
          break;
        }

        case 'updateMusicCurrentTime':
          if (state.queue.length) {
            const time = data;
            state.queue[0].currentTime = time;

            await db('tracks')
              .where({ room_id: roomId })
              .andWhere('order', 0)
              .update({ current_time: time });

            await db('rooms').where({ id: roomId }).update({ current_time: time });

            broadcastToRoom(roomId, { type: 'musicCurrentTimeUpdated', data: time });
          }
          break;

        case 'updateMusicCurrentTimePing':
          if (state.queue.length) {
            const time = data;

            if (time - state.queue[0].currentTime < 5) {
              state.queue[0].currentTime = Math.max(state.queue[0].currentTime, time);
            }

            await db('tracks')
              .where({ room_id: roomId })
              .andWhere('order', 0)
              .update({ current_time: state.queue[0].currentTime });

            await db('rooms')
              .where({ id: roomId })
              .update({ current_time: state.queue[0].currentTime });
            

            const currentTrack = state.queue[0];
            if (currentTrack.duration && currentTrack.duration - currentTrack.currentTime <= 2) {
              console.log(`Track ${currentTrack.title} finished, moving to next...`);
              // Удаляем текущий трек из БД и очереди
              console.log(`Трек "${currentTrack.title}" закончился, переход к следующему...`);
              state.queue.shift();

              await db('tracks')
                .where({ room_id: roomId, order: 0 })
                .del();

              await db('tracks')
                .where({ room_id: roomId })
                .decrement('order', 1);

              // Включаем следующий трек, если он есть
              if (state.queue.length > 0) {
                state.queue[0].isPlaying = true;
                state.queue[0].currentTime = 0;
                await db('tracks')
                  .where({ room_id: roomId })
                  .andWhere('order', 0)
                  .update({ is_playing: true });
              }

              broadcastToRoom(roomId, { type: 'nextTrack' });
            }
          }
          break;

        case 'setTrackDuration': {
          if (state.queue.length) {
            state.queue[0].duration = data;

            await db('tracks')
              .where({ room_id: roomId })
              .andWhere('order', 0)
              .update({ duration: data });

            // отправка currentTime обратно инициатору

            // broadcastToRoom(roomId, {
            //   type: 'musicCurrentTimeUpdated',
            //   data: state.queue[0].currentTime
            // });
            ws.send(JSON.stringify({
              type: 'musicCurrentTimeUpdated',
              data: state.queue[0].currentTime
            }));
          }
          break;
        }

        case 'updateMusicIsPlaying':
          if (state.queue.length) {
            const isPlaying = data.isPlaying;
            state.queue[0].isPlaying = isPlaying;

            await db('tracks')
              .where({ room_id: roomId })
              .andWhere('order', 0)
              .update({ is_playing: isPlaying });

            await db('rooms').where({ id: roomId }).update({ is_playing: isPlaying });

            broadcastToRoom(roomId, { type: 'musicIsPlayingUpdated', data: {
              isPlaying, currentTime: state.queue[0].currentTime + 0.5
            } });
          }
          break;

        case 'nextTrack':
          console.log(`Переход к следующему треку в комнате ${roomCode}`);
          state.queue.shift();

          await db('tracks')
            .where({ room_id: roomId, order: 0 })
            .del();

          await db('tracks')
            .where({ room_id: roomId })
            .decrement('order', 1);

          if (state.queue.length > 0) {
            state.queue[0].isPlaying = true;
            await db('tracks')
              .where({ room_id: roomId })
              .andWhere('order', 0)
              .update({ is_playing: true });
          }

          broadcastToRoom(roomId, { type: 'nextTrack' });
          break;

        case 'joinMusic':
          ws.send(JSON.stringify({ type: 'joinMusic', data: state.queue }));
          break;

        case 'searchMusic': {
          try {
            const [muzlen, yandex] = await Promise.all([
              getTracksFromMuzlen(data),
              getTracksFromYandex(data),
            ]);
            const results = [...yandex, ...muzlen];
            ws.send(JSON.stringify({ type: 'searchMusic', data: results }));
          } catch (err) {
            console.error('searchMusic error:', err);
            ws.send(JSON.stringify({ type: 'searchMusic', data: [] }));
          }
          break;
        }

        default:
          break;
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      removeUserFromRoom(roomId, userId);
      console.log(`User #${userId} disconnected from room ${roomCode}`);
    });

    ws.on('error', (err) => {
      clearInterval(pingInterval);
      console.warn(`WebSocket error (user #${userId}):`, err.message);
    });
  });
}
