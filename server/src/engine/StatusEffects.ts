import { StatusCondition } from '../types';

export function applyStatusDamage(condition: StatusCondition, maxHp: number): number {
  switch (condition) {
    case '猛毒': return Math.floor(maxHp * 0.125);
    case '毒': return Math.floor(maxHp * 0.0625);
    case '炎上': return Math.floor(maxHp * 0.1);
    default: return 0;
  }
}

export function evaluateStatusAction(condition: StatusCondition): { canMove: boolean; selfDamage: number; isHealed: boolean } {
  let canMove = true;
  let selfDamage = 0;
  let isHealed = false;

  if (condition === '麻痺') {
    canMove = Math.random() > 0.25; // 25%で動けない
  } else if (condition === '凍結') {
    isHealed = Math.random() < 0.2; // 20%で解凍
    canMove = isHealed;
  } else if (condition === '混乱') {
    isHealed = Math.random() < 0.2; // 20%で治る
    if (!isHealed) {
      if (Math.random() < 0.33) {
        canMove = false;
        selfDamage = 15; // 暫定固定ダメージ
      }
    }
  } else if (condition === '暗闇') {
    isHealed = Math.random() < 0.2; // 20%で治る (行動不能にはならない)
  }

  return { canMove, selfDamage, isHealed };
}
