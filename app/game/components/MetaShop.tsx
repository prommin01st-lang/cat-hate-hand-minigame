'use client';

import React from 'react';
import styles from '../game.module.css';
import { MetaState, MetaUpgradeType } from '@/lib/gameTypes';
import { META_UPGRADES, getMetaUpgradeCost } from '@/lib/gameConfig';

interface MetaShopProps {
  meta: MetaState;
  onBuy: (type: MetaUpgradeType) => void;
  onClose: () => void;
}

export default function MetaShop({ meta, onBuy, onClose }: MetaShopProps) {
  return (
    <div className={styles.overlay}>
      <div className={`${styles.overlayCard} ${styles.metaShopCard}`}>
        <div className={styles.bigCat}>🐟</div>
        <h2>ร้านอัพเกรดถาวร</h2>
        <p>
          ปลาแห้งที่มี: <strong>{meta.fishTreats}</strong> 🐟
        </p>
        <div className={styles.metaGrid}>
          {META_UPGRADES.map((cfg) => {
            const currentLv = meta.upgrades[cfg.type] || 0;
            const cost = getMetaUpgradeCost(cfg, currentLv);
            const canBuy = currentLv < cfg.maxLevel && meta.fishTreats >= cost;
            const maxed = currentLv >= cfg.maxLevel;
            return (
              <div key={cfg.type} className={`${styles.metaCard} ${!canBuy && !maxed ? styles.locked : ''}`}>
                <div className={styles.metaEmoji}>{cfg.emoji}</div>
                <div className={styles.metaLabel}>{cfg.label}</div>
                <div className={styles.metaDesc}>{cfg.description}</div>
                <div className={styles.metaLevel}>
                  {maxed ? 'เต็มแล้ว!' : `Lv.${currentLv} / ${cfg.maxLevel}`}
                </div>
                {!maxed && (
                  <button
                    className={styles.metaBtn}
                    disabled={!canBuy}
                    onClick={() => onBuy(cfg.type)}
                  >
                    {cost} 🐟 ซื้อ
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button className={styles.btn} onClick={onClose}>← ปิด</button>
      </div>
    </div>
  );
}
