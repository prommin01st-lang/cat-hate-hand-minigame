'use client';

import React from 'react';
import styles from '../game.module.css';
import { SkillChoice, Skill } from '@/lib/gameTypes';
import { getSkillConfig } from '@/lib/gameConfig';

interface LevelUpOverlayProps {
  choices: SkillChoice[];
  currentSkills: Skill[];
  onPick: (choice: SkillChoice) => void;
}

export default function LevelUpOverlay({ choices, currentSkills, onPick }: LevelUpOverlayProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.overlayCard}>
        <div className={styles.bigCat}>⭐</div>
        <h2>Level Up!</h2>
        <p>เลือกสกิลหรืออัพเกรด</p>
        <div className={styles.upgradeGrid}>
          {choices.map((c, idx) => {
            const current = c.skillType ? currentSkills.find((s) => s.type === c.skillType) : undefined;
            const skillCfg = c.skillType ? getSkillConfig(c.skillType) : undefined;
            const isMaxed = c.kind === 'upgradeSkill' && current && skillCfg && current.level >= skillCfg.maxLevel;
            return (
              <div
                key={idx}
                className={`${styles.upgradeCard} ${isMaxed ? styles.locked : ''}`}
                onClick={() => !isMaxed && onPick(c)}
              >
                <div className={styles.upgradeEmoji}>{c.emoji}</div>
                <div className={styles.upgradeLabel}>{c.label}</div>
                <div className={styles.upgradeDesc}>{c.description}</div>
                {c.kind === 'upgradeSkill' && current && skillCfg && (
                  <div className={styles.skillLevel}>Lv.{current.level} → Lv.{Math.min(current.level + 1, skillCfg.maxLevel)}</div>
                )}
                {c.kind === 'newSkill' && skillCfg && (
                  <div className={styles.skillLevel}>ใหม่! (สูงสุด Lv.{skillCfg.maxLevel})</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
