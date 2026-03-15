import { CharacterData, MoveData, StatusCondition } from '../types';
import { characters } from '../data/characters';
import { moves } from '../data/moves';
import { calculateDamage } from './DamageCalc';
import { applyStatusDamage, evaluateStatusAction } from './StatusEffects';

export interface CharacterState {
  id: string;
  name: string;
  mentalType: string;
  elementalType: string;
  currentHp: number;
  maxHp: number;
  currentAtk: number;
  currentDef: number;
  currentSpd: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  statusCondition: StatusCondition;
  sp: number;
  moveIds: string[];
  passiveId: string;
}

export interface BattlePlayerState {
  id: string;
  name: string;
  party: CharacterState[];
  activeCharIndex: number;
  selectedAction?: { type: 'MOVE'; moveId: string } | { type: 'SWITCH'; index: number };
}

// ===== バトルイベント定義 =====
export type BattleEvent =
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

export interface PlayerSnapshot {
  name: string;
  active: CharacterState;
  party: { id: string; name: string; currentHp: number; maxHp: number }[];
}

export interface BattleSnapshot {
  players: Record<string, PlayerSnapshot>;
  turn: number;
  status: 'WAITING_ACTION' | 'FINISHED';
  winnerId?: string;
}

export class BattleEngine {
  private players: Record<string, BattlePlayerState> = {};
  private turn: number = 1;
  private status: 'WAITING_ACTION' | 'FINISHED' = 'WAITING_ACTION';
  private winnerId?: string;

  constructor(p1: { id: string; name: string; selectedCharacterIds: string[] },
              p2: { id: string; name: string; selectedCharacterIds: string[] }) {
    this.players[p1.id] = this.initPlayerState(p1);
    this.players[p2.id] = this.initPlayerState(p2);
  }

  private initPlayerState(p: { id: string; name: string; selectedCharacterIds: string[] }): BattlePlayerState {
    const hasConditionAlly = (charData: CharacterData) => {
      if (!charData.formConditionAllyId) return true;
      return p.selectedCharacterIds.includes(charData.formConditionAllyId);
    };

    const party = p.selectedCharacterIds.map(cid => {
      let base = characters.find(c => c.id === cid)!;
      // フォームチェンジ初期判定: 条件キャラがチームにいなければ altForm に変身
      if (base.altFormId && !hasConditionAlly(base)) {
        const alt = characters.find(c => c.id === base.altFormId);
        if (alt) base = alt;
      }
      return this.createCharState(base);
    });
    return { id: p.id, name: p.name, party, activeCharIndex: 0 };
  }

  private createCharState(base: CharacterData): CharacterState {
    return {
      id: base.id, name: base.name,
      mentalType: base.mentalType, elementalType: base.elementalType,
      currentHp: base.baseStats.hp, maxHp: base.baseStats.hp,
      currentAtk: base.baseStats.atk, currentDef: base.baseStats.def, currentSpd: base.baseStats.spd,
      baseAtk: base.baseStats.atk, baseDef: base.baseStats.def, baseSpd: base.baseStats.spd,
      statusCondition: null, sp: 0,
      moveIds: base.moveIds, passiveId: base.passiveId,
    };
  }

