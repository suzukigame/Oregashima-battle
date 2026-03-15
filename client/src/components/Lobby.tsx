import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { HelpModal } from './HelpModal';

interface LobbyProps {
  socket: Socket | null;
  onJoinSuccess: (roomId: string, playerName: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ socket, onJoinSuccess }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

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
      <h1 className="lobby-title">Oregashima Battle Stadium!!</h1>
      
      <button className="manual-open-btn" onClick={() => setShowHelp(true)}>
        📖 遊び方・相性表
      </button>

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

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
};
