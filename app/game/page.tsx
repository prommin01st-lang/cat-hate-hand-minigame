'use client';

import React, { useEffect, useRef, useReducer, useState, useCallback } from 'react';
import Link from 'next/link';
import styles from './game.module.css';
import { GameState, GameStatus, Hand, UpgradeType, Upgrade, ItemType, Skill, CatAttack, XPGem, SkillChoice, MetaState, MetaUpgradeType } from '@/lib/gameTypes';
import {
  ARENA_W, ARENA_H, CAT_SIZE, HAND_SIZE, BOSS_SIZE,
  CAT_SPEED_BASE, HAND_SPEEDS, getLevelConfig, getMaxLevel,
  HAND_EMOJI, BOSS_EMOJI, ITEM_EMOJI, UPGRADES,
  ITEM_SPAWN_INTERVAL, SPEED_BOOST_DURATION, SHIELD_DURATION_BASE,
  HAND_HP, SKILLS, getSkillConfig, getXPToLevel,
  getMetaUpgradeConfig, getMetaUpgradeCost,
  getTheme, getEndlessDifficulty,
} from '@/lib/gameConfig';
import { clamp, dist, angleTo, randRange, pickRandom, pickRandomN } from '@/lib/gameUtils';
import Joystick from './components/Joystick';
import LevelUpOverlay from './components/LevelUpOverlay';
import MetaShop from './components/MetaShop';
import { playMeow, playScratch, playFireball, playLightning, playMinePlace, playExplosion, playWhoosh, playHit, playItemCollect, playLevelUp, playXPGem, playGameOver, resumeAudio } from '@/lib/sound';

const IDLE_MESSAGES = [
  'ฉันเกลียดมือ 😾',
  'อย่าแตะต้อง!',
  'นิ่งเฉย… แต่ระวังอยู่',
  'มือบาดตาจริงๆ',
  'ไม่ชอบให้ลูบเลย',
];

const XP_VALUES: Record<string, number> = {
  normal: 5, fast: 8, big: 15, homer: 10, shooter: 10, cluster: 10, mini: 3,
};

function generateDecors(level: number, endless = false) {
  const theme = endless ? getTheme(5) : getTheme(level); // space theme for endless
  const decors = [];
  let id = 1;
  for (const d of theme.decors) {
    for (let i = 0; i < d.count; i++) {
      decors.push({
        id: id++,
        x: randRange(40, ARENA_W - 40),
        y: randRange(40, ARENA_H - 40),
        emoji: d.emoji,
        size: d.size,
        zIndex: d.zIndex,
      });
    }
  }
  return decors;
}

function createInitialState(level: number, meta: MetaState, betweenUpgrades: UpgradeType[] = [], endless = false): GameState {
  let maxHp = 3;
  let catSpeedMult = 1;
  let shieldDuration = SHIELD_DURATION_BASE;
  let scoreMult = 1;
  let itemLuck = 0;
  let catDamageMult = 1;
  let catRangeMult = 1;
  let catCooldownMult = 1;
  let magnetRange = 80;
  let xpGainMult = 1;
  let skillSlots = 4;

  for (const u of betweenUpgrades) {
    if (u === 'maxHp') maxHp = Math.min(5, maxHp + 1);
    if (u === 'catSpeed') catSpeedMult += 0.1;
    if (u === 'shieldDuration') shieldDuration += 2000;
    if (u === 'scoreMult') scoreMult += 0.1;
    if (u === 'itemLuck') itemLuck += 0.15;
  }

  // Apply meta upgrades
  const m = meta.upgrades;
  catSpeedMult += (m.baseSpeed || 0) * 0.05;
  catDamageMult += (m.baseDamage || 0) * 0.10;
  maxHp += (m.baseMaxHp || 0);
  xpGainMult += (m.xpGain || 0) * 0.10;
  magnetRange += (m.magnetRange || 0) * 12;
  skillSlots += (m.extraSkillSlot || 0);

  const startSkills: Skill[] = [{ type: 'scratch', level: 1, lastFire: 0 }];
  // Give scratch as starting skill so player can kill hands and earn XP

  const decors = generateDecors(level, endless);
  const theme = getTheme(endless ? 5 : level);

  return {
    catX: ARENA_W / 2,
    catY: ARENA_H / 2,
    catSpeedMult,
    catDamageMult,
    catRangeMult,
    catCooldownMult,
    shieldActive: false,
    shieldUntil: 0,
    speedBoostUntil: 0,
    hands: [],
    projectiles: [],
    boss: null,
    items: [],
    particles: [],
    score: 0,
    hp: maxHp,
    maxHp,
    combo: 0,
    scoreMult,
    itemLuck,
    shieldDuration,
    status: 'playing',
    level,
    upgrades: [...betweenUpgrades],
    startTime: 0,
    elapsed: 0,
    lastSpawn: 0,
    nextSpawnInterval: 0,
    lastBossTime: 0,
    lastDamageTime: 0,
    lastItemSpawn: 0,
    catMood: 'normal',
    catMoodUntil: 0,
    nextId: 1,
    idleMessageTime: 0,
    catLevel: 1,
    catXP: 0,
    xpToNext: getXPToLevel(1),
    skills: startSkills,
    attacks: [],
    xpGems: [],
    magnetRange,
    xpGainMult,
    endless,
    endlessWave: 0,
    decors,
    bgTheme: theme.name,
  };
}

