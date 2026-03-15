import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { RoomManager } from './rooms/RoomManager';
import { characters } from './data/characters';
import { moves } from './data/moves';

dotenv.config();

const app = express();
app.use(cors());

app.get('/api/characters', (_req, res) => {
  res.json(characters);
});

app.get('/api/moves', (_req, res) => {
  res.json(moves);
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager(io);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', (roomId: string, playerName: string) => {
    roomManager.joinRoom(socket, roomId, playerName);
  });

  socket.on('team_select_ready', (characterIds: string[]) => {
    roomManager.playerReadyWithTeam(socket.id, characterIds);
  });

  socket.on('battle_action', (action: { type: 'MOVE'; moveId: string } | { type: 'SWITCH'; index: number }) => {
    roomManager.submitBattleAction(socket.id, action);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    roomManager.handleDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
