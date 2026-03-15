export type MentalType = '闇' | '光' | '混沌';
export type ElementalType = '炎' | '氷' | '雷';
export type MoveType = MentalType | ElementalType;

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

// 状態異常定義
export type StatusCondition = '毒' | '猛毒' | '炎上' | '凍結' | '麻痺' | '混乱' | '暗闇' | null;

export interface CharacterData {
  id: string;
  name: string;
  mentalType: MentalType;
  elementalType: ElementalType;
  baseStats: Stats;
  moveIds: string[];
  passiveId: string;
  // フォームチェンジ用
  altFormId?: string;            // 変身先のキャラID
  formConditionAllyId?: string;  // この味方がいるとき通常形態（いないとaltFormに変身）
  hiddenInSelect?: boolean;      // チーム選択画面で非表示にする（闇伍長など）
}

export interface MoveData {
  id: string;
  name: string;
  type: MoveType;
  power: number;
  spCost: number;
  description: string;
  // 特殊効果の定義（詳細な関数実装は後ほどエンジンの層で行うため、ここではキーとパラメータを保持）
  effectType?: 'MULTI_HIT' | 'STATUS_CONDITION' | 'SUICIDE' | 'IGNORE_DEF' | 'RECOIL' | 'BUFF' | 'DEBUFF' | 'HEAL' | 'GUARANTEED_HIT' | 'PRIORITY' | 'COPY_MOVE';
  effectParams?: any;
}

export interface PassiveData {
  id: string;
  name: string;
  description: string;
  triggerEvent: 'ON_ATTACK' | 'ON_HIT' | 'ON_HP_CHANGE' | 'ON_TURN_START' | 'ON_TURN_END' | 'ON_SWITCH_IN' | 'ON_LAST_STAND' | 'ON_STATUS_CONDITION';
}
