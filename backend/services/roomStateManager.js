const roomStates = new Map(); // key: roomId, value: { queue, users, mainUserId }

export function initRoomState(roomId) {
  if (!roomStates.has(roomId)) {
    roomStates.set(roomId, {
      queue: [],
      users: {}, // Теперь будет хранить полные данные пользователей
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

export function addUserToRoom(roomId, userId, ws, userData = {}) {
  const room = initRoomState(roomId);
  
  // Сохраняем все данные пользователя
  room.users[userId] = { 
    ws,
    id: userId,
    isTgUser: userData.isTgUser || false,
    name: userData.name || `User ${userId}`,
    lastName: userData.lastName || '',
    photoUrl: userData.photoUrl || null,
    joinedAt: new Date()
  };
  
  if (!room.mainUserId) {
    room.mainUserId = userId;
  }
  
  return room.users[userId];
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
    if (ws.readyState === 1) { // 1 = OPEN
      ws.send(JSON.stringify(message));
    }
  });
}

// Новая функция для получения списка пользователей комнаты
export function getRoomUsers(roomId) {
  const room = getRoomState(roomId);
  if (!room) return [];
  
  return Object.values(room.users).map(user => ({
    id: user.id,
    is_tg_user: user.isTgUser,
    name: user.name,
    last_name: user.lastName,
    photo_url: user.photoUrl,
    joined_at: user.joinedAt
  }));
}

// Новая функция для обновления данных пользователя
export function updateUserData(roomId, userId, data) {
  const room = getRoomState(roomId);
  if (!room || !room.users[userId]) return;
  
  room.users[userId] = { ...room.users[userId], ...data };
}