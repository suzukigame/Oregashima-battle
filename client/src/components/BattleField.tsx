import { useEffect, useState, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

// ===== 型定義 =====
interface CharacterState {
  id: string; name: string; mentalType: string; elementalType: string;
  currentHp: number; maxHp: number; statusCondition: string | null; sp: number;
}

interface MoveData {
  id: string; name: string; type: string; power: number; spCost: number; description: string;
}

interface BattleSnapshot {
  players: Record<string, {
    name: string; active: CharacterState;
    party: { id: string; name: string; currentHp: number; maxHp: number }[];
  }>;
  turn: number; status: 'WAITING_ACTION' | 'FINISHED'; winnerId?: string;
}

type BattleEvent =
  | { type: 'TURN_START'; turn: number }
  | { type: 'SP_GAIN'; playerId: string; charName: string; newSp: number }
  | { type: 'MOVE_ANNOUNCE'; attackerId: string; charName: string; moveName: string }
  | { type: 'DAMAGE'; targetId: string; charName: string; damage: number; newHp: number; maxHp: number; effectiveness: 'super' | 'resist' | 'normal'; isCrit: boolean }
  | { type: 'HEAL'; playerId: string; charName: string; amount: number; newHp: number; maxHp: number }
  | { type: 'STATUS_APPLY'; targetId: string; charName: string; condition: string }
  | { type: 'STATUS_CURE'; playerId: string; charName: string }
  | { type: 'STATUS_CANT_MOVE'; playerId: string; charName: string; reason: string }
  | { type: 'STATUS_SELF_DAMAGE'; playerId: string; charName: string; damage: number; newHp: number }
  | { type: 'RECOIL'; playerId: string; charName: string; damage: number; newHp: number }
  | { type: 'DOT_DAMAGE'; playerId: string; charName: string; damage: number; newHp: number; condition: string }
  | { type: 'FAINT'; playerId: string; charName: string }
  | { type: 'SWITCH'; playerId: string; charName: string }
  | { type: 'FORM_CHANGE'; playerId: string; fromName: string; toName: string; newCharState: CharacterState }
  | { type: 'SP_SHORTAGE'; playerId: string; charName: string; moveName: string }
  | { type: 'SUICIDE'; playerId: string; charName: string; newHp: number }
  | { type: 'GAME_END'; winnerId: string; winnerName: string }
  | { type: 'TURN_END' };

interface Props {
  socket: Socket;
  initData: { snapshot: BattleSnapshot; moves: MoveData[]; playerId: string } | null;
}

// ===== イベントをメッセージに変換 =====
function eventToMessage(e: BattleEvent): string | null {
  switch (e.type) {
    case 'TURN_START': return `--- ターン ${e.turn} ---`;
    case 'MOVE_ANNOUNCE': return `${e.charName}の ${e.moveName}！`;
    case 'DAMAGE': {
      let msg = `${e.charName}に ${e.damage} ダメージ！`;
      if (e.effectiveness === 'super') msg += ' 効果抜群！';
      if (e.effectiveness === 'resist') msg += ' いまひとつ…';
      if (e.isCrit) msg += ' 急所！';
      return msg;
    }
    case 'HEAL': return `${e.charName}のHPが ${e.amount} 回復！`;
    case 'STATUS_APPLY': return `${e.charName}は ${e.condition} 状態になった！`;
    case 'STATUS_CURE': return `${e.charName}の状態異常が治った！`;
    case 'STATUS_CANT_MOVE': return `${e.charName}は動けない！`;
    case 'STATUS_SELF_DAMAGE': return `${e.charName}は混乱で自分を攻撃！ ${e.damage}ダメージ`;
    case 'RECOIL': return `${e.charName}は反動で ${e.damage} ダメージ！`;
    case 'DOT_DAMAGE': return `${e.charName}は ${e.condition} で ${e.damage} ダメージ！`;
    case 'FAINT': return `${e.charName}は倒れた！`;
    case 'SWITCH': return `${e.charName}を繰り出した！`;
    case 'FORM_CHANGE': return `✨ ${e.fromName}は ${e.toName}にフォームチェンジ！`;
    case 'SP_SHORTAGE': return `SPが足りない！ ${e.moveName}は使えなかった`;
    case 'SUICIDE': return `${e.charName}のHPが ${e.newHp} になった！`;
    case 'GAME_END': return `🏆 ${e.winnerName}の勝利！`;
    default: return null;
  }
}

// ===== イベントの演出ディレイ(ms) =====
function getEventDelay(e: BattleEvent): number {
  switch (e.type) {
    case 'TURN_START': return 600;
    case 'MOVE_ANNOUNCE': return 1200;
    case 'DAMAGE': return 1000;
    case 'HEAL': return 800;
    case 'FAINT': return 1200;
    case 'SWITCH': return 1000;
    case 'FORM_CHANGE': return 1500;
    case 'GAME_END': return 1500;
    case 'STATUS_APPLY': return 800;
    case 'DOT_DAMAGE': return 800;
    case 'RECOIL': return 600;
    default: return 400;
  }
}

// ===== コンポーネント =====
export const BattleField: React.FC<Props> = ({ socket, initData }) => {
  const [snapshot, setSnapshot] = useState<BattleSnapshot | null>(initData?.snapshot || null);
  const [moves, setMoves] = useState<MoveData[]>(initData?.moves || []);
  const [myId, setMyId] = useState(initData?.playerId || '');
  const [waiting, setWaiting] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [allLogs, setAllLogs] = useState<string[]>(['バトル開始！']);
  const logRef = useRef<HTMLDivElement>(null);

  // 演出用ステート
  const [displayHp, setDisplayHp] = useState<Record<string, { hp: number; max: number }>>({});
  const [displaySp, setDisplaySp] = useState<Record<string, number>>({});
  const [displayStatus, setDisplayStatus] = useState<Record<string, string | null>>({});
  const [shakeTarget, setShakeTarget] = useState<string | null>(null);
  const [flashType, setFlashType] = useState<'super' | 'resist' | null>(null);
  const [damagePopup, setDamagePopup] = useState<{ targetId: string; value: number; isHeal?: boolean } | null>(null);
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [displayTypes, setDisplayTypes] = useState<Record<string, { mental: string; elemental: string }>>({});
  const [formChangeFlash, setFormChangeFlash] = useState<string | null>(null);

  // 交代UI用ステート
  const [showSwitchPanel, setShowSwitchPanel] = useState(false);

  // initData到着時の初期化
  useEffect(() => {
    if (initData && !snapshot) {
      setSnapshot(initData.snapshot);
      setMoves(initData.moves);
      setMyId(initData.playerId);
    }
  }, [initData]);

  // スナップショットからdisplay系を初期化
  useEffect(() => {
    if (!snapshot) return;
    const hp: Record<string, { hp: number; max: number }> = {};
    const sp: Record<string, number> = {};
    const status: Record<string, string | null> = {};
    const names: Record<string, string> = {};
    const types: Record<string, { mental: string; elemental: string }> = {};
    for (const [id, p] of Object.entries(snapshot.players)) {
      hp[id] = { hp: p.active.currentHp, max: p.active.maxHp };
      sp[id] = p.active.sp;
      status[id] = p.active.statusCondition;
      names[id] = p.active.name;
      types[id] = { mental: p.active.mentalType, elemental: p.active.elementalType };
    }
    setDisplayHp(hp);
    setDisplaySp(sp);
    setDisplayStatus(status);
    setDisplayNames(names);
    setDisplayTypes(types);
  }, [!!snapshot]); // eslint-disable-line -- 初回マウント時のみ

  // イベントキュー処理
  const processEventQueue = useCallback(async (events: BattleEvent[], finalSnapshot: BattleSnapshot, finalMoves: MoveData[]) => {
    setAnimating(true);

    for (const event of events) {
      const msg = eventToMessage(event);
      if (msg) {
        setAllLogs(prev => [...prev, msg]);
      }

      // 演出処理
      switch (event.type) {
        case 'SP_GAIN':
          setDisplaySp(prev => ({ ...prev, [event.playerId]: event.newSp }));
          break;

        case 'MOVE_ANNOUNCE':
          setShakeTarget(null);
          setFlashType(null);
          break;

        case 'DAMAGE': {
          setShakeTarget(event.targetId);
          if (event.effectiveness !== 'normal') setFlashType(event.effectiveness);
          setDamagePopup({ targetId: event.targetId, value: event.damage });
          setDisplayHp(prev => ({ ...prev, [event.targetId]: { hp: event.newHp, max: event.maxHp } }));
          break;
        }

        case 'HEAL': {
          setDamagePopup({ targetId: event.playerId, value: event.amount, isHeal: true });
          setDisplayHp(prev => ({ ...prev, [event.playerId]: { hp: event.newHp, max: event.maxHp } }));
          break;
        }

        case 'STATUS_APPLY':
          setDisplayStatus(prev => ({ ...prev, [event.targetId]: event.condition }));
          break;

        case 'STATUS_CURE':
          setDisplayStatus(prev => ({ ...prev, [event.playerId]: null }));
          break;

        case 'RECOIL':
        case 'STATUS_SELF_DAMAGE':
          setShakeTarget(event.playerId);
          setDamagePopup({ targetId: event.playerId, value: event.damage });
          setDisplayHp(prev => {
            const old = prev[event.playerId];
            return { ...prev, [event.playerId]: { hp: event.newHp, max: old?.max || event.newHp } };
          });
          break;

        case 'DOT_DAMAGE':
          setShakeTarget(event.playerId);
          setDamagePopup({ targetId: event.playerId, value: event.damage });
          setDisplayHp(prev => {
            const old = prev[event.playerId];
            return { ...prev, [event.playerId]: { hp: event.newHp, max: old?.max || event.newHp } };
          });
          break;

        case 'SWITCH':
          setDisplayNames(prev => ({ ...prev, [event.playerId]: event.charName }));
          break;

        case 'FORM_CHANGE': {
          setFormChangeFlash(event.playerId);
          setDisplayNames(prev => ({ ...prev, [event.playerId]: event.toName }));
          setDisplayHp(prev => ({
            ...prev, [event.playerId]: { hp: event.newCharState.currentHp, max: event.newCharState.maxHp }
          }));
          setDisplayTypes(prev => ({
            ...prev, [event.playerId]: { mental: event.newCharState.mentalType, elemental: event.newCharState.elementalType }
          }));
          break;
        }

        case 'FAINT':
          setDisplayHp(prev => {
            const old = prev[event.playerId];
            return { ...prev, [event.playerId]: { hp: 0, max: old?.max || 100 } };
          });
          break;
      }

      // 演出周期のウェイト
      const delay = getEventDelay(event);
      await new Promise(resolve => setTimeout(resolve, delay));

      // 一時的なエフェクトをクリア
      setShakeTarget(null);
      setFlashType(null);
      setDamagePopup(null);
      setFormChangeFlash(null);
    }

    // 演出終了 → 最終状態を反映
    setSnapshot(finalSnapshot);
    setMoves(finalMoves);
    setWaiting(false);
    setAnimating(false);

    // display系も最終値に同期
    const hp: Record<string, { hp: number; max: number }> = {};
    const sp: Record<string, number> = {};
    const status: Record<string, string | null> = {};
    const names: Record<string, string> = {};
    const types: Record<string, { mental: string; elemental: string }> = {};
    for (const [id, p] of Object.entries(finalSnapshot.players)) {
      hp[id] = { hp: p.active.currentHp, max: p.active.maxHp };
      sp[id] = p.active.sp;
      status[id] = p.active.statusCondition;
      names[id] = p.active.name;
      types[id] = { mental: p.active.mentalType, elemental: p.active.elementalType };
    }
    setDisplayHp(hp);
    setDisplaySp(sp);
    setDisplayStatus(status);
    setDisplayNames(names);
    setDisplayTypes(types);
  }, []);

  useEffect(() => {
    socket.on('battle_update', (data: { events: BattleEvent[]; snapshot: BattleSnapshot; moves: MoveData[] }) => {
      processEventQueue(data.events, data.snapshot, data.moves);
    });
    socket.on('action_accepted', () => { setWaiting(true); });
    return () => { socket.off('battle_update'); socket.off('action_accepted'); };
  }, [socket, processEventQueue]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [allLogs]);

  // ===== レンダリング =====
  if (!snapshot || !myId) {
    return <div className="battle-loading">バトルデータをロード中...</div>;
  }

  const opponentId = Object.keys(snapshot.players).find(id => id !== myId)!;
  const me = snapshot.players[myId];
  const opponent = snapshot.players[opponentId];

  const handleUseMove = (moveId: string) => {
    if (animating) return;
    socket.emit('battle_action', { type: 'MOVE', moveId });
    setWaiting(true);
    setShowSwitchPanel(false);
  };

  const handleSwitch = (index: number) => {
    if (animating) return;
    socket.emit('battle_action', { type: 'SWITCH', index });
    setWaiting(true);
    setShowSwitchPanel(false);
  };

  const getHpColor = (hp: number, max: number) => {
    const ratio = hp / max;
    if (ratio > 0.5) return '#4caf50';
    if (ratio > 0.2) return '#ff9800';
    return '#f44336';
  };

  const getTypeColor = (type: string) => {
    const map: Record<string, string> = {
      '闇': '#7b1fa2', '光': '#fdd835', '混沌': '#e91e63',
      '炎': '#ff5722', '氷': '#03a9f4', '雷': '#ffeb3b',
    };
    return map[type] || '#888';
  };

  const renderSide = (playerId: string, player: typeof me, isOpponent: boolean) => {
    const hp = displayHp[playerId] || { hp: player.active.currentHp, max: player.active.maxHp };
    const sp = displaySp[playerId] ?? player.active.sp;
    const statusCond = displayStatus[playerId] ?? player.active.statusCondition;
    const charName = displayNames[playerId] || player.active.name;
    const types = displayTypes[playerId] || { mental: player.active.mentalType, elemental: player.active.elementalType };
    const isShaking = shakeTarget === playerId;
    const isFormChanging = formChangeFlash === playerId;

    return (
      <div className={`battle-side ${isOpponent ? 'opponent-side' : 'my-side'} ${isShaking ? 'shake' : ''} ${isFormChanging ? 'form-change-flash' : ''}`}>
        <div className="char-info">
          <h3>{charName} <span className="player-label">({player.name})</span></h3>
          <div className="type-badges">
            <span className="type-badge" style={{ background: getTypeColor(types.mental) }}>{types.mental}</span>
            <span className="type-badge" style={{ background: getTypeColor(types.elemental) }}>{types.elemental}</span>
          </div>
          {statusCond && <span className="status-badge">{statusCond}</span>}
          <div className="hp-bar-container">
            <div className="hp-bar" style={{
              width: `${(hp.hp / hp.max) * 100}%`,
              background: getHpColor(hp.hp, hp.max)
            }} />
          </div>
          <p className="hp-text">
            HP: {hp.hp} / {hp.max}
            {!isOpponent && ` | SP: ${sp}`}
          </p>

          {/* ダメージポップアップ */}
          {damagePopup && damagePopup.targetId === playerId && (
            <div className={`damage-popup ${damagePopup.isHeal ? 'heal' : 'hit'}`}>
              {damagePopup.isHeal ? '+' : '-'}{damagePopup.value}
            </div>
          )}
        </div>
        <div className="party-indicators">
          {player.party.map((c, i) => (
            <span key={i} className={`party-dot ${c.currentHp <= 0 ? 'fainted' : ''}`} title={c.name} />
          ))}
        </div>
      </div>
    );
  };

  // 交代可能なキャラを取得（現在のアクティブと戦闘不能を除く）
  const switchableChars = me.party
    .map((c, i) => ({ ...c, index: i }))
    .filter((c, i) => i !== me.party.findIndex(p => p.id === me.active.id) && c.currentHp > 0);

  return (
    <div className={`battle-container ${flashType === 'super' ? 'flash-super' : ''} ${flashType === 'resist' ? 'flash-resist' : ''}`}>
      {renderSide(opponentId, opponent, true)}

      <div className="battle-log" ref={logRef}>
        {allLogs.map((msg, i) => (
          <p key={i} className={msg.startsWith('---') ? 'log-turn' : msg.includes('フォームチェンジ') ? 'log-form-change' : ''}>{msg}</p>
        ))}
      </div>

      {renderSide(myId, me, false)}

      {snapshot.status === 'FINISHED' ? (
        <div className="battle-result">
          <h2>{snapshot.winnerId === myId ? '🎉 勝利！' : '💀 敗北…'}</h2>
        </div>
      ) : animating ? (
        <div className="waiting-action animating-label">演出中...</div>
      ) : waiting ? (
        <div className="waiting-action">相手のアクションを待っています...</div>
      ) : (
        <div className="action-panel">
          {showSwitchPanel ? (
            <div className="switch-panel">
              <h3>交代先を選択</h3>
              <div className="switch-list">
                {switchableChars.length === 0 ? (
                  <p className="no-switch">交代できるキャラがいない</p>
                ) : (
                  switchableChars.map(c => (
                    <button key={c.index} className="switch-char-btn" onClick={() => handleSwitch(c.index)}>
                      <span className="switch-char-name">{c.name}</span>
                      <span className="switch-char-hp">HP: {c.currentHp}/{c.maxHp}</span>
                    </button>
                  ))
                )}
              </div>
              <button className="cancel-switch-btn" onClick={() => setShowSwitchPanel(false)}>戻る</button>
            </div>
          ) : (
            <>
              <div className="move-select">
                {moves.map(m => (
                  <button key={m.id} className="move-btn" onClick={() => handleUseMove(m.id)}
                    disabled={(displaySp[myId] ?? me.active.sp) < m.spCost} title={m.description}
                  >
                    <span className="move-name">{m.name}</span>
                    <span className="move-meta">
                      <span className="move-type" style={{ color: getTypeColor(m.type) }}>{m.type}</span>
                      {m.power > 0 && <span> 威力:{m.power}</span>}
                      <span> SP:{m.spCost}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button className="switch-toggle-btn" onClick={() => setShowSwitchPanel(true)}
                disabled={switchableChars.length === 0}>
                🔄 交代
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
