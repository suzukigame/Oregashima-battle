import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import type { Room, CharacterData } from '../types';
import { HelpModal } from './HelpModal';

interface Props {
  room: Room;
  playerName: string;
  socket: Socket;
}

interface MoveDetail {
  id: string;
  name: string;
  type: string;
  power: number;
  description: string;
}

export const TeamSelect: React.FC<Props> = ({ room, playerName, socket }) => {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [moves, setMoves] = useState<Record<string, MoveDetail>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const me = room.players.find(p => p.name === playerName);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    // キャラクター取得
    fetch(`${apiUrl}/api/characters`)
      .then(res => res.json())
      .then(data => setCharacters(data));
      
    // 技データ取得
    fetch(`${apiUrl}/api/moves`)
      .then(res => res.json())
      .then(data => {
        const map: Record<string, MoveDetail> = {};
        data.forEach((m: MoveDetail) => {
          map[m.id] = m;
        });
        setMoves(map);
      });
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>パーティ編成 (3体選択)</h2>
        <button className="manual-open-btn" style={{ marginBottom: 0 }} onClick={() => setShowHelp(true)}>
          📖 遊び方
        </button>
      </div>

      <div className="char-list">
        {characters.filter(c => !c.hiddenInSelect).map(c => (
          <div 
            key={c.id} 
            className={`char-card ${selectedIds.includes(c.id) ? 'selected' : ''}`}
            onClick={() => toggleSelect(c.id)}
            style={{ position: 'relative' }}
          >
            {/* ホバー詳細 */}
            <div className="char-overlay">
              <div className="overlay-stats">
                <div className="stat-item"><span className="stat-label">HP</span><span>{c.baseStats.hp}</span></div>
                <div className="stat-item"><span className="stat-label">ATK</span><span>{c.baseStats.atk}</span></div>
                <div className="stat-item"><span className="stat-label">DEF</span><span>{c.baseStats.def}</span></div>
                <div className="stat-item"><span className="stat-label">SPD</span><span>{c.baseStats.spd}</span></div>
              </div>
              <div className="overlay-moves">
                <h4>Moves</h4>
                {c.moveIds.map(moveId => {
                  const m = moves[moveId];
                  return m ? (
                    <div key={moveId} className="mini-move">
                      <div className="mini-move-header">
                        <span>{m.name}</span>
                        <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>{m.type}</span>
                      </div>
                      <div className="mini-move-desc">{m.description}</div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            <div className="char-img-container">
              <img 
                src={`/assets/characters/${c.id}.png`} 
                alt={c.name} 
                className="char-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/vite.svg';
                }}
              />
            </div>
            <div className="char-details">
              <h3>{c.name}</h3>
              <p>{c.mentalType} / {c.elementalType}</p>
            </div>
          </div>
        ))}
      </div>
      <button disabled={selectedIds.length !== 3} onClick={handleReady}>
        決定して準備完了
      </button>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
};