  // フォームチェンジ判定: どーじ(条件キャラ)の生存状態に基づいて伍長のフォームを切り替える
  private checkFormChange(player: BattlePlayerState, events: BattleEvent[]) {
    for (let i = 0; i < player.party.length; i++) {
      const char = player.party[i];
      if (char.currentHp <= 0) continue;

      const charData = characters.find(c => c.id === char.id);
      if (!charData) continue;

      // 通常形態 → altForm: 条件キャラが全滅
      if (charData.altFormId && charData.formConditionAllyId) {
        const condAllyAlive = player.party.some(c => c.id === charData.formConditionAllyId && c.currentHp > 0);
        if (!condAllyAlive) {
          const altData = characters.find(c => c.id === charData.altFormId);
          if (altData) {
            const oldName = char.name;
            const hpRatio = char.currentHp / char.maxHp;
            this.transformChar(char, altData, hpRatio);
            events.push({ type: 'FORM_CHANGE', playerId: player.id, fromName: oldName, toName: char.name, newCharState: { ...char } });
          }
        }
      }

      // altForm → 通常形態: 条件キャラが復活（交代で戻った場合）
      // 闇伍長 → 伍長（どーじが生きていれば戻る）
      if (charData.hiddenInSelect) {
        // 闇伍長のケース: 「伍長」のデータを探して、条件キャラが生きていれば戻す
        const originalForm = characters.find(c => c.altFormId === charData.id);
        if (originalForm && originalForm.formConditionAllyId) {
          const condAllyAlive = player.party.some(c => c.id === originalForm.formConditionAllyId && c.currentHp > 0);
          if (condAllyAlive) {
            const oldName = char.name;
            const hpRatio = char.currentHp / char.maxHp;
            this.transformChar(char, originalForm, hpRatio);
            events.push({ type: 'FORM_CHANGE', playerId: player.id, fromName: oldName, toName: char.name, newCharState: { ...char } });
          }
        }
      }
    }
  }

  private transformChar(char: CharacterState, newData: CharacterData, hpRatio: number) {
    char.id = newData.id;
    char.name = newData.name;
    char.mentalType = newData.mentalType;
    char.elementalType = newData.elementalType;
    char.maxHp = newData.baseStats.hp;
    char.currentHp = Math.max(1, Math.round(newData.baseStats.hp * hpRatio));
    char.currentAtk = newData.baseStats.atk;
    char.currentDef = newData.baseStats.def;
    char.currentSpd = newData.baseStats.spd;
    char.baseAtk = newData.baseStats.atk;
    char.baseDef = newData.baseStats.def;
    char.baseSpd = newData.baseStats.spd;
    char.moveIds = newData.moveIds;
    char.passiveId = newData.passiveId;
    // 状態異常とSPは引き継ぎ
  }

  public submitAction(playerId: string, action: { type: 'MOVE'; moveId: string } | { type: 'SWITCH'; index: number }): { events: BattleEvent[]; snapshot: BattleSnapshot } | null {
    const p = this.players[playerId];
    if (!p || this.status === 'FINISHED') return null;
    p.selectedAction = action;

    const ids = Object.keys(this.players);
    if (!ids.every(id => this.players[id].selectedAction != null)) return null;

    const events = this.resolveTurn();
    return { events, snapshot: this.getSnapshot() };
  }

  private resolveTurn(): BattleEvent[] {
    const events: BattleEvent[] = [];
    events.push({ type: 'TURN_START', turn: this.turn });

    const ids = Object.keys(this.players);
    const p1 = this.players[ids[0]];
    const p2 = this.players[ids[1]];
    const active1 = p1.party[p1.activeCharIndex];
    const active2 = p2.party[p2.activeCharIndex];

    // SP回復
    active1.sp = Math.min(5, active1.sp + 1);
    events.push({ type: 'SP_GAIN', playerId: p1.id, charName: active1.name, newSp: active1.sp });
    active2.sp = Math.min(5, active2.sp + 1);
    events.push({ type: 'SP_GAIN', playerId: p2.id, charName: active2.name, newSp: active2.sp });

    // 素早さ順
    let first = p1, second = p2;
    if (active2.currentSpd > active1.currentSpd) { first = p2; second = p1; }
    else if (active2.currentSpd === active1.currentSpd && Math.random() < 0.5) { first = p2; second = p1; }

    this.processAction(first, second, events);
    if (this.status !== 'FINISHED') {
      this.processAction(second, first, events);
    }

    // ターン終了時DOT
    if (this.status !== 'FINISHED') {
      this.processEndOfTurnStatus(first, events);
      this.processEndOfTurnStatus(second, events);
    }

    first.selectedAction = undefined;
    second.selectedAction = undefined;
    this.turn++;
    this.checkWinCondition(events);

    events.push({ type: 'TURN_END' });
    return events;
  }

