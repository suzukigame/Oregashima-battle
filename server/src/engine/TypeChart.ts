import { MentalType, ElementalType, MoveType } from '../types';

export function getTypeMultiplier(moveType: MoveType, targetMental: MentalType, targetElemental: ElementalType): number {
  let multiplier = 1.0;

  // Mental Cycle: 闇 -> 混沌 -> 光 -> 闇
  if (moveType === '闇') {
    if (targetMental === '混沌') multiplier *= 2.0;
    if (targetMental === '光') multiplier *= 0.5;
  } else if (moveType === '混沌') {
    if (targetMental === '光') multiplier *= 2.0;
    if (targetMental === '闇') multiplier *= 0.5;
  } else if (moveType === '光') {
    if (targetMental === '闇') multiplier *= 2.0;
    if (targetMental === '混沌') multiplier *= 0.5;
  }

  // Elemental Cycle: 炎 -> 氷 -> 雷 -> 炎
  if (moveType === '炎') {
    if (targetElemental === '氷') multiplier *= 2.0;
    if (targetElemental === '雷') multiplier *= 0.5;
  } else if (moveType === '氷') {
    if (targetElemental === '雷') multiplier *= 2.0;
    if (targetElemental === '炎') multiplier *= 0.5;
  } else if (moveType === '雷') {
    if (targetElemental === '炎') multiplier *= 2.0;
    if (targetElemental === '氷') multiplier *= 0.5;
  }

  return multiplier;
}
