import { MoveData } from '../types';

export const moves: MoveData[] = [
  // すぱろー
  { id: 'm_sparrow_1', name: '沈黙のダブル・ウイスキー', type: '闇', power: 20, spCost: 0, description: '2回連続攻撃', effectType: 'MULTI_HIT', effectParams: { hits: 2 } },
  { id: 'm_sparrow_2', name: '氷の微笑（オン・ザ・ロックス）', type: '氷', power: 60, spCost: 1, description: '20%の確率で相手を「凍結」させる', effectType: 'STATUS_CONDITION', effectParams: { condition: '凍結', chance: 0.2 } },
  { id: 'm_sparrow_3', name: 'あばよ、相棒（アディオス・バディ）', type: '闇', power: 150, spCost: 4, description: '超極大ダメージ。使用後、自分のHPは1になる', effectType: 'SUICIDE', effectParams: { hpLeft: 1 } },

  // アーリエス
  { id: 'm_aries_1', name: 'ゲーミング・バースト', type: '炎', power: 35, spCost: 0, description: '通常攻撃' },
  { id: 'm_aries_2', name: '魔改造・ロマン武装', type: '混沌', power: 55, spCost: 1, description: '相手の防御力を一部無視して攻撃', effectType: 'IGNORE_DEF', effectParams: { ratio: 0.5 } },
  { id: 'm_aries_3', name: 'アリラジ公開録音', type: '炎', power: 75, spCost: 2, description: '相手を「炎上」状態にする', effectType: 'STATUS_CONDITION', effectParams: { condition: '炎上', chance: 1.0 } },

  // CELL
  { id: 'm_cell_1', name: '尊死の断末魔', type: '混沌', power: 30, spCost: 0, description: '通常攻撃' },
  { id: 'm_cell_2', name: '解釈違いの過負荷', type: '雷', power: 0, spCost: 1, description: '2ターンの間, 相手のATKを下げる', effectType: 'DEBUFF', effectParams: { stat: 'atk', ratio: 0.8, turns: 2 } },
  { id: 'm_cell_3', name: '地雷原の踏破', type: '混沌', power: 60, spCost: 2, description: '30%の確率で相手を「混乱」させる', effectType: 'STATUS_CONDITION', effectParams: { condition: '混乱', chance: 0.3 } },

  // ちゃーこ
  { id: 'm_chaako_1', name: '推しカプの結晶', type: '氷', power: 25, spCost: 0, description: '攻撃しつつ、自分のDEFを10%上げる', effectType: 'BUFF', effectParams: { target: 'self', stat: 'def', ratio: 1.1, turns: 3 } },
  { id: 'm_chaako_2', name: '限界ヲタクの礼賛', type: '光', power: 0, spCost: 1, description: '自分のHPを120回復する', effectType: 'HEAL', effectParams: { amount: 120, target: 'self' } },
  { id: 'm_chaako_3', name: '聖地巡礼の奇跡', type: '氷', power: 100, spCost: 3, description: '必中攻撃。相手のDEFを20%下げる', effectType: 'DEBUFF', effectParams: { target: 'enemy', stat: 'def', ratio: 0.8, turns: 3, guaranteedHit: true } },

  // やもり
  { id: 'm_yamori_1', name: '適当な相槌', type: '雷', power: 30, spCost: 0, description: '通常攻撃' },
  { id: 'm_yamori_2', name: '無自覚な猛毒', type: '闇', power: 25, spCost: 1, description: '相手を「猛毒」状態にする', effectType: 'STATUS_CONDITION', effectParams: { condition: '猛毒', chance: 1.0 } },
  { id: 'm_yamori_3', name: 'シャーク・お昼寝・ボルト', type: '雷', power: 65, spCost: 2, description: '20%の確率で相手を「麻痺」させる', effectType: 'STATUS_CONDITION', effectParams: { condition: '麻痺', chance: 0.2 } },

  // きさらぎどーじ
  { id: 'm_doji_1', name: '俺ちゃんオンステージ', type: '炎', power: 35, spCost: 0, description: '通常攻撃' },
  { id: 'm_doji_2', name: '究極のファンサ', type: '混沌', power: 50, spCost: 1, description: '30%の確率で相手のSPDを下げる', effectType: 'DEBUFF', effectParams: { target: 'enemy', stat: 'spd', ratio: 0.8, turns: 3, chance: 0.3 } },
  { id: 'm_doji_3', name: '俺が島の頂上決戦', type: '炎', power: 120, spCost: 3, description: '高威力だが命中75%。外すと反動ダメ', effectType: 'RECOIL', effectParams: { accuracy: 75, recoilIfMiss: 80 } },

  // ゆきしろ
  { id: 'm_yukishiro_1', name: '白狐の粉雪', type: '氷', power: 30, spCost: 0, description: '通常攻撃' },
  { id: 'm_yukishiro_2', name: '狐の恩返し', type: '光', power: 0, spCost: 1, description: 'HPを90回復し、全ての状態異常を解除', effectType: 'HEAL', effectParams: { amount: 90, cureAll: true, target: 'self' } },
  { id: 'm_yukishiro_3', name: '月夜の狐火', type: '光', power: 0, spCost: 2, description: '2ターンの間、受けるダメージを半減する', effectType: 'BUFF', effectParams: { target: 'self', stat: 'damageReduction', ratio: 0.5, turns: 2 } },

  // まるはち
  { id: 'm_maruhachi_1', name: '妄想の暴走', type: '混沌', power: 35, spCost: 0, description: '通常攻撃' },
  { id: 'm_maruhachi_2', name: '自給自足の筆致', type: '雷', power: 40, spCost: 1, description: '25%で相手を混乱または暗闇にする', effectType: 'STATUS_CONDITION', effectParams: { condition: ['混乱', '暗闇'], chance: 0.25 } },
  { id: 'm_maruhachi_3', name: '禁断の二次創作', type: '混沌', power: 0, spCost: 2, description: '相手の最後に出した技をコピーして放つ', effectType: 'COPY_MOVE' },

  // 伍長
  { id: 'm_gocho_1', name: '献身の鉄拳', type: '炎', power: 50, spCost: 0, description: '強力な通常攻撃。自分も35ダメージ受ける', effectType: 'RECOIL', effectParams: { recoilDamage: 35 } },
  { id: 'm_gocho_2', name: '捨て身の鬼教練', type: '炎', power: 75, spCost: 1, description: '高威力攻撃。自分も70ダメージ受ける', effectType: 'RECOIL', effectParams: { recoilDamage: 70 } },
  { id: 'm_gocho_3', name: '命を賭した尻拭い', type: '光', power: 0, spCost: 4, description: '味方全体のHPを回復し全状態異常を解除。自分は120ダメージ受ける', effectType: 'HEAL', effectParams: { amount: 150, target: 'allies', cureAll: true, recoilDamage: 120 } },

  // 闇伍長
  { id: 'm_yamigocho_1', name: '絶望の叙事詩', type: '闇', power: 40, spCost: 0, description: '通常攻撃' },
  { id: 'm_yamigocho_2', name: '終わりなき後始末', type: '炎', power: 55, spCost: 1, description: '相手の防御を一部無視して攻撃', effectType: 'IGNORE_DEF', effectParams: { ratio: 0.5 } },
  { id: 'm_yamigocho_3', name: '尻拭いのプライド', type: '闇', power: 110, spCost: 3, description: '極大ダメージ。自分も50ダメージ受ける', effectType: 'RECOIL', effectParams: { recoilDamage: 50 } }
];
