import { Server, Socket } from 'socket.io';
import { BattleEngine, BattleSnapshot } from '../engine/BattleEngine';

export interface Player {
  id: string;
  name: string;
  roomId: string;
  isReady: boolean;
  selectedCharacterIds: string[];
}

export interface Room {
  id: string;
  players: Player[];
  status: 'LOBBY' | 'TEAM_SELECT' | 'BATTLE';
  engine?: BattleEngine;
}

export class RoomManager {
  private io: Server;
  private rooms: Map<string, Room> = new Map();
  private players: Map<string, Player> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  joinRoom(socket: Socket, roomId: string, playerName: string) {
    const existingPlayer = this.players.get(socket.id);
    if (existingPlayer) return;

    let room = this.rooms.get(roomId);
    if (!room) {
      room = { id: roomId, players: [], status: 'LOBBY' };
      this.rooms.set(roomId, room);
    }

    if (room.players.length >= 2) {
      socket.emit('error', 'Room is full');
      return;
    }

    const player: Player = {
      id: socket.id,
      name: playerName,
      roomId,
      isReady: false,
      selectedCharacterIds: []
    };

    room.players.push(player);
    this.players.set(socket.id, player);
    socket.join(roomId);

    this.io.to(roomId).emit('room_update', room);

    if (room.players.length === 2 && room.status === 'LOBBY') {
      room.status = 'TEAM_SELECT';
      this.io.to(roomId).emit('room_update', room);
    }
  }

  playerReadyWithTeam(socketId: string, characterIds: string[]) {
    const player = this.players.get(socketId);
    if (!player) return;

    const room = this.rooms.get(player.roomId);
    if (!room || room.status !== 'TEAM_SELECT') return;

    player.isReady = true;
    player.selectedCharacterIds = characterIds;

    this.io.to(room.id).emit('room_update', room);

    if (room.players.length === 2 && room.players.every(p => p.isReady)) {
      room.status = 'BATTLE';
      this.io.to(room.id).emit('room_update', room);

      // バトルエンジン初期化
      const engine = new BattleEngine(room.players[0], room.players[1]);
      room.engine = engine;

      const snapshot = engine.getSnapshot();

      // 各プレイヤーにスナップショットと自分の技リストを送信
      for (const p of room.players) {
        const playerMoves = engine.getMovesForPlayer(p.id);
        this.io.to(p.id).emit('battle_start', { snapshot, moves: playerMoves, playerId: p.id });
      }
    }
  }

  submitBattleAction(socketId: string, action: { type: 'MOVE'; moveId: string } | { type: 'SWITCH'; index: number }) {
    const player = this.players.get(socketId);
    if (!player) return;

    const room = this.rooms.get(player.roomId);
    if (!room || !room.engine) return;

    const result = room.engine.submitAction(socketId, action);

    if (result) {
      // ターン結果（イベント配列 + 最終スナップショット）を送信
      for (const p of room.players) {
        const playerMoves = room.engine.getMovesForPlayer(p.id);
        this.io.to(p.id).emit('battle_update', { events: result.events, snapshot: result.snapshot, moves: playerMoves });
      }
    } else {
      this.io.to(socketId).emit('action_accepted');
    }
  }

  handleDisconnect(socketId: string) {
    const player = this.players.get(socketId);
    if (!player) return;

    const room = this.rooms.get(player.roomId);
    if (room) {
      room.players = room.players.filter(p => p.id !== socketId);
      if (room.players.length === 0) {
        this.rooms.delete(room.id);
      } else {
        room.status = 'LOBBY';
        room.engine = undefined;
        room.players.forEach(p => { p.isReady = false; p.selectedCharacterIds = []; });
        this.io.to(room.id).emit('player_left', player.name);
        this.io.to(room.id).emit('room_update', room);
      }
    }
    this.players.delete(socketId);
  }
}
