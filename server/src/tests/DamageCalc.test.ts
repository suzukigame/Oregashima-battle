import { calculateDamage, DamageContext } from '../engine/DamageCalc';
import { getTypeMultiplier } from '../engine/TypeChart';
import { CharacterData, MoveData } from '../types';

describe('1. TypeChart.ts: 属性相性テスト', () => {
  describe('1.1 精神（Mental）属性サイクルのテスト', () => {
    it('TC_M_01: 闇 vs 混沌 (有利)', () => expect(getTypeMultiplier('闇', '混沌', '炎')).toBe(2.0));
    it('TC_M_02: 闇 vs 光 (不利)', () => expect(getTypeMultiplier('闇', '光', '氷')).toBe(0.5));
    it('TC_M_03: 闇 vs 闇 (等倍)', () => expect(getTypeMultiplier('闇', '闇', '雷')).toBe(1.0));
    it('TC_M_04: 混沌 vs 光 (有利)', () => expect(getTypeMultiplier('混沌', '光', '炎')).toBe(2.0));
    it('TC_M_05: 混沌 vs 闇 (不利)', () => expect(getTypeMultiplier('混沌', '闇', '氷')).toBe(0.5));
    it('TC_M_06: 混沌 vs 混沌 (等倍)', () => expect(getTypeMultiplier('混沌', '混沌', '雷')).toBe(1.0));
    it('TC_M_07: 光 vs 闇 (有利)', () => expect(getTypeMultiplier('光', '闇', '炎')).toBe(2.0));
    it('TC_M_08: 光 vs 混沌 (不利)', () => expect(getTypeMultiplier('光', '混沌', '氷')).toBe(0.5));
    it('TC_M_09: 光 vs 光 (等倍)', () => expect(getTypeMultiplier('光', '光', '雷')).toBe(1.0));
  });

  describe('1.2 元素（Elemental）属性サイクルのテスト', () => {
    it('TC_E_01: 炎 vs 氷 (有利)', () => expect(getTypeMultiplier('炎', '闇', '氷')).toBe(2.0));
    it('TC_E_02: 炎 vs 雷 (不利)', () => expect(getTypeMultiplier('炎', '混沌', '雷')).toBe(0.5));
    it('TC_E_03: 炎 vs 炎 (等倍)', () => expect(getTypeMultiplier('炎', '光', '炎')).toBe(1.0));
    it('TC_E_04: 氷 vs 雷 (有利)', () => expect(getTypeMultiplier('氷', '闇', '雷')).toBe(2.0));
    it('TC_E_05: 氷 vs 炎 (不利)', () => expect(getTypeMultiplier('氷', '混沌', '炎')).toBe(0.5));
    it('TC_E_06: 氷 vs 氷 (等倍)', () => expect(getTypeMultiplier('氷', '光', '氷')).toBe(1.0));
    it('TC_E_07: 雷 vs 炎 (有利)', () => expect(getTypeMultiplier('雷', '闇', '炎')).toBe(2.0));
    it('TC_E_08: 雷 vs 氷 (不利)', () => expect(getTypeMultiplier('雷', '混沌', '氷')).toBe(0.5));
    it('TC_E_09: 雷 vs 雷 (等倍)', () => expect(getTypeMultiplier('雷', '光', '雷')).toBe(1.0));
  });
});

