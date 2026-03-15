import { CharacterData } from '../types';

export const characters: CharacterData[] = [
  {
    id: 'c_sparrow',
    name: 'すぱろー',
    mentalType: '闇',
    elementalType: '氷',
    baseStats: { hp: 300, atk: 100, def: 30, spd: 100 },
    moveIds: ['m_sparrow_1', 'm_sparrow_2', 'm_sparrow_3'],
    passiveId: 'p_sparrow'
  },
  {
    id: 'c_aries',
    name: 'アーリエス',
    mentalType: '混沌',
    elementalType: '炎',
    baseStats: { hp: 400, atk: 85, def: 65, spd: 70 },
    moveIds: ['m_aries_1', 'm_aries_2', 'm_aries_3'],
    passiveId: 'p_aries'
  },
  {
    id: 'c_cell',
    name: 'CELL',
    mentalType: '混沌',
    elementalType: '雷',
    baseStats: { hp: 350, atk: 75, def: 60, spd: 90 },
    moveIds: ['m_cell_1', 'm_cell_2', 'm_cell_3'],
    passiveId: 'p_cell'
  },
  {
    id: 'c_chaako',
    name: 'ちゃーこ',
    mentalType: '光',
    elementalType: '氷',
    baseStats: { hp: 450, atk: 55, def: 95, spd: 60 },
    moveIds: ['m_chaako_1', 'm_chaako_2', 'm_chaako_3'],
    passiveId: 'p_chaako'
  },
  {
    id: 'c_yamori',
    name: 'やもり',
    mentalType: '闇',
    elementalType: '雷',
    baseStats: { hp: 380, atk: 75, def: 70, spd: 75 },
    moveIds: ['m_yamori_1', 'm_yamori_2', 'm_yamori_3'],
    passiveId: 'p_yamori'
  },
  {
    id: 'c_doji',
    name: 'きさらぎどーじ',
    mentalType: '混沌',
    elementalType: '炎',
    baseStats: { hp: 350, atk: 80, def: 60, spd: 80 },
    moveIds: ['m_doji_1', 'm_doji_2', 'm_doji_3'],
    passiveId: 'p_doji'
  },
  {
    id: 'c_yukishiro',
    name: 'ゆきしろ',
    mentalType: '光',
    elementalType: '氷',
    baseStats: { hp: 420, atk: 60, def: 75, spd: 80 },
    moveIds: ['m_yukishiro_1', 'm_yukishiro_2', 'm_yukishiro_3'],
    passiveId: 'p_yukishiro'
  },
  {
    id: 'c_maruhachi',
    name: 'まるはち',
    mentalType: '混沌',
    elementalType: '雷',
    baseStats: { hp: 380, atk: 85, def: 55, spd: 75 },
    moveIds: ['m_maruhachi_1', 'm_maruhachi_2', 'm_maruhachi_3'],
    passiveId: 'p_maruhachi'
  },
  {
    id: 'c_gocho',
    name: '伍長',
    mentalType: '光',
    elementalType: '炎',
    baseStats: { hp: 500, atk: 95, def: 85, spd: 40 },
    moveIds: ['m_gocho_1', 'm_gocho_2', 'm_gocho_3'],
    passiveId: 'p_gocho',
    altFormId: 'c_yamigocho',
    formConditionAllyId: 'c_doji'
  },
  {
    id: 'c_yamigocho',
    name: '闇伍長',
    mentalType: '闇',
    elementalType: '炎',
    baseStats: { hp: 450, atk: 115, def: 45, spd: 60 },
    moveIds: ['m_yamigocho_1', 'm_yamigocho_2', 'm_yamigocho_3'],
    passiveId: 'p_yamigocho',
    hiddenInSelect: true
  }
];
