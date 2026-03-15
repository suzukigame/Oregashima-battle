import { getTypeMultiplier } from './TypeChart';
import { CharacterData, MoveData } from '../types';

export interface DamageContext {
  attacker: CharacterData;
  defender: CharacterData;
  move: MoveData;
  attackerCurrentAtk: number;
  defenderCurrentDef: number;
  ignoreDefRatio?: number;
}

export function calculateDamage(ctx: DamageContext): { damage: number; typeMod: number; isCrit: boolean; isStab: boolean } {
  if (ctx.move.power === 0) return { damage: 0, typeMod: 1, isCrit: false, isStab: false };

  const typeMod = getTypeMultiplier(ctx.move.type, ctx.defender.mentalType, ctx.defender.elementalType);
  const def = Math.max(1, ctx.defenderCurrentDef * (1 - (ctx.ignoreDefRatio || 0)));
  
  // 基本ダメージ = (技の威力 × (ATK / DEF) * 0.5) × 相性倍率
  let damage = (ctx.move.power * (ctx.attackerCurrentAtk / def) * 0.5) * typeMod;

  // 乱数 0.85 ~ 1.0 (ランダム成分補正前にさらに0.5がかかっていないことを確認・テストが通るように明確化)
  // なお、STABなどの前にfloorするか、最後だけfloorするかで誤差が出る場合がある
  // ここはそのまま
  const randomFactor = 0.85 + Math.random() * 0.15;
  damage *= randomFactor;

  // STAB (Same Type Attack Bonus)
  const isStab = ctx.move.type === ctx.attacker.mentalType || ctx.move.type === ctx.attacker.elementalType;
  if (isStab) {
    damage *= 1.5;
  }

  // 急所 (Critical Hit) - 5% 固定
  const isCrit = Math.random() < 0.05;
  if (isCrit) {
    damage *= 1.5;
  }

  return {
    damage: Math.floor(damage),
    typeMod,
    isCrit,
    isStab
  };
}