describe('2. DamageCalc.ts: ダメージ計算の基本ロジックテスト', () => {
  let mockRandom: jest.SpyInstance;

  beforeEach(() => {
    // デフォルトで乱数を1.0 (最大) に固定
    mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.999999);
  });

  afterEach(() => {
    mockRandom.mockRestore();
  });

  const baseAttacker: CharacterData = {
    id: 'test_atk', name: 'Atk', mentalType: '闇', elementalType: '氷',
    baseStats: { hp: 100, atk: 100, def: 50, spd: 50 }, moveIds: [], passiveId: 'p_none'
  };
  const baseDefender: CharacterData = {
    id: 'test_def', name: 'Def', mentalType: '光', elementalType: '炎',
    baseStats: { hp: 100, atk: 50, def: 50, spd: 50 }, moveIds: [], passiveId: 'p_none'
  };
  const baseMove: MoveData = {
    id: 'test_move', name: 'Test', type: '光', power: 100, spCost: 0, description: ''
  };

  it('2.1 ATK / DEF と 威力 の基本計算', () => {
    // 威力100, ATK100, DEF50, モーション光(等倍), STABなし(光vs光), 乱数1.0 (実際には0.999999)
    // => 100 * (100 / 50) * 0.5 * 1.0 * (0.85 + 0.999999 * 0.15) = 99.999985
    // floorで切り捨てられて 99 になる。
    const ctx: DamageContext = {
      attacker: baseAttacker, defender: baseDefender, move: baseMove,
      attackerCurrentAtk: 100, defenderCurrentDef: 50
    };
    const result = calculateDamage(ctx);
    // 威力100, ATK100, DEF50 => 基本100
    // floor(100 * (0.85 + 0.999999 * 0.15)) = 99
    expect(result.damage).toBe(99);
    expect(result.isStab).toBe(false);
    expect(result.isCrit).toBe(false); // 0.999 is not < 0.05
  });

  it('2.2 タイプ一致ボーナス (STAB) テスト', () => {
    const stabMove: MoveData = { ...baseMove, type: '闇' };
    const baseDefenderDark: CharacterData = { ...baseDefender, mentalType: '闇', elementalType: '炎' };
    const ctx: DamageContext = {
      attacker: baseAttacker, defender: baseDefenderDark, move: stabMove,
      attackerCurrentAtk: 100, defenderCurrentDef: 50
    };
    const result = calculateDamage(ctx);
    // 100 * (100 / 50) * 0.5 * 1.0 (相性等倍, 闇vs闇) * 1.5 (STAB)
    // * (0.85 + 0.999999 * 0.15)
    // = 150 * 0.99999985 = 149.999... -> floor(149)
    expect(result.damage).toBe(149);
    expect(result.isStab).toBe(true);
  });

  it('2.3 急所 (Critical Hit) テスト', () => {
    // 急所を確実に発動 (ランダム値が0.05未満の場合)
    mockRandom.mockReturnValue(0.01);
    
    const ctx: DamageContext = {
      attacker: baseAttacker, defender: baseDefender, move: baseMove,
      attackerCurrentAtk: 100, defenderCurrentDef: 50
    };
    const result = calculateDamage(ctx);
    
    // 計算: 100 * (100 / 50) * 0.5 = 100
    // 乱数: 0.85 + 0.01*0.15 = 0.8515
    // base_damage = 100 * 0.8515 = 85.15
    // 急所ダメージ: base_damage * 1.5 = 127.725
    // floor(127.725) = 127
    expect(result.isCrit).toBe(true);
    expect(result.damage).toBe(127); 
  });

  it('2.4 乱数幅 (Random Factor) テスト', () => {
    const ctx: DamageContext = {
      attacker: baseAttacker, defender: baseDefender, move: baseMove,
      attackerCurrentAtk: 100, defenderCurrentDef: 50
    };
    
    // 最小乱数 (0.00 -> 0.85倍)
    // ※ 0.0なので急所が発動してしまうのを防ぐため別のロジックを使うか、そのまま1.5倍を加味するか。
    // 代わりに急所にならない0.05を指定
    mockRandom.mockReturnValue(0.05); // exactly not crit
    const resultMin = calculateDamage(ctx);
    // 100 * (0.85 + 0.05 * 0.15) = 100 * 0.8575 = 85.75
    // floor(85.75) = 85
    expect(resultMin.damage).toBe(85);
  });

  it('2.5 防御力無視 (Ignore DEF) テスト', () => {
    const ctx: DamageContext = {
      attacker: baseAttacker, defender: baseDefender, move: baseMove,
      attackerCurrentAtk: 100, defenderCurrentDef: 100,
      ignoreDefRatio: 0.5
    };
    // defense becomes 100 * (1 - 0.5) = 50
    // damage = 100 * (100 / 50) * 0.5 = 100
    // random: 0.999999...
    // floor(99.9999) = 99
    const result = calculateDamage(ctx);
    expect(result.damage).toBe(99);
  });

  it('2.6 威力0の技 (ステータス技) テスト', () => {
    const statusMove: MoveData = { ...baseMove, power: 0 };
    const ctx: DamageContext = {
      attacker: baseAttacker, defender: baseDefender, move: statusMove,
      attackerCurrentAtk: 100, defenderCurrentDef: 50
    };
    const result = calculateDamage(ctx);
    expect(result.damage).toBe(0);
  });
});

describe('3. 実践的シナリオテスト', () => {
  let mockRandom: jest.SpyInstance;

  beforeEach(() => {
    mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.999999);
  });
  afterEach(() => {
    mockRandom.mockRestore();
  });

  it('3.1 弱点攻撃（すぱろー vs どーじ）', () => {
    const sparrow: CharacterData = {
      id: 'c_sparrow', name: 'すぱろー', mentalType: '闇', elementalType: '氷',
      baseStats: { hp: 300, atk: 100, def: 30, spd: 100 }, moveIds: [], passiveId: 'p_none'
    };
    const doji: CharacterData = {
      id: 'c_doji', name: 'きさらぎどーじ', mentalType: '混沌', elementalType: '炎',
      baseStats: { hp: 350, atk: 80, def: 60, spd: 80 }, moveIds: [], passiveId: 'p_none'
    };
    const move: MoveData = {
      id: 'm_sparrow_1', name: '沈黙のダブル・ウイスキー', type: '闇', power: 20, spCost: 0, description: ''
    };
    // 20 * (100 / 60) * 0.5 * 2.0 * 1.5 = 50
    // random => 50 * 0.999999... = 49.9999... -> floor = 49
    const ctx: DamageContext = {
      attacker: sparrow, defender: doji, move,
      attackerCurrentAtk: 100, defenderCurrentDef: 60
    };
    const result = calculateDamage(ctx);
    expect(result.damage).toBe(49);
  });

  it('3.2 防御による被害軽減（アーリエス vs ちゃーこ）', () => {
    const aries: CharacterData = {
      id: 'c_aries', name: 'アーリエス', mentalType: '混沌', elementalType: '炎',
      baseStats: { hp: 400, atk: 85, def: 65, spd: 70 }, moveIds: [], passiveId: 'p_none'
    };
    const chaako: CharacterData = {
      id: 'c_chaako', name: 'ちゃーこ', mentalType: '光', elementalType: '氷',
      baseStats: { hp: 450, atk: 55, def: 95, spd: 60 }, moveIds: [], passiveId: 'p_none'
    };
    const move: MoveData = {
      id: 'm_aries_1', name: 'ゲーミング・バースト', type: '炎', power: 35, spCost: 0, description: ''
    };
    // 35 * (85 / 95) * 0.5 * 2.0 * 1.5 = 46.97...
    const ctx: DamageContext = {
      attacker: aries, defender: chaako, move,
      attackerCurrentAtk: 85, defenderCurrentDef: 95
    };
    const result = calculateDamage(ctx);
    expect(result.damage).toBe(46);
  });
});