  private processAction(attacker: BattlePlayerState, defender: BattlePlayerState, events: BattleEvent[]) {
    const action = attacker.selectedAction;
    if (!action) return;
    const atkChar = attacker.party[attacker.activeCharIndex];
    const defChar = defender.party[defender.activeCharIndex];
    if (atkChar.currentHp <= 0) return;

    // 状態異常チェック
    if (atkChar.statusCondition) {
      const statusResult = evaluateStatusAction(atkChar.statusCondition);
      if (statusResult.selfDamage > 0) {
        atkChar.currentHp = Math.max(0, atkChar.currentHp - statusResult.selfDamage);
        events.push({ type: 'STATUS_SELF_DAMAGE', playerId: attacker.id, charName: atkChar.name, damage: statusResult.selfDamage, newHp: atkChar.currentHp });
      }
      if (statusResult.isHealed) {
        atkChar.statusCondition = null;
        events.push({ type: 'STATUS_CURE', playerId: attacker.id, charName: atkChar.name });
      }
      if (!statusResult.canMove) {
        events.push({ type: 'STATUS_CANT_MOVE', playerId: attacker.id, charName: atkChar.name, reason: atkChar.statusCondition || '状態異常' });
        return;
      }
    }

    if (action.type === 'SWITCH') {
      attacker.activeCharIndex = action.index;
      const newChar = attacker.party[action.index];
      events.push({ type: 'SWITCH', playerId: attacker.id, charName: newChar.name });
      // 交代後のフォームチェンジ判定
      this.checkFormChange(attacker, events);
      return;
    }

    const move = moves.find(m => m.id === action.moveId);
    if (!move) return;

    if (atkChar.sp < move.spCost) {
      events.push({ type: 'SP_SHORTAGE', playerId: attacker.id, charName: atkChar.name, moveName: move.name });
      return;
    }
    atkChar.sp -= move.spCost;

    events.push({ type: 'MOVE_ANNOUNCE', attackerId: attacker.id, charName: atkChar.name, moveName: move.name });

    const attackerCharData = characters.find(c => c.id === atkChar.id)!;
    const defenderCharData = characters.find(c => c.id === defChar.id)!;
    const hits = move.effectType === 'MULTI_HIT' ? (move.effectParams?.hits || 1) : 1;

    for (let i = 0; i < hits; i++) {
      if (defChar.currentHp <= 0) break;
      const ignoreDefRatio = move.effectType === 'IGNORE_DEF' ? (move.effectParams?.ratio || 0) : 0;

      if (move.power > 0) {
        const result = calculateDamage({
          attacker: attackerCharData, defender: defenderCharData, move,
          attackerCurrentAtk: atkChar.currentAtk, defenderCurrentDef: defChar.currentDef, ignoreDefRatio,
        });
        defChar.currentHp = Math.max(0, defChar.currentHp - result.damage);
        let effectiveness: 'super' | 'resist' | 'normal' = 'normal';
        if (result.typeMod > 1) effectiveness = 'super';
        if (result.typeMod < 1) effectiveness = 'resist';
        events.push({ type: 'DAMAGE', targetId: defender.id, charName: defChar.name, damage: result.damage, newHp: defChar.currentHp, maxHp: defChar.maxHp, effectiveness, isCrit: result.isCrit });
      }
    }

    // 回復
    if (move.effectType === 'HEAL' && move.effectParams) {
      const healAmount = move.effectParams.amount || 0;
      if (move.effectParams.target === 'self') {
        atkChar.currentHp = Math.min(atkChar.maxHp, atkChar.currentHp + healAmount);
        events.push({ type: 'HEAL', playerId: attacker.id, charName: atkChar.name, amount: healAmount, newHp: atkChar.currentHp, maxHp: atkChar.maxHp });
      }
      if (move.effectParams.cureAll) {
        atkChar.statusCondition = null;
        events.push({ type: 'STATUS_CURE', playerId: attacker.id, charName: atkChar.name });
      }
    }

    // 状態異常付与
    if (move.effectType === 'STATUS_CONDITION' && move.effectParams) {
      const chance = move.effectParams.chance || 0;
      if (Math.random() < chance) {
        const condition = Array.isArray(move.effectParams.condition)
          ? move.effectParams.condition[Math.floor(Math.random() * move.effectParams.condition.length)]
          : move.effectParams.condition;
        defChar.statusCondition = condition;
        events.push({ type: 'STATUS_APPLY', targetId: defender.id, charName: defChar.name, condition });
      }
    }

    // 反動
    if (move.effectType === 'RECOIL' && move.effectParams?.recoilDamage) {
      atkChar.currentHp = Math.max(0, atkChar.currentHp - move.effectParams.recoilDamage);
      events.push({ type: 'RECOIL', playerId: attacker.id, charName: atkChar.name, damage: move.effectParams.recoilDamage, newHp: atkChar.currentHp });
    }

    // 自爆
    if (move.effectType === 'SUICIDE') {
      atkChar.currentHp = move.effectParams?.hpLeft || 1;
      events.push({ type: 'SUICIDE', playerId: attacker.id, charName: atkChar.name, newHp: atkChar.currentHp });
    }

    // 戦闘不能チェック
    if (defChar.currentHp <= 0) {
      events.push({ type: 'FAINT', playerId: defender.id, charName: defChar.name });
      this.autoSwitchNext(defender, events);
      // フォームチェンジ判定（倒れたのが条件キャラかもしれない）
      this.checkFormChange(attacker, events);
      this.checkFormChange(defender, events);
    }
    if (atkChar.currentHp <= 0) {
      events.push({ type: 'FAINT', playerId: attacker.id, charName: atkChar.name });
      this.autoSwitchNext(attacker, events);
      this.checkFormChange(attacker, events);
      this.checkFormChange(defender, events);
    }
  }

