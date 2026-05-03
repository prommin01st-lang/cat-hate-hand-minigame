import { HandType, BossType, ItemType, Upgrade, LevelConfig, SkillConfig, MetaUpgradeConfig } from './gameTypes';

export const ARENA_W = 900;
export const ARENA_H = 650;
export const CAT_SIZE = 48;
export const HAND_SIZE = 40;
export const BOSS_SIZE = 96;
export const CAT_SPEED_BASE = 5.5;
export const HAND_SPEEDS: Record<HandType, number> = {
  normal: 2.2,
  fast: 3.6,
  big: 1.6,
  homer: 2.5,
  shooter: 1.8,
  cluster: 2.0,
  mini: 3.0,
};
export const SPAWN_BASE = 1300;
export const BOSS_EVERY = 22000;
export const BOSS_DURATION = 7000;
export const ITEM_SPAWN_INTERVAL = 8000;
export const SPEED_BOOST_DURATION = 5000;
export const SHIELD_DURATION_BASE = 8000;

export const HAND_HP: Record<HandType, number> = {
  normal: 1,
  fast: 1,
  big: 3,
  homer: 2,
  shooter: 2,
  cluster: 2,
  mini: 1,
};

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: 'ลูบเบาๆ',
    duration: 25,
    handTypes: ['normal'],
    bossType: 'chaser',
    bossEvery: 22000,
    bossDuration: 7000,
    spawnBase: 1300,
    spawnMin: 500,
    speedMult: 1.0,
    itemChance: 0.15,
  },
  {
    level: 2,
    name: 'มือเริ่มไว',
    duration: 35,
    handTypes: ['normal', 'fast', 'homer'],
    bossType: 'chaser',
    bossEvery: 20000,
    bossDuration: 8000,
    spawnBase: 1100,
    spawnMin: 450,
    speedMult: 1.15,
    itemChance: 0.18,
  },
  {
    level: 3,
    name: 'มือยิงระยะไกล',
    duration: 45,
    handTypes: ['normal', 'fast', 'homer', 'shooter'],
    bossType: 'dasher',
    bossEvery: 18000,
    bossDuration: 9000,
    spawnBase: 900,
    spawnMin: 400,
    speedMult: 1.3,
    itemChance: 0.2,
  },
  {
    level: 4,
    name: 'มือแตกกระจาย',
    duration: 55,
    handTypes: ['normal', 'fast', 'homer', 'shooter', 'cluster'],
    bossType: 'dasher',
    bossEvery: 17000,
    bossDuration: 10000,
    spawnBase: 750,
    spawnMin: 350,
    speedMult: 1.45,
    itemChance: 0.22,
  },
  {
    level: 5,
    name: 'บอสมือมหาประลัย',
    duration: 70,
    handTypes: ['normal', 'fast', 'homer', 'shooter', 'cluster'],
    bossType: 'spawner',
    bossEvery: 16000,
    bossDuration: 12000,
    spawnBase: 600,
    spawnMin: 300,
    speedMult: 1.6,
    itemChance: 0.25,
  },
];

export const HAND_EMOJI: Record<HandType, string> = {
  normal: '👋',
  fast: '✋',
  big: '🖐️',
  homer: '🖐️',
  shooter: '👉',
  cluster: '✋',
  mini: '👆',
};

export const BOSS_EMOJI: Record<BossType, string> = {
  chaser: '🖐️',
  dasher: '👊',
  spawner: '👿',
};

export const ITEM_EMOJI: Record<ItemType, string> = {
  shield: '🛡️',
  speed: '⚡',
  bomb: '💣',
  heal: '💖',
};

export const ITEM_LABEL: Record<ItemType, string> = {
  shield: 'โล่กันมือ',
  speed: 'สปีดบูสต์',
  bomb: 'ระเบิดล้างมือ',
  heal: 'ฮีล HP',
};

export const UPGRADES: Upgrade[] = [
  { type: 'maxHp', label: 'หัวใจแมว +1', emoji: '❤️', description: 'HP สูงสุด +1 (สูงสุด 5)' },
  { type: 'catSpeed', label: 'ขาแมวไว', emoji: '🐾', description: 'ความเร็วแมว +10%' },
  { type: 'shieldDuration', label: 'โล่ทนทาน', emoji: '🛡️', description: 'ระยะเวลาโล่ +2 วินาที' },
  { type: 'scoreMult', label: 'คะแนนพุ่ง', emoji: '💰', description: 'คะแนนคูณ +10%' },
  { type: 'itemLuck', label: 'ดวงดี', emoji: '🍀', description: 'โอกาสเจอไอเทม +15%' },
  { type: 'biggerBomb', label: 'ระเบิดนิวเคลียร์', emoji: '💥', description: 'ระเบิดล้างมือ + บอสเสีย HP' },
];

