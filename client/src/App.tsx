import { useState, useEffect } from 'react';
import './App.css';
import { Lobby } from './components/Lobby';
import { TeamSelect } from './components/TeamSelect';
import { BattleField } from './components/BattleField';
import { useSocket } from './hooks/useSocket';
import type { Room } from './types';

function App() {
  const socket = useSocket();
  const [roomId, setRoomId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [roomState, setRoomState] = useState<Room | null>(null);
  const [joined, setJoined] = useState(false);
  const [battleInitData, setBattleInitData] = useState<any>(null);

  useEffect(() => {
    if (!socket) return;
    
    const handleRoomUpdate = (room: Room) => {
      setRoomState(room);
    };

    const handleBattleStart = (data: any) => {
      setBattleInitData(data);
    };

    socket.on('room_update', handleRoomUpdate);
    socket.on('battle_start', handleBattleStart);

    return () => {
      socket.off('room_update', handleRoomUpdate);
      socket.off('battle_start', handleBattleStart);
    };
  }, [socket]);

  const handleJoinSuccess = (joinedRoomId: string, name: string) => {
    setRoomId(joinedRoomId);
    setPlayerName(name);
    setJoined(true);
  };

  if (!joined) {
    return (
      <div className="app-container">
        <Lobby socket={socket} onJoinSuccess={handleJoinSuccess} />
      </div>
    );
  }

  if (!roomState || roomState.status === 'LOBBY') {
    return (
      <div className="app-container">
        <div className="waiting-screen">
          <h2>ルーム: {roomId}</h2>
          <p>対戦相手を待っています...</p>
          {roomState && (
            <ul>
              {roomState.players.map(p => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (roomState.status === 'TEAM_SELECT') {
    return (
      <div className="app-container">
        <TeamSelect room={roomState} playerName={playerName} socket={socket!} />
      </div>
    );
  }

  if (roomState.status === 'BATTLE') {
    return (
      <div className="app-container">
        <BattleField socket={socket!} initData={battleInitData} />
      </div>
    );
  }

  return null;
}

export default App;
