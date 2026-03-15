import { PassiveData } from '../types';

export const passives: PassiveData[] = [
  { id: 'p_sparrow', name: '背水のダンディズム', description: '自分のHPが1の時、ATKとSPDが2倍になる', triggerEvent: 'ON_ATTACK' },
  { id: 'p_aries', name: '生放送の熱狂', description: '自分が状態異常の時、ATKが20%上昇', triggerEvent: 'ON_ATTACK' },
  { id: 'p_cell', name: '解釈一致の眼差し', description: 'ターン開始時に相手が選択した技が見える', triggerEvent: 'ON_TURN_START' },
  { id: 'p_chaako', name: '揺るがぬカプ愛', description: '交代で場に出た最初のターン、被ダメ30%軽減', triggerEvent: 'ON_SWITCH_IN' },
  { id: 'p_yamori', name: '「いいんじゃない？」', description: '状態異常の相手へのダメージが20%上昇', triggerEvent: 'ON_ATTACK' },
  { id: 'p_doji', name: '不滅のアイドル', description: '味方が最後1体の時、全ステータスアップ', triggerEvent: 'ON_LAST_STAND' },
  { id: 'p_yukishiro', name: '瑞兆の予報', description: 'ターン終了時に10%の確率でSP+1', triggerEvent: 'ON_TURN_END' },
  { id: 'p_maruhachi', name: '沼落ちの誘い', description: '状態異常の相手に技威力+15%', triggerEvent: 'ON_ATTACK' },
  { id: 'p_gocho', name: '削り出される闘志', description: '自分のHPが低いほど、ATKとDEFが上昇する', triggerEvent: 'ON_HP_CHANGE' },
  { id: 'p_yamigocho', name: '壊れた指揮棒', description: '自分のHPが半分以下の時、ATK1.5倍', triggerEvent: 'ON_ATTACK' }
];