// ---- RogueLike: Skills ----

export const SKILLS: SkillConfig[] = [
  {
    type: 'scratch',
    label: 'เฉียดเล็บ',
    emoji: '🐾',
    description: 'ข่วนมือที่เข้าใกล้',
    baseDamage: 8,
    baseCooldown: 1200,
    baseRange: 70,
    maxLevel: 5,
  },
  {
    type: 'fireball',
    label: 'ลูกไฟแมว',
    emoji: '🔥',
    description: 'ยิงลูกไฟไปทางที่แมวหันหน้า',
    baseDamage: 12,
    baseCooldown: 1800,
    baseRange: 300,
    maxLevel: 5,
  },
  {
    type: 'lightning',
    label: 'สายฟ้าเหมียว',
    emoji: '⚡',
    description: 'ฟาดสายฟ้าใส่มือใกล้สุด',
    baseDamage: 18,
    baseCooldown: 2500,
    baseRange: 250,
    maxLevel: 5,
  },
  {
    type: 'whirlwind',
    label: 'พายุขน',
    emoji: '🌪️',
    description: 'หมุนทำดาเมจรอบตัว',
    baseDamage: 6,
    baseCooldown: 1500,
    baseRange: 100,
    maxLevel: 5,
  },
  {
    type: 'mine',
    label: 'ระเบิดปลา',
    emoji: '🐟',
    description: 'วางระเบิดที่ตำแหน่งสุ่ม',
    baseDamage: 25,
    baseCooldown: 3500,
    baseRange: 120,
    maxLevel: 5,
  },
];

export function getSkillConfig(type: string): SkillConfig | undefined {
  return SKILLS.find((s) => s.type === type);
}

// XP table: level -> XP needed
export function getXPToLevel(level: number): number {
  return Math.floor(50 * Math.pow(1.4, level - 1));
}

// ---- RogueLike: Meta Upgrades ----

export const META_UPGRADES: MetaUpgradeConfig[] = [
  {
    type: 'baseSpeed',
    label: 'ขาแมวพัฒนา',
    emoji: '🐾',
    description: 'ความเร็วเริ่มต้น +5%',
    maxLevel: 10,
    baseCost: 20,
    costMultiplier: 1.5,
    effectPerLevel: 0.05,
    effectLabel: '+5% ความเร็ว',
  },
  {
    type: 'baseDamage',
    label: 'เล็บคมกริบ',
    emoji: '🔪',
    description: 'ดาเมจเริ่มต้น +10%',
    maxLevel: 10,
    baseCost: 20,
    costMultiplier: 1.5,
    effectPerLevel: 0.10,
    effectLabel: '+10% ดาเมจ',
  },
  {
    type: 'baseMaxHp',
    label: 'หัวใจแมวถาวร',
    emoji: '❤️',
    description: 'HP เริ่มต้น +1',
    maxLevel: 5,
    baseCost: 50,
    costMultiplier: 2.0,
    effectPerLevel: 1,
    effectLabel: '+1 HP',
  },
  {
    type: 'xpGain',
    label: 'สมองแมวไว',
    emoji: '🧠',
    description: 'XP ที่ได้ +10%',
    maxLevel: 10,
    baseCost: 25,
    costMultiplier: 1.5,
    effectPerLevel: 0.10,
    effectLabel: '+10% XP',
  },
  {
    type: 'magnetRange',
    label: 'จมูกแมวดี',
    emoji: '👃',
    description: 'ระยะเก็บ XP +15%',
    maxLevel: 10,
    baseCost: 20,
    costMultiplier: 1.4,
    effectPerLevel: 0.15,
    effectLabel: '+15% ระยะเก็บ XP',
  },
  {
    type: 'fishBonus',
    label: 'เจ้าเหมียวรวย',
    emoji: '💎',
    description: 'ปลาแห้งที่ได้ +10%',
    maxLevel: 10,
    baseCost: 30,
    costMultiplier: 1.5,
    effectPerLevel: 0.10,
    effectLabel: '+10% ปลาแห้ง',
  },
  {
    type: 'extraSkillSlot',
    label: 'สกิลเพิ่มช่อง',
    emoji: '➕',
    description: 'สกิลเริ่มต้นเพิ่ม 1 ช่อง',
    maxLevel: 2,
    baseCost: 100,
    costMultiplier: 3.0,
    effectPerLevel: 1,
    effectLabel: '+1 ช่องสกิล',
  },
];

export function getMetaUpgradeConfig(type: string): MetaUpgradeConfig | undefined {
  return META_UPGRADES.find((u) => u.type === type);
}

