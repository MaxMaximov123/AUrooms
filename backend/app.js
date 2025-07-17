import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import { WebSocketServer } from 'ws';

import config from './config.js';
import roomsRouter from './routes/rooms.js';
import tracksRouter from './routes/tracks.js';
import { handleWSConnection } from './ws/wsHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// REST API
app.use('/api/rooms', roomsRouter);
app.use('/api/tracks', tracksRouter);

// Статический frontend
const frontendDist = path.join(__dirname, '../frontend/dist/spa');
app.use(express.static(frontendDist));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// WebSocket
wss.on('connection', handleWSConnection);

server.listen(config.PORT, () => {
  console.log(`Server listening on http://localhost:${config.PORT}`);
});