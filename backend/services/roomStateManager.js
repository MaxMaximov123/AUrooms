const roomStates = new Map(); // key: roomId, value: { queue, users, mainUserId }

export function initRoomState(roomId) {
  if (!roomStates.has(roomId)) {
    roomStates.set(roomId, {
      queue: [],
      users: {},
      mainUserId: null,
    });
  }
  return roomStates.get(roomId);
}

export function getRoomState(roomId) {
  return roomStates.get(roomId);
}

export function removeRoomState(roomId) {
  roomStates.delete(roomId);
}

export function addUserToRoom(roomId, userId, ws) {
  const room = initRoomState(roomId);
  room.users[userId] = { ws };
  if (!room.mainUserId) room.mainUserId = userId;
}

export function removeUserFromRoom(roomId, userId) {
  const room = getRoomState(roomId);
  if (!room) return;
  delete room.users[userId];
  if (Object.keys(room.users).length === 0) {
    removeRoomState(roomId);
  } else if (room.mainUserId === userId) {
    room.mainUserId = parseInt(Object.keys(room.users)[0]);
  }
}

export function broadcastToRoom(roomId, message) {
  const room = getRoomState(roomId);
  if (!room) return;
  Object.values(room.users).forEach(({ ws }) => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(message));
    }
  });
}