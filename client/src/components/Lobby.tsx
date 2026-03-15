import React, { useState } from 'react';
import { Socket } from 'socket.io-client';

interface LobbyProps {
  socket: Socket | null;
  onJoinSuccess: (roomId: string, playerName: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ socket, onJoinSuccess }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket) {
      setError('サーバーに接続できません');
      return;
    }
    if (!playerName.trim() || !roomId.trim()) {
      setError('名前とルームIDを入力してください');
      return;
    }

    socket.emit('join_room', roomId, playerName);
    onJoinSuccess(roomId, playerName);
  };

  return (
    <div className="lobby-container">
      <h1>Oregashima Battle Stadium!!</h1>
      <form onSubmit={handleJoin} className="lobby-form">
        <div className="form-group">
          <label>プレイヤー名</label>
          <input 
            type="text" 
            value={playerName} 
            onChange={e => setPlayerName(e.target.value)} 
            placeholder="名前を入力..." 
          />
        </div>
        <div className="form-group">
          <label>ルームID</label>
          <input 
            type="text" 
            value={roomId} 
            onChange={e => setRoomId(e.target.value)} 
            placeholder="1234 等" 
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">ルームに入室</button>
      </form>
    </div>
  );
};
