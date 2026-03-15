// サーバーと同じ型定義をクライアント側にも用意
export type MentalType = '闇' | '光' | '混沌';
export type ElementalType = '炎' | '氷' | '雷';
export type MoveType = MentalType | ElementalType;

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export type StatusCondition = '毒' | '猛毒' | '炎上' | '凍結' | '麻痺' | '混乱' | '暗闇' | null;

export interface CharacterData {
  id: string;
  name: string;
  mentalType: MentalType;
  elementalType: ElementalType;
  baseStats: Stats;
  moveIds: string[];
  passiveId: string;
  altFormId?: string;
  formConditionAllyId?: string;
  hiddenInSelect?: boolean;
}

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
}