function loadMeta(): MetaState {
  try {
    const raw = localStorage.getItem('catHatesHands_meta');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { fishTreats: 0, upgrades: { baseSpeed: 0, baseDamage: 0, baseMaxHp: 0, xpGain: 0, magnetRange: 0, fishBonus: 0, extraSkillSlot: 0 } };
}

function saveMeta(meta: MetaState) {
  localStorage.setItem('catHatesHands_meta', JSON.stringify(meta));
}

export default function GamePage() {
  const sRef = useRef<GameState>(createInitialState(1, loadMeta()));
  const keysRef = useRef(new Set<string>());
  const rafRef = useRef(0);
  const joystickRef = useRef({ dx: 0, dy: 0 });
  const [, forceRender] = useReducer((x) => x + 1, 0);

  const [overlay, setOverlay] = useState({
    score: 0, time: 0, hp: 3, combo: 0,
    status: 'levelSelect' as GameStatus,
    level: 1, maxHp: 3, shieldActive: false, speedBoost: false,
    catLevel: 1, catXP: 0, xpToNext: getXPToLevel(1),
    fishTreats: 0,
  });
  const [catMood, setCatMood] = useState<'normal' | 'hit' | 'scared'>('normal');
  const [maxLevelUnlocked, setMaxLevelUnlocked] = useState(1);
  const [upgradeChoices, setUpgradeChoices] = useState<Upgrade[]>([]);
  const [levelUpChoices, setLevelUpChoices] = useState<SkillChoice[]>([]);
  const [meta, setMeta] = useState<MetaState>(loadMeta);
  const [showMeta, setShowMeta] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('shop') === '1') {
      setShowMeta(true);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('catHatesHands_maxLevel');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) setMaxLevelUnlocked(Math.max(1, parsed));
    }
  }, []);

  const addParticle = (x: number, y: number, text: string) => {
    const s = sRef.current;
    s.particles.push({ id: s.nextId++, x, y, text, life: 1 });
  };

  const applyItem = (type: ItemType, now: number) => {
    const s = sRef.current;
    playItemCollect();
    switch (type) {
      case 'shield':
        s.shieldActive = true;
        s.shieldUntil = now + s.shieldDuration;
        addParticle(s.catX, s.catY - 50, 'โล่ขึ้น! 🛡️');
        break;
      case 'speed':
        s.speedBoostUntil = now + SPEED_BOOST_DURATION;
        addParticle(s.catX, s.catY - 50, 'เร็วขึ้น! ⚡');
        break;
      case 'bomb': {
        const count = s.hands.length;
        s.hands = [];
        s.projectiles = [];
        addParticle(s.catX, s.catY - 50, `ล้าง ${count} มือ! 💣`);
        if (s.boss && s.upgrades.includes('biggerBomb')) {
          s.boss.hp -= 1;
          addParticle(s.boss.x, s.boss.y, 'บอสเจ็บ! 💥');
          if (s.boss.hp <= 0) {
            s.boss = null;
            s.score += 300 * s.scoreMult;
            addParticle(ARENA_W / 2, ARENA_H / 2 - 40, 'บอสตาย! +300 🎉');
          }
        }
        break;
      }
      case 'heal':
        if (s.hp < s.maxHp) {
          s.hp += 1;
          addParticle(s.catX, s.catY - 50, 'ฮีล! +1 ❤️');
        } else {
          addParticle(s.catX, s.catY - 50, 'HP เต็มแล้ว! ✨');
        }
        break;
    }
  };

  const spawnHand = (now: number) => {
    const s = sRef.current;
    const levelCfg = getLevelConfig(s.level);
    const endlessCfg = s.endless ? getEndlessDifficulty(s.elapsed) : null;
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = Math.random() * ARENA_W; y = -HAND_SIZE; }
    else if (side === 1) { x = ARENA_W + HAND_SIZE; y = Math.random() * ARENA_H; }
    else if (side === 2) { x = Math.random() * ARENA_W; y = ARENA_H + HAND_SIZE; }
    else { x = -HAND_SIZE; y = Math.random() * ARENA_H; }

    const handTypes = endlessCfg ? endlessCfg.handTypes : levelCfg.handTypes;
    const speedMult = endlessCfg ? endlessCfg.speedMult : levelCfg.speedMult;
    const type = pickRandom(handTypes);
    const speed = HAND_SPEEDS[type] * speedMult + s.score / 6000;
    const dx = s.catX - x;
    const dy = s.catY - y;
    const d = Math.hypot(dx, dy) || 1;
    const vx = (dx / d) * speed;
    const vy = (dy / d) * speed;
    const angle = (Math.atan2(vy, vx) * 180) / Math.PI;
    const maxHp = HAND_HP[type];

    const hand: Hand = { id: s.nextId++, x, y, vx, vy, type, angle, hp: maxHp, maxHp };
    if (type === 'homer') hand.homerTimer = 90;
    if (type === 'shooter') hand.lastShot = now;
    s.hands.push(hand);
  };

  const spawnBoss = (now: number) => {
    const s = sRef.current;
    const levelCfg = getLevelConfig(s.level);
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = ARENA_W / 2; y = -BOSS_SIZE; }
    else if (side === 1) { x = ARENA_W + BOSS_SIZE; y = ARENA_H / 2; }
    else if (side === 2) { x = ARENA_W / 2; y = ARENA_H + BOSS_SIZE; }
    else { x = -BOSS_SIZE; y = ARENA_H / 2; }

    let maxHp = 1;
    if (levelCfg.bossType === 'dasher') maxHp = 2;
    if (levelCfg.bossType === 'spawner') maxHp = 3;

    s.boss = { x, y, startTime: now, type: levelCfg.bossType, hp: maxHp, maxHp };
    addParticle(ARENA_W / 2, ARENA_H / 2 - 40, '⚠️ บอสมาแล้ว!');
  };

  const spawnItem = () => {
    const s = sRef.current;
    const types: ItemType[] = ['shield', 'speed', 'bomb', 'heal'];
    const type = pickRandom(types);
    const x = randRange(60, ARENA_W - 60);
    const y = randRange(60, ARENA_H - 60);
    s.items.push({ id: s.nextId++, x, y, type, life: 1 });
  };

  const spawnXPGem = (x: number, y: number, handType: string) => {
    const s = sRef.current;
    const val = XP_VALUES[handType] || 5;
    s.xpGems.push({ id: s.nextId++, x, y, value: Math.floor(val * s.xpGainMult), magnetized: false });
  };

  const getSkillDamage = (skillType: string, level: number) => {
    const cfg = getSkillConfig(skillType);
    if (!cfg) return 0;
    const s = sRef.current;
    return cfg.baseDamage * (1 + (level - 1) * 0.3) * s.catDamageMult;
  };

  const getSkillCooldown = (skillType: string, level: number) => {
    const cfg = getSkillConfig(skillType);
    if (!cfg) return 99999;
    const s = sRef.current;
    return cfg.baseCooldown * Math.pow(0.9, level - 1) * s.catCooldownMult;
  };

  const getSkillRange = (skillType: string, level: number) => {
    const cfg = getSkillConfig(skillType);
    if (!cfg) return 0;
    const s = sRef.current;
    return cfg.baseRange * (1 + (level - 1) * 0.15) * s.catRangeMult;
  };

  const fireSkill = (skill: Skill, now: number) => {
    const s = sRef.current;
    const cfg = getSkillConfig(skill.type);
    if (!cfg) return;
    skill.lastFire = now;
    const dmg = getSkillDamage(skill.type, skill.level);
    const range = getSkillRange(skill.type, skill.level);

    switch (skill.type) {
      case 'scratch': {
        playScratch();
        // Instant area damage around cat
        for (const h of s.hands) {
          if (dist(s.catX, s.catY, h.x, h.y) < range) {
            h.hp -= dmg;
          }
        }
        if (s.boss && dist(s.catX, s.catY, s.boss.x, s.boss.y) < range + BOSS_SIZE / 2) {
          s.boss.hp -= dmg;
          if (s.boss.hp <= 0) {
            s.boss = null;
            s.score += 300 * s.scoreMult;
            addParticle(ARENA_W / 2, ARENA_H / 2 - 40, 'บอสตาย! +300 🎉');
          }
        }
        addParticle(s.catX, s.catY - 20, '🐾');
        break;
      }
      case 'whirlwind': {
        playScratch();
        // Create a timed attack around cat
        s.attacks.push({
          id: s.nextId++,
          x: s.catX,
          y: s.catY,
          vx: 0,
          vy: 0,
          angle: 0,
          type: 'whirlwind',
          damage: dmg,
          range,
          life: 400,
          maxLife: 400,
        });
        break;
      }
      case 'fireball': {
        playFireball();
        // Shoot fireball toward cat facing direction (use last movement)
        const keys = keysRef.current;
        let fdx = 0, fdy = 0;
        if (keys.has('ArrowUp')) fdy -= 1;
        if (keys.has('ArrowDown')) fdy += 1;
        if (keys.has('ArrowLeft')) fdx -= 1;
        if (keys.has('ArrowRight')) fdx += 1;
        if (joystickRef.current.dx !== 0 || joystickRef.current.dy !== 0) {
          fdx = joystickRef.current.dx;
          fdy = joystickRef.current.dy;
        }
        if (fdx === 0 && fdy === 0) fdx = 1;
        const flen = Math.hypot(fdx, fdy) || 1;
        const spd = 6;
        s.attacks.push({
          id: s.nextId++,
          x: s.catX,
          y: s.catY,
          vx: (fdx / flen) * spd,
          vy: (fdy / flen) * spd,
          angle: (Math.atan2(fdy, fdx) * 180) / Math.PI,
          type: 'fireball',
          damage: dmg,
          range,
          life: Math.floor(range / spd * 16.67),
          maxLife: Math.floor(range / spd * 16.67),
        });
        break;
      }
      case 'lightning': {
        playLightning();
        // Find nearest hand and strike
        let nearest: Hand | null = null;
        let nearestDist = Infinity;
        for (const h of s.hands) {
          const d = dist(s.catX, s.catY, h.x, h.y);
          if (d < range && d < nearestDist) {
            nearest = h;
            nearestDist = d;
          }
        }
        if (nearest) {
          nearest.hp -= dmg;
          addParticle(nearest.x, nearest.y - 30, '⚡');
        } else if (s.boss && dist(s.catX, s.catY, s.boss.x, s.boss.y) < range + BOSS_SIZE / 2) {
          s.boss.hp -= dmg;
          addParticle(s.boss.x, s.boss.y - 40, '⚡');
        }
        break;
      }
      case 'mine': {
        playMinePlace();
        const mx = randRange(60, ARENA_W - 60);
        const my = randRange(60, ARENA_H - 60);
        s.attacks.push({
          id: s.nextId++,
          x: mx,
          y: my,
          vx: 0,
          vy: 0,
          angle: 0,
          type: 'mine',
          damage: dmg,
          range,
          life: 8000,
          maxLife: 8000,
        });
        addParticle(mx, my - 20, '🐟');
        break;
      }
    }
  };

  const checkHit = (cx: number, cy: number, hx: number, hy: number, size: number) => {
    return dist(cx, cy, hx, hy) < (CAT_SIZE + size) / 2.4;
  };

  const handleDamage = (now: number, msg: string, dmg: number) => {
    const s = sRef.current;
    if (s.shieldActive) {
      s.shieldActive = false;
      playHit();
      addParticle(s.catX, s.catY - 50, 'โล่แตก! 🛡️💥');
      return true;
    }
    if (now - s.lastDamageTime > 800) {
      s.hp -= dmg;
      s.lastDamageTime = now;
      playHit();
      s.catMood = 'hit';
      s.catMoodUntil = now + 500;
      s.combo = 0;
      addParticle(s.catX, s.catY - 50, msg);
      setCatMood('hit');
      if (s.hp <= 0) {
        s.status = 'gameover';
        playGameOver();
        addParticle(ARENA_W / 2, ARENA_H / 2 - 20, 'GAME OVER 😾');
        const elapsed = s.elapsed;
        const fish = Math.floor(s.score / 100 * (1 + (meta.upgrades.fishBonus || 0) * 0.10));
        setMeta(prev => {
          const next = { ...prev, fishTreats: prev.fishTreats + fish };
          saveMeta(next);
          return next;
        });
        setOverlay({ score: Math.floor(s.score), time: Math.floor(elapsed), hp: 0, combo: 0, status: 'gameover', level: s.level, maxHp: s.maxHp, shieldActive: false, speedBoost: false, catLevel: s.catLevel, catXP: s.catXP, xpToNext: s.xpToNext, fishTreats: fish });
        return true;
      }
    }
    return false;
  };

  const generateSkillChoices = (): SkillChoice[] => {
    const s = sRef.current;
    const choices: SkillChoice[] = [];
    const allSkillTypes = SKILLS.map(sk => sk.type);
    const ownedTypes = new Set(s.skills.map(sk => sk.type));
    const unowned = allSkillTypes.filter(t => !ownedTypes.has(t));
    const canAddNew = s.skills.length < (4 + (meta.upgrades.extraSkillSlot || 0));

    // New skill options
    if (canAddNew && unowned.length > 0) {
      for (const type of pickRandomN(unowned, Math.min(2, unowned.length))) {
        const cfg = getSkillConfig(type);
        if (cfg) {
          choices.push({ kind: 'newSkill', skillType: type, label: cfg.label, emoji: cfg.emoji, description: cfg.description });
        }
      }
    }

    // Upgrade existing skills
    const upgradeable = s.skills.filter(sk => {
      const cfg = getSkillConfig(sk.type);
      return cfg && sk.level < cfg.maxLevel;
    });
    if (upgradeable.length > 0) {
      for (const sk of pickRandomN(upgradeable, Math.min(2, upgradeable.length))) {
        const cfg = getSkillConfig(sk.type);
        if (cfg) {
          choices.push({ kind: 'upgradeSkill', skillType: sk.type, label: `${cfg.label} +1`, emoji: cfg.emoji, description: 'เพิ่มเลเวลสกิล' });
        }
      }
    }

    // Stat boosts
    const statBoosts: SkillChoice[] = [
      { kind: 'statBoost', statType: 'maxHp', label: 'HP +1', emoji: '❤️', description: 'HP สูงสุด +1' },
      { kind: 'statBoost', statType: 'speed', label: 'ความเร็ว +10%', emoji: '🐾', description: 'ความเร็วแมว +10%' },
      { kind: 'statBoost', statType: 'damage', label: 'ดาเมจ +15%', emoji: '🔪', description: 'ดาเมจสกิล +15%' },
      { kind: 'statBoost', statType: 'range', label: 'ระยะ +15%', emoji: '📏', description: 'ระยะสกิล +15%' },
      { kind: 'statBoost', statType: 'cooldown', label: 'คูลดาวน์ -10%', emoji: '⏱️', description: 'คูลดาวน์สกิล -10%' },
    ];
    choices.push(...pickRandomN(statBoosts, Math.min(2, statBoosts.length)));

    return pickRandomN(choices, 3);
  };

  const handlePickSkillChoice = (choice: SkillChoice) => {
    const s = sRef.current;
    if (choice.kind === 'newSkill' && choice.skillType) {
      s.skills.push({ type: choice.skillType, level: 1, lastFire: 0 });
    } else if (choice.kind === 'upgradeSkill' && choice.skillType) {
      const sk = s.skills.find(sk => sk.type === choice.skillType);
      if (sk) sk.level += 1;
    } else if (choice.kind === 'statBoost' && choice.statType) {
      switch (choice.statType) {
        case 'maxHp': s.maxHp += 1; s.hp += 1; break;
        case 'speed': s.catSpeedMult += 0.1; break;
        case 'damage': s.catDamageMult += 0.15; break;
        case 'range': s.catRangeMult += 0.15; break;
        case 'cooldown': s.catCooldownMult *= 0.9; break;
      }
    }
    s.catXP = 0;
    s.catLevel += 1;
    s.xpToNext = getXPToLevel(s.catLevel);
    s.status = 'playing';
    setOverlay(prev => ({ ...prev, status: 'playing', catLevel: s.catLevel, catXP: 0, xpToNext: s.xpToNext, maxHp: s.maxHp, hp: s.hp }));
    setLevelUpChoices([]);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = useCallback((now: number) => {
    const s = sRef.current;
    if (s.status !== 'playing') return;

    const levelCfg = getLevelConfig(s.level);
    const elapsed = (now - s.startTime) / 1000;
    s.elapsed = elapsed;

    // Endless mode: progressive difficulty, no timer
    const endlessCfg = s.endless ? getEndlessDifficulty(elapsed) : null;

    if (!s.endless && elapsed >= levelCfg.duration) {
      s.status = 'levelComplete';
      addParticle(ARENA_W / 2, ARENA_H / 2 - 20, `ผ่านด่าน ${s.level}! 🎉`);
      setOverlay({ score: Math.floor(s.score), time: Math.floor(elapsed), hp: s.hp, combo: s.combo, status: 'levelComplete', level: s.level, maxHp: s.maxHp, shieldActive: s.shieldActive, speedBoost: now < s.speedBoostUntil, catLevel: s.catLevel, catXP: s.catXP, xpToNext: s.xpToNext, fishTreats: 0 });
      forceRender();
      return;
    }

    // Cat movement (keyboard + joystick)
    const keys = keysRef.current;
    let dx = 0, dy = 0;
    if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dy -= 1;
    if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) dy += 1;
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dx -= 1;
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx += 1;

    if (joystickRef.current.dx !== 0 || joystickRef.current.dy !== 0) {
      dx = joystickRef.current.dx;
      dy = joystickRef.current.dy;
    }

    let speed = CAT_SPEED_BASE * s.catSpeedMult;
    if (now < s.speedBoostUntil) speed *= 1.5;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy) || 1;
      s.catX += (dx / len) * speed;
      s.catY += (dy / len) * speed;
      s.idleMessageTime = now + 4000;
    } else {
      if (now > s.idleMessageTime && s.status === 'playing') {
        s.idleMessageTime = now + 5000;
        addParticle(s.catX, s.catY - 45, IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)]);
      }
    }

    s.catX = clamp(s.catX, CAT_SIZE / 2, ARENA_W - CAT_SIZE / 2);
    s.catY = clamp(s.catY, CAT_SIZE / 2, ARENA_H - CAT_SIZE / 2);

    // Shield expiration
    if (s.shieldActive && now > s.shieldUntil) {
      s.shieldActive = false;
    }

    // Auto-attack: fire skills on cooldown
    for (const skill of s.skills) {
      if (now - skill.lastFire > getSkillCooldown(skill.type, skill.level)) {
        fireSkill(skill, now);
      }
    }

    // Update attacks (projectiles + timed effects)
    for (let i = s.attacks.length - 1; i >= 0; i--) {
      const atk = s.attacks[i];
      atk.life -= 16.67; // approx 1 frame at 60fps

      if (atk.type === 'fireball') {
        atk.x += atk.vx;
        atk.y += atk.vy;
      } else if (atk.type === 'whirlwind') {
        atk.x = s.catX;
        atk.y = s.catY;
      }

      // Hit detection for attacks vs hands
      for (const h of s.hands) {
        if (dist(atk.x, atk.y, h.x, h.y) < atk.range) {
          if (atk.type === 'mine') {
            // Mine explodes once
            h.hp -= atk.damage;
            addParticle(atk.x, atk.y, 'บึ้ม! 💥');
            atk.life = 0;
            break;
          } else if (atk.type === 'whirlwind') {
            h.hp -= atk.damage * 0.05; // continuous damage per frame
          } else {
            h.hp -= atk.damage;
            if (atk.type === 'fireball') atk.life = 0; // single hit
          }
        }
      }

      // Hit detection for attacks vs boss
      if (s.boss && dist(atk.x, atk.y, s.boss.x, s.boss.y) < atk.range + BOSS_SIZE / 2) {
        if (atk.type === 'mine') {
          s.boss.hp -= atk.damage;
          addParticle(atk.x, atk.y, 'บึ้ม! 💥');
          atk.life = 0;
        } else if (atk.type === 'whirlwind') {
          s.boss.hp -= atk.damage * 0.05;
        } else {
          s.boss.hp -= atk.damage;
          if (atk.type === 'fireball') atk.life = 0;
        }
        if (s.boss.hp <= 0) {
          s.boss = null;
          s.score += 300 * s.scoreMult;
          addParticle(ARENA_W / 2, ARENA_H / 2 - 40, 'บอสตาย! +300 🎉');
        }
      }

      const out = atk.x < -200 || atk.x > ARENA_W + 200 || atk.y < -200 || atk.y > ARENA_H + 200;
      if (out || atk.life <= 0) {
        s.attacks.splice(i, 1);
      }
    }

    // Spawn hands
    if (now - s.lastSpawn > s.nextSpawnInterval) {
      spawnHand(now);
      s.lastSpawn = now;
      if (s.endless && endlessCfg) {
        const progress = Math.min(1, elapsed / 300); // scale over 5 minutes
        s.nextSpawnInterval = Math.max(endlessCfg.spawnMin, endlessCfg.spawnBase - progress * (endlessCfg.spawnBase - endlessCfg.spawnMin));
      } else {
        const progress = elapsed / levelCfg.duration;
        s.nextSpawnInterval = Math.max(levelCfg.spawnMin, levelCfg.spawnBase - progress * (levelCfg.spawnBase - levelCfg.spawnMin));
      }
    }

    // Spawn boss
    const bossInterval = s.endless && endlessCfg ? endlessCfg.bossEvery : levelCfg.bossEvery;
    if (!s.boss && now - s.lastBossTime > bossInterval) {
      spawnBoss(now);
      s.lastBossTime = now;
    }

    // Spawn items
    const itemChance = s.endless ? 0.2 + Math.min(0.15, elapsed / 600) : levelCfg.itemChance;
    if (now - s.lastItemSpawn > ITEM_SPAWN_INTERVAL * (1 - s.itemLuck)) {
      if (Math.random() < itemChance) spawnItem();
      s.lastItemSpawn = now;
    }

    // Update items & collect
    for (let i = s.items.length - 1; i >= 0; i--) {
      const item = s.items[i];
      if (dist(s.catX, s.catY, item.x, item.y) < (CAT_SIZE + 36) / 2) {
        applyItem(item.type, now);
        s.items.splice(i, 1);
        continue;
      }
      item.life -= 0.003;
      if (item.life <= 0) s.items.splice(i, 1);
    }

    // Update hands (movement, death, collision)
    const currentSpeedMult = s.endless && endlessCfg ? endlessCfg.speedMult : levelCfg.speedMult;
    for (let i = s.hands.length - 1; i >= 0; i--) {
      const h = s.hands[i];

      if (h.type === 'homer' && (h.homerTimer || 0) > 0) {
        h.homerTimer! -= 1;
        const a = angleTo(h.x, h.y, s.catX, s.catY);
        const spd = HAND_SPEEDS[h.type] * currentSpeedMult + s.score / 6000;
        h.vx = Math.cos(a) * spd;
        h.vy = Math.sin(a) * spd;
      }

      if (h.type === 'shooter' && (now - (h.lastShot || 0)) > 2000) {
        h.lastShot = now;
        const a = angleTo(h.x, h.y, s.catX, s.catY);
        const ps = 4.5;
        s.projectiles.push({ id: s.nextId++, x: h.x, y: h.y, vx: Math.cos(a) * ps, vy: Math.sin(a) * ps, angle: (a * 180) / Math.PI });
      }

      h.x += h.vx;
      h.y += h.vy;

      // Cluster split
      if (h.type === 'cluster' && !h.split && dist(s.catX, s.catY, h.x, h.y) < 120) {
        h.split = true;
        for (let j = 0; j < 3; j++) {
          const a = ((Math.PI * 2) / 3) * j + Math.random() * 0.5;
          s.hands.push({ id: s.nextId++, x: h.x, y: h.y, vx: Math.cos(a) * 3.5, vy: Math.sin(a) * 3.5, type: 'mini', angle: (a * 180) / Math.PI, hp: HAND_HP.mini, maxHp: HAND_HP.mini });
        }
        addParticle(h.x, h.y, 'แตก! 💥');
        s.hands.splice(i, 1);
        continue;
      }

      // Hand death from HP
      if (h.hp <= 0) {
        spawnXPGem(h.x, h.y, h.type);
        s.hands.splice(i, 1);
        s.score += 10 * s.scoreMult;
        s.combo++;
        if (s.combo > 0 && s.combo % 5 === 0) {
          addParticle(s.catX, s.catY - 50, `Combo x${s.combo} 🔥`);
        }
        continue;
      }

      const out = h.x < -120 || h.x > ARENA_W + 120 || h.y < -120 || h.y > ARENA_H + 120;
      if (out) {
        s.hands.splice(i, 1);
        s.score += 10 * s.scoreMult;
        s.combo++;
        if (s.combo > 0 && s.combo % 5 === 0) {
          addParticle(s.catX, s.catY - 50, `Combo x${s.combo} 🔥`);
        }
        continue;
      }

      const size = h.type === 'big' ? HAND_SIZE * 1.4 : h.type === 'mini' ? HAND_SIZE * 0.6 : HAND_SIZE;
      if (checkHit(s.catX, s.catY, h.x, h.y, size)) {
        handleDamage(now, 'โดนลูบ! 😿', 1);
        if (sRef.current.status === 'gameover') return;
        s.hands.splice(i, 1);
      }
    }

    // Update boss projectiles
    for (let i = s.projectiles.length - 1; i >= 0; i--) {
      const p = s.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      const out = p.x < -50 || p.x > ARENA_W + 50 || p.y < -50 || p.y > ARENA_H + 50;
      if (out) { s.projectiles.splice(i, 1); continue; }
      if (checkHit(s.catX, s.catY, p.x, p.y, 20)) {
        handleDamage(now, 'โดนกระสุน! 💨', 1);
        if (sRef.current.status === 'gameover') return;
        s.projectiles.splice(i, 1);
      }
    }

    // Update boss
    if (s.boss) {
      const b = s.boss;
      const elapsedBoss = now - b.startTime;

      if (b.type === 'chaser') {
        const bdx = s.catX - b.x;
        const bdy = s.catY - b.y;
        const bdist = Math.hypot(bdx, bdy) || 1;
        const bspeed = 3.0 + s.score / 5000;
        b.x += (bdx / bdist) * bspeed;
        b.y += (bdy / bdist) * bspeed;
      } else if (b.type === 'dasher') {
        if (b.dashing && b.dashVx !== undefined && b.dashVy !== undefined) {
          b.x += b.dashVx;
          b.y += b.dashVy;
          if (now - (b.lastDash || 0) > 1000) b.dashing = false;
        } else {
          const bdx = s.catX - b.x;
          const bdy = s.catY - b.y;
          const bdist = Math.hypot(bdx, bdy) || 1;
          const bspeed = 2.2;
          b.x += (bdx / bdist) * bspeed;
          b.y += (bdy / bdist) * bspeed;
          if (now - (b.lastDash || 0) > 3000) {
            b.dashing = true;
            b.lastDash = now;
            const dashSpeed = 10 + s.score / 5000;
            b.dashVx = (bdx / bdist) * dashSpeed;
            b.dashVy = (bdy / bdist) * dashSpeed;
          }
        }
      } else if (b.type === 'spawner') {
        const bdx = s.catX - b.x;
        const bdy = s.catY - b.y;
        const bdist = Math.hypot(bdx, bdy) || 1;
        const bspeed = 2.5 + s.score / 5000;
        b.x += (bdx / bdist) * bspeed;
        b.y += (bdy / bdist) * bspeed;
        if (now - (b.lastSpawn || 0) > 2000) {
          b.lastSpawn = now;
          for (let j = 0; j < 2; j++) {
            const a = Math.random() * Math.PI * 2;
            s.hands.push({ id: s.nextId++, x: b.x + Math.cos(a) * 40, y: b.y + Math.sin(a) * 40, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, type: 'mini', angle: (a * 180) / Math.PI, hp: HAND_HP.mini, maxHp: HAND_HP.mini });
          }
          addParticle(b.x, b.y, 'สปอร์น! 👿');
        }
      }

      if (checkHit(s.catX, s.catY, b.x, b.y, BOSS_SIZE)) {
        handleDamage(now, 'โดนบอสสลาตัน! 💥', 2);
        if (sRef.current.status === 'gameover') return;
      }

      if (!s.endless && elapsedBoss > levelCfg.bossDuration) {
        s.boss = null;
        s.score += 150 * s.scoreMult;
        addParticle(ARENA_W / 2, ARENA_H / 2 - 40, 'บอสหนีไป! +150 🎉');
      }
    }

    // Update XP gems
    for (let i = s.xpGems.length - 1; i >= 0; i--) {
      const gem = s.xpGems[i];
      const d = dist(s.catX, s.catY, gem.x, gem.y);
      if (d < s.magnetRange) {
        gem.magnetized = true;
      }
      if (gem.magnetized) {
        const a = angleTo(gem.x, gem.y, s.catX, s.catY);
        const spd = Math.min(8, d * 0.15 + 2);
        gem.x += Math.cos(a) * spd;
        gem.y += Math.sin(a) * spd;
      }
      if (d < CAT_SIZE / 2 + 10) {
        s.catXP += gem.value;
        s.xpGems.splice(i, 1);
        playXPGem();
        // Check level up
        if (s.catXP >= s.xpToNext) {
          s.status = 'levelUp';
          playLevelUp();
          const choices = generateSkillChoices();
          setLevelUpChoices(choices);
          setOverlay(prev => ({ ...prev, status: 'levelUp', catLevel: s.catLevel, catXP: s.catXP, xpToNext: s.xpToNext }));
          forceRender();
          return;
        }
      }
    }

    // Recover mood
    if (s.catMood !== 'normal' && now > s.catMoodUntil) {
      s.catMood = 'normal';
      setCatMood('normal');
    }

    if (s.catMood === 'normal' && s.status === 'playing') {
      let close = false;
      for (const h of s.hands) { if (dist(s.catX, s.catY, h.x, h.y) < 120) { close = true; break; } }
      if (close) { s.catMood = 'scared'; setCatMood('scared'); }
    } else if (s.catMood === 'scared') {
      let close = false;
      for (const h of s.hands) { if (dist(s.catX, s.catY, h.x, h.y) < 140) { close = true; break; } }
      if (!close) { s.catMood = 'normal'; setCatMood('normal'); }
    }

    // Particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      s.particles[i].life -= 0.014;
      if (s.particles[i].life <= 0) s.particles.splice(i, 1);
    }

    // Passive score
    s.score += 0.4 * s.scoreMult;

    setOverlay({
      score: Math.floor(s.score),
      time: Math.floor(elapsed),
      hp: s.hp,
      combo: s.combo,
      status: s.status,
      level: s.level,
      maxHp: s.maxHp,
      shieldActive: s.shieldActive,
      speedBoost: now < s.speedBoostUntil,
      catLevel: s.catLevel,
      catXP: s.catXP,
      xpToNext: s.xpToNext,
      fishTreats: 0,
    });

    forceRender();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const startLevel = useCallback((level: number, betweenUpgrades: UpgradeType[], endless = false) => {
    const m = loadMeta();
    setMeta(m);
    const s = createInitialState(level, m, betweenUpgrades, endless);
    const now = performance.now();
    s.startTime = now;
    s.lastSpawn = now;
    s.nextSpawnInterval = endless ? 1200 : getLevelConfig(level).spawnBase;
    s.lastBossTime = now;
    s.lastItemSpawn = now;
    s.idleMessageTime = now + 4000;
    sRef.current = s;
    setCatMood('normal');
    setOverlay({ score: 0, time: 0, hp: s.hp, combo: 0, status: 'playing', level, maxHp: s.maxHp, shieldActive: false, speedBoost: false, catLevel: 1, catXP: 0, xpToNext: s.xpToNext, fishTreats: 0 });
    setLevelUpChoices([]);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const handleNextLevel = useCallback(() => {
    const choices = pickRandomN(UPGRADES, 3);
    setUpgradeChoices(choices);
    sRef.current.status = 'upgrade';
    setOverlay(prev => ({ ...prev, status: 'upgrade' }));
  }, []);

  const handlePickUpgrade = useCallback((upgrade: Upgrade) => {
    const s = sRef.current;
    const newUpgrades = [...s.upgrades, upgrade.type];
    s.upgrades = newUpgrades;
    const nextLevel = s.level + 1;
    const newMax = Math.max(maxLevelUnlocked, nextLevel);
    setMaxLevelUnlocked(newMax);
    localStorage.setItem('catHatesHands_maxLevel', String(newMax));
    if (nextLevel > getMaxLevel()) {
      const fish = Math.floor(s.score / 100 * (1 + (meta.upgrades.fishBonus || 0) * 0.10));
      setMeta(prev => {
        const next = { ...prev, fishTreats: prev.fishTreats + fish };
        saveMeta(next);
        return next;
      });
      s.status = 'gameover';
      setOverlay(prev => ({ ...prev, status: 'gameover', score: Math.floor(s.score), time: Math.floor(s.elapsed), fishTreats: fish }));
    } else {
      startLevel(nextLevel, newUpgrades);
    }
  }, [maxLevelUnlocked, meta, startLevel]);

  const handleRetry = useCallback(() => {
    const s = sRef.current;
    startLevel(s.level, [], s.endless);
  }, [startLevel]);

  const handleBackToMenu = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    sRef.current.status = 'levelSelect';
    setOverlay(prev => ({ ...prev, status: 'levelSelect' }));
    setShowMeta(false);
  }, []);

  const handleBuyMeta = useCallback((type: MetaUpgradeType) => {
    setMeta(prev => {
      const cfg = getMetaUpgradeConfig(type);
      if (!cfg) return prev;
      const currentLv = prev.upgrades[type] || 0;
      if (currentLv >= cfg.maxLevel) return prev;
      const cost = getMetaUpgradeCost(cfg, currentLv);
      if (prev.fishTreats < cost) return prev;
      const next = {
        ...prev,
        fishTreats: prev.fishTreats - cost,
        upgrades: { ...prev.upgrades, [type]: currentLv + 1 },
      };
      saveMeta(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
        keysRef.current.add(e.key);
      }
      if (e.key === ' ' || e.key === 'Enter') {
        const status = sRef.current.status;
        if (status === 'gameover') {
          e.preventDefault();
          handleRetry();
        } else if (status === 'levelComplete') {
          e.preventDefault();
          handleNextLevel();
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleRetry, handleNextLevel]);

  const s = sRef.current;
  const catEmoji = catMood === 'hit' ? '😾' : catMood === 'scared' ? '😿' : '🐱';
  const nowPerf = typeof performance !== 'undefined' ? performance.now() : 0;
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

  return (
    <div className={styles.page}>
      <div className={styles.hud}>
        <div className={styles.hudLeft}>
          <span className={styles.scoreLabel}>คะแนน:</span>
          <span className={styles.scoreVal}>{overlay.score}</span>
          <span className={styles.timeLabel}>{overlay.time} วิ</span>
          {overlay.status === 'playing' && (
            <span className={styles.levelBadge}>
              {sRef.current.endless ? `ไม่มีวันจบ` : `ด่าน ${overlay.level}`}
            </span>
          )}
          <span className={styles.levelBadge} style={{ background: '#7c4dff' }}>Lv.{overlay.catLevel}</span>
        </div>
        <div className={styles.hudRight}>
          <span className={styles.combo}>{overlay.combo > 0 ? `Combo x${overlay.combo}` : ''}</span>
          <span className={styles.buffIcons}>
            {overlay.shieldActive && '🛡️'}
            {overlay.speedBoost && '⚡'}
          </span>
          <span className={styles.hp}>
            {'❤️'.repeat(Math.max(0, overlay.hp))}
            {'🖤'.repeat(Math.max(0, overlay.maxHp - overlay.hp))}
          </span>
        </div>
      </div>

      {/* XP Bar */}
      {overlay.status === 'playing' && (
        <div className={styles.xpBarWrapper}>
          <div className={styles.xpBar}>
            <div
              className={styles.xpBarFill}
              style={{ width: `${Math.min(100, (overlay.catXP / overlay.xpToNext) * 100)}%` }}
            />
          </div>
          <span className={styles.xpLabel}>XP {overlay.catXP}/{overlay.xpToNext}</span>
        </div>
      )}

      <div
        className={styles.arena}
        style={{
          background: s.endless
            ? 'linear-gradient(135deg, #1a1025 0%, #2d1b4e 50%, #1a1025 100%)'
            : undefined,
          borderColor: s.endless ? '#7c4dff' : undefined,
        }}
      >
        <div
          className={styles.bgGrid}
          style={s.endless ? {
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(124, 77, 255, 0.08) 49px, rgba(124, 77, 255, 0.08) 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(124, 77, 255, 0.08) 49px, rgba(124, 77, 255, 0.08) 50px)',
          } : undefined}
        />

        {/* Decorations */}
        {s.decors.map((d) => (
          <div
            key={d.id}
            className={styles.decor}
            style={{
              left: `${d.x}px`,
              top: `${d.y}px`,
              fontSize: `${d.size}px`,
              zIndex: d.zIndex,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {d.emoji}
          </div>
        ))}

        {/* Level Select */}
        {overlay.status === 'levelSelect' && !showMeta && (
          <div className={styles.levelSelect}>
            <div className={styles.levelSelectCard}>
              <div className={styles.bigCat}>🐱</div>
              <h2>เลือกด่าน</h2>
              <div className={styles.levelGrid}>
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const cfg = getLevelConfig(lvl);
                  const locked = lvl > maxLevelUnlocked;
                  return (
                    <div
                      key={lvl}
                      className={`${styles.levelCard} ${locked ? styles.locked : ''}`}
                      onClick={() => { resumeAudio(); if (!locked) startLevel(lvl, []); }}
                    >
                      <div className={styles.levelNumber}>{lvl}</div>
                      <div className={styles.levelName}>{cfg.name}</div>
                      <div className={styles.levelInfo}>{cfg.duration} วิ | {cfg.handTypes.length} มือ</div>
                    </div>
                  );
                })}
                <div
                  key="endless"
                  className={`${styles.levelCard} ${styles.endlessCard}`}
                  onClick={() => { resumeAudio(); startLevel(1, [], true); }}
                >
                  <div className={styles.levelNumber}>∞</div>
                  <div className={styles.levelName}>ไม่มีวันจบ</div>
                  <div className={styles.levelInfo}>เล่นเรื่อยๆ ยากขึ้นทุกนาที</div>
                </div>
              </div>
              <button className={styles.btn} style={{ marginTop: '1rem' }} onClick={() => setShowMeta(true)}>
                ⬆ อัพเกรดถาวร
              </button>
              <Link href="/" className={styles.backLink}>← กลับหน้าแรก</Link>
            </div>
          </div>
        )}

        {/* Level Complete */}
        {overlay.status === 'levelComplete' && (
          <div className={styles.overlay}>
            <div className={styles.overlayCard}>
              <div className={styles.bigCat}>🎉</div>
              <h2>ผ่านด่าน {overlay.level}!</h2>
              <p className={styles.finalScore}>คะแนน: {overlay.score}</p>
              <p>รอดมาได้: {overlay.time} วินาที</p>
              <button className={styles.btn} onClick={handleNextLevel}>
                ▶ ต่อไปเลือกอัพเกรด (Space)
              </button>
            </div>
          </div>
        )}

        {/* Upgrade */}
        {overlay.status === 'upgrade' && (
          <div className={styles.overlay}>
            <div className={styles.overlayCard}>
              <div className={styles.bigCat}>🎁</div>
              <h2>เลือกอัพเกรด!</h2>
              <p>อัพเกรดจะมีผลในรอบนี้เท่านั้น</p>
              <div className={styles.upgradeGrid}>
                {upgradeChoices.map((u) => (
                  <div key={u.type} className={styles.upgradeCard} onClick={() => handlePickUpgrade(u)}>
                    <div className={styles.upgradeEmoji}>{u.emoji}</div>
                    <div className={styles.upgradeLabel}>{u.label}</div>
                    <div className={styles.upgradeDesc}>{u.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Level Up */}
        {overlay.status === 'levelUp' && (
          <LevelUpOverlay choices={levelUpChoices} currentSkills={s.skills} onPick={handlePickSkillChoice} />
        )}

        {/* Game Over */}
        {overlay.status === 'gameover' && (
          <div className={styles.overlay}>
            <div className={styles.overlayCard}>
              <div className={`${styles.bigCat} ${styles.angry}`}>😾</div>
              <h2>แมวโดนลูบแล้ว!</h2>
              <p className={styles.finalScore}>คะแนน: {overlay.score}</p>
              <p>
                {sRef.current.endless
                  ? `ไม่มีวันจบ | รอดมาได้: ${overlay.time} วินาที`
                  : `ด่าน ${overlay.level} | รอดมาได้: ${overlay.time} วินาที`}
              </p>
              {overlay.fishTreats > 0 && <p>ได้ปลาแห้ง: +{overlay.fishTreats} 🐟</p>}
              <button className={styles.btn} onClick={handleRetry}>
                ↻ เล่นอีกครั้ง (Space)
              </button>
              <button className={styles.btn} style={{ marginTop: '0.5rem', background: '#a06040' }} onClick={handleBackToMenu}>
                ← เลือกด่าน
              </button>
            </div>
          </div>
        )}

        {/* Cat */}
        {overlay.status === 'playing' && (
          <div
            className={`${styles.cat} ${catMood === 'hit' ? styles.catHit : catMood === 'scared' ? styles.catScared : ''} ${s.shieldActive ? styles.catShield : ''} ${s.speedBoostUntil > nowPerf ? styles.catSpeed : ''}`}
            style={{ left: `${s.catX}px`, top: `${s.catY}px` }}
          >
            <span>{catEmoji}</span>
          </div>
        )}

        {/* Hands */}
        {s.hands.map((h) => (
          <div
            key={h.id}
            className={`${styles.hand} ${styles[h.type]}`}
            style={{ left: `${h.x}px`, top: `${h.y}px`, transform: `translate(-50%, -50%) rotate(${h.angle + 90}deg)` }}
          >
            <span>{HAND_EMOJI[h.type]}</span>
            {h.hp < h.maxHp && (
              <div className={styles.miniHpBar}>
                <div className={styles.miniHpFill} style={{ width: `${(h.hp / h.maxHp) * 100}%` }} />
              </div>
            )}
          </div>
        ))}

        {/* Boss */}
        {s.boss && (
          <div className={styles.boss} style={{ left: `${s.boss.x}px`, top: `${s.boss.y}px` }}>
            <span>{BOSS_EMOJI[s.boss.type]}</span>
            <div className={styles.bossHpBar}>
              <div className={styles.bossHpFill} style={{ width: `${(s.boss.hp / s.boss.maxHp) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Attacks (projectiles & effects) */}
        {s.attacks.map((atk) => (
          <div
            key={atk.id}
            className={`${styles.attack} ${styles[atk.type]}`}
            style={{
              left: `${atk.x}px`,
              top: `${atk.y}px`,
              opacity: Math.min(1, atk.life / (atk.maxLife || 1)),
              transform: `translate(-50%, -50%) rotate(${atk.angle}deg)`,
            }}
          >
            <span>{atk.type === 'fireball' ? '🔥' : atk.type === 'whirlwind' ? '🌪️' : atk.type === 'mine' ? '🐟' : '⚡'}</span>
          </div>
        ))}

        {/* Projectiles (boss only) */}
        {s.projectiles.map((p) => (
          <div
            key={p.id}
            className={styles.projectile}
            style={{ left: `${p.x}px`, top: `${p.y}px`, transform: `translate(-50%, -50%) rotate(${p.angle + 90}deg)` }}
          >
            <span>💨</span>
          </div>
        ))}

        {/* Items */}
        {s.items.map((item) => (
          <div
            key={item.id}
            className={styles.item}
            style={{ left: `${item.x}px`, top: `${item.y}px`, opacity: item.life }}
          >
            <span>{ITEM_EMOJI[item.type]}</span>
          </div>
        ))}

        {/* XP Gems */}
        {s.xpGems.map((gem) => (
          <div
            key={gem.id}
            className={styles.xpGem}
            style={{ left: `${gem.x}px`, top: `${gem.y}px` }}
          >
            <span>💎</span>
          </div>
        ))}

        {/* Particles */}
        {s.particles.map((p) => (
          <div
            key={p.id}
            className={styles.particle}
            style={{ left: `${p.x}px`, top: `${p.y}px`, opacity: p.life, transform: `translateY(${(1 - p.life) * 40}px) scale(${0.7 + p.life * 0.5})` }}
          >
            {p.text}
          </div>
        ))}
      </div>

      <div className={styles.controlsHint}>
        ⬆⬇⬅➡ หรือ WASD เลื่อนแมว | Space เริ่ม/เล่นใหม่
      </div>

      {/* Mobile Joystick */}
      {isTouch && overlay.status === 'playing' && (
        <Joystick onMove={(dx, dy) => { joystickRef.current = { dx, dy }; }} />
      )}

      {/* Meta Shop — rendered outside arena so it isn't affected by arena scale transforms */}
      {showMeta && (
        <div className={styles.fixedOverlay}>
          <MetaShop meta={meta} onBuy={handleBuyMeta} onClose={() => setShowMeta(false)} />
        </div>
      )}
    </div>
  );
}