  private processEndOfTurnStatus(player: BattlePlayerState, events: BattleEvent[]) {
    const char = player.party[player.activeCharIndex];
    if (char.currentHp <= 0 || !char.statusCondition) return;
    const dot = applyStatusDamage(char.statusCondition, char.maxHp);
    if (dot > 0) {
      char.currentHp = Math.max(0, char.currentHp - dot);
      events.push({ type: 'DOT_DAMAGE', playerId: player.id, charName: char.name, damage: dot, newHp: char.currentHp, condition: char.statusCondition });
      if (char.currentHp <= 0) {
        events.push({ type: 'FAINT', playerId: player.id, charName: char.name });
        this.autoSwitchNext(player, events);
      }
    }
  }

  private autoSwitchNext(player: BattlePlayerState, events: BattleEvent[]) {
    const nextIndex = player.party.findIndex((c, i) => i !== player.activeCharIndex && c.currentHp > 0);
    if (nextIndex >= 0) {
      player.activeCharIndex = nextIndex;
      events.push({ type: 'SWITCH', playerId: player.id, charName: player.party[nextIndex].name });
    }
  }

  private checkWinCondition(events: BattleEvent[]) {
    const ids = Object.keys(this.players);
    for (const id of ids) {
      const p = this.players[id];
      if (p.party.every(c => c.currentHp <= 0)) {
        const winnerId = ids.find(i => i !== id)!;
        this.status = 'FINISHED';
        this.winnerId = winnerId;
        events.push({ type: 'GAME_END', winnerId, winnerName: this.players[winnerId].name });
        return;
      }
    }
  }

  public getSnapshot(): BattleSnapshot {
    const playersSnapshot: BattleSnapshot['players'] = {};
    for (const [id, p] of Object.entries(this.players)) {
      playersSnapshot[id] = {
        name: p.name,
        active: { ...p.party[p.activeCharIndex] },
        party: p.party.map(c => ({ id: c.id, name: c.name, currentHp: c.currentHp, maxHp: c.maxHp })),
      };
    }
    return { players: playersSnapshot, turn: this.turn, status: this.status, winnerId: this.winnerId };
  }

  public getMovesForPlayer(playerId: string): MoveData[] {
    const p = this.players[playerId];
    if (!p) return [];
    const active = p.party[p.activeCharIndex];
    return active.moveIds.map(mid => moves.find(m => m.id === mid)!).filter(Boolean);
  }
}
