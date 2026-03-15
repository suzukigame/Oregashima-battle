import React from 'react';

interface Props {
  onClose: () => void;
}

export const HelpModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="help-modal">
        <div className="help-header">
          <h2>Oregashima Battle 遊び方ガイド</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="help-content">
          <section>
            <h3>1. ゲームの流れ</h3>
            <p><strong>選出:</strong> 10名のキャラクターから3名を選びます。</p>
            <p><strong>バトル:</strong> 1vs1の交代制バトルです。相手の3体を全て倒せば勝利！</p>
          </section>

          <section>
            <h3>2. ステータスの意味</h3>
            <ul>
              <li><strong>HP:</strong> 体力。0になると戦闘不能になります。</li>
              <li><strong>ATK:</strong> 攻撃力。高いほど相手に与えるダメージが増えます。</li>
              <li><strong>DEF:</strong> 防御力。高いほど受けるダメージを軽減します。</li>
              <li><strong>SPD:</strong> 素早さ。高い方から先に動けます。</li>
            </ul>
          </section>

          <section>
            <h3>3. SP（スキルポイント）システム</h3>
            <p>強力な技を使うにはSPが必要です。SPは <strong>キャラクターごと</strong> に個別に管理されます。</p>
            <ul>
              <li><strong>初期SP:</strong> 各キャラクターはバトル開始時、または初めて場に出た時に <strong>2</strong> を持っています。</li>
              <li><strong>SP回復:</strong> ターン開始時に <strong>場に出ているアクティブなキャラ</strong> のSPが <strong>+1</strong> されます。</li>
              <li><strong>SPの保持:</strong> キャラを交代してもSPは <strong>リセットされません。</strong> 再び場に出た時、交代前のSPから再開できます。</li>
              <li><strong>最大SP:</strong> 各キャラクター <strong>5</strong> まで溜めることが可能です。</li>
            </ul>
          </section>

          <section>
            <h3>4. 属性相性（重要！）</h3>
            <p>攻撃側の技属性と、防御側の各属性を比較してダメージが変動します。</p>
            <div className="type-guide">
              <div className="type-row">
                <strong>精神属性:</strong> 闇 → 混沌 → 光 → 闇
              </div>
              <div className="type-row">
                <strong>元素属性:</strong> 炎 → 氷 → 雷 → 炎
              </div>
              <p><small>※弱点をつくとダメージ1.5倍、いまひとつだと0.75倍になります。</small></p>
            </div>
          </section>

          <section>
            <h3>5. 特殊効果・テクニック</h3>
            <ul>
              <li><strong>自傷・反動:</strong> 一部の強力な技は自分もダメージを受けます。</li>
              <li><strong>背水の陣:</strong> 「HPが1になる」技などはリスクが高いですが、パッシブスキル等で逆転を狙える場合があります（例：すぱろー）。</li>
              <li><strong>フォームチェンジ:</strong> 特定の条件下で姿と性能が変わるキャラもいます。</li>
            </ul>
          </section>
        </div>

        <div className="help-footer">
          <button className="confirm-btn" onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
};