export function getMetaUpgradeCost(config: MetaUpgradeConfig, currentLevel: number): number {
  return Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLevel));
}

export function getLevelConfig(level: number): LevelConfig {
  return LEVELS[Math.min(level - 1, LEVELS.length - 1)];
}

export function getMaxLevel(): number {
  return LEVELS.length;
}

// ---- Environment Themes ----

export interface ThemeConfig {
  name: string;
  bgColor: string;
  borderColor: string;
  gridColor: string;
  decors: { emoji: string; size: number; count: number; zIndex: number }[];
}

export const THEMES: ThemeConfig[] = [
  {
    name: 'garden',
    bgColor: '#fff8f0',
    borderColor: '#d08060',
    gridColor: 'rgba(224, 160, 128, 0.12)',
    decors: [
      { emoji: '🌳', size: 44, count: 5, zIndex: 1 },
      { emoji: '🌿', size: 28, count: 6, zIndex: 1 },
      { emoji: '🪨', size: 32, count: 3, zIndex: 1 },
    ],
  },
  {
    name: 'desert',
    bgColor: '#fdf5e6',
    borderColor: '#c89050',
    gridColor: 'rgba(200, 160, 100, 0.15)',
    decors: [
      { emoji: '🌵', size: 40, count: 5, zIndex: 1 },
      { emoji: '🏜️', size: 36, count: 2, zIndex: 0 },
      { emoji: '🪨', size: 30, count: 4, zIndex: 1 },
    ],
  },
  {
    name: 'snow',
    bgColor: '#f0f8ff',
    borderColor: '#80a0c0',
    gridColor: 'rgba(160, 180, 210, 0.12)',
    decors: [
      { emoji: '🌲', size: 42, count: 5, zIndex: 1 },
      { emoji: '⛄', size: 36, count: 2, zIndex: 1 },
      { emoji: '❄️', size: 20, count: 8, zIndex: 0 },
    ],
  },
  {
    name: 'jungle',
    bgColor: '#f0fff4',
    borderColor: '#60a060',
    gridColor: 'rgba(120, 180, 120, 0.12)',
    decors: [
      { emoji: '🌴', size: 46, count: 4, zIndex: 1 },
      { emoji: '🌺', size: 26, count: 6, zIndex: 1 },
      { emoji: '🍄', size: 24, count: 4, zIndex: 1 },
    ],
  },
  {
    name: 'space',
    bgColor: '#1a1025',
    borderColor: '#7c4dff',
    gridColor: 'rgba(124, 77, 255, 0.08)',
    decors: [
      { emoji: '🪐', size: 38, count: 2, zIndex: 0 },
      { emoji: '⭐', size: 18, count: 10, zIndex: 0 },
      { emoji: '🌙', size: 34, count: 1, zIndex: 0 },
    ],
  },
];

export function getTheme(level: number): ThemeConfig {
  return THEMES[(level - 1) % THEMES.length];
}

// ---- Endless Mode Config ----

export interface EndlessConfig {
  spawnBaseStart: number;
  spawnMinStart: number;
  speedMultStart: number;
  bossEveryStart: number;
  handTypesAll: HandType[];
}

export const ENDLESS_CONFIG: EndlessConfig = {
  spawnBaseStart: 1200,
  spawnMinStart: 400,
  speedMultStart: 1.0,
  bossEveryStart: 20000,
  handTypesAll: ['normal', 'fast', 'big', 'homer', 'shooter', 'cluster'],
};

export function getEndlessDifficulty(elapsedSec: number): {
  spawnBase: number;
  spawnMin: number;
  speedMult: number;
  bossEvery: number;
  handTypes: HandType[];
} {
  const minutes = elapsedSec / 60;
  const wave = Math.floor(minutes);

  // Every minute = one "wave", difficulty scales up
  const spawnBase = Math.max(250, ENDLESS_CONFIG.spawnBaseStart - wave * 120);
  const spawnMin = Math.max(150, ENDLESS_CONFIG.spawnMinStart - wave * 40);
  const speedMult = ENDLESS_CONFIG.speedMultStart + wave * 0.12;
  const bossEvery = Math.max(8000, ENDLESS_CONFIG.bossEveryStart - wave * 2500);

  // Unlock more hand types as time goes on
  const handTypePool: HandType[] = ['normal'];
  if (wave >= 0) handTypePool.push('fast');
  if (wave >= 1) handTypePool.push('homer');
  if (wave >= 2) handTypePool.push('shooter');
  if (wave >= 3) handTypePool.push('cluster');
  if (wave >= 5) handTypePool.push('big');

  return { spawnBase, spawnMin, speedMult, bossEvery, handTypes: handTypePool };
}
