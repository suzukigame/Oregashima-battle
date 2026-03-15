import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import type { Room, CharacterData } from '../types';

interface Props {
  room: Room;
  playerName: string;
  socket: Socket;
}

export const TeamSelect: React.FC<Props> = ({ room, playerName, socket }) => {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const me = room.players.find(p => p.name === playerName);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/characters`)
      .then(res => res.json())
      .then(data => setCharacters(data));
  }, []);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id));
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds(prev => [...prev, id]);
      }
    }
  };

  const handleReady = () => {
    if (selectedIds.length === 3) {
      socket.emit('team_select_ready', selectedIds);
    }
  };

  if (me?.isReady) {
    return <div className="waiting-screen">相手の選択を待機中...</div>;
  }

  return (
    <div className="team-select">
      <h2>パーティ編成 (3体選択)</h2>
      <div className="char-list">
        {characters.filter(c => !c.hiddenInSelect).map(c => (
          <div 
            key={c.id} 
            className={`char-card ${selectedIds.includes(c.id) ? 'selected' : ''}`}
            onClick={() => toggleSelect(c.id)}
          >
            <h3>{c.name}</h3>
            <p>{c.mentalType} / {c.elementalType}</p>
          </div>
        ))}
      </div>
      <button disabled={selectedIds.length !== 3} onClick={handleReady}>
        決定して準備完了
      </button>
    </div>
  );
};
