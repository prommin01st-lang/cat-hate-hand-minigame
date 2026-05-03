export type HandType = 'normal' | 'fast' | 'big' | 'homer' | 'shooter' | 'cluster' | 'mini';
export type BossType = 'chaser' | 'dasher' | 'spawner';
export type ItemType = 'shield' | 'speed' | 'bomb' | 'heal';
export type UpgradeType = 'maxHp' | 'catSpeed' | 'shieldDuration' | 'scoreMult' | 'itemLuck' | 'biggerBomb';
export type GameStatus = 'levelSelect' | 'playing' | 'levelComplete' | 'upgrade' | 'gameover' | 'levelUp' | 'metaShop';

export type SkillType = 'scratch' | 'fireball' | 'lightning' | 'whirlwind' | 'mine';

export interface Hand {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: HandType;
  angle: number;
  homerTimer?: number;
  split?: boolean;
  lastShot?: number;
  hp: number;
  maxHp: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  fromBoss?: boolean;
}

export interface Boss {
  x: number;
  y: number;
  startTime: number;
  type: BossType;
  hp: number;
  maxHp: number;
  lastDash?: number;
  lastSpawn?: number;
  dashing?: boolean;
  dashVx?: number;
  dashVy?: number;
}

export interface Item {
  id: number;
  x: number;
  y: number;
  type: ItemType;
  life: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  text: string;
  life: number;
}

export interface Upgrade {
  type: UpgradeType;
  label: string;
  emoji: string;
  description: string;
}

export interface LevelConfig {
  level: number;
  name: string;
  duration: number;
  handTypes: HandType[];
  bossType: BossType;
  bossEvery: number;
  bossDuration: number;
  spawnBase: number;
  spawnMin: number;
  speedMult: number;
  itemChance: number;
}

// ---- RogueLike: Skills ----

export interface SkillConfig {
  type: SkillType;
  label: string;
  emoji: string;
  description: string;
  baseDamage: number;
  baseCooldown: number; // ms
  baseRange: number;
  maxLevel: number;
}

export interface Skill {
  type: SkillType;
  level: number;
  lastFire: number;
}

export interface CatAttack {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  type: SkillType;
  damage: number;
  range: number;
  life: number; // for projectiles / timed effects
  maxLife: number;
}

// ---- RogueLike: XP ----

export interface XPGem {
  id: number;
  x: number;
  y: number;
  value: number;
  magnetized: boolean;
}

// ---- RogueLike: Meta ----

export type MetaUpgradeType = 'baseSpeed' | 'baseDamage' | 'baseMaxHp' | 'xpGain' | 'magnetRange' | 'fishBonus' | 'extraSkillSlot';

export interface MetaUpgradeConfig {
  type: MetaUpgradeType;
  label: string;
  emoji: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  effectPerLevel: number;
  effectLabel: string;
}

export interface MetaState {
  fishTreats: number;
  upgrades: Record<MetaUpgradeType, number>;
}

export interface SkillChoice {
  kind: 'newSkill' | 'upgradeSkill' | 'statBoost';
  skillType?: SkillType;
  statType?: 'maxHp' | 'speed' | 'damage' | 'range' | 'cooldown';
  label: string;
  emoji: string;
  description: string;
}

// ---- GameState ----

export interface EnvironmentDecor {
  id: number;
  x: number;
  y: number;
  emoji: string;
  size: number;
  zIndex: number;
}

export interface GameState {
  catX: number;
  catY: number;
  catSpeedMult: number;
  catDamageMult: number;
  catRangeMult: number;
  catCooldownMult: number;
  shieldActive: boolean;
  shieldUntil: number;
  speedBoostUntil: number;
  hands: Hand[];
  projectiles: Projectile[];
  boss: Boss | null;
  items: Item[];
  particles: Particle[];
  score: number;
  hp: number;
  maxHp: number;
  combo: number;
  scoreMult: number;
  itemLuck: number;
  shieldDuration: number;
  status: GameStatus;
  level: number;
  upgrades: UpgradeType[];
  startTime: number;
  elapsed: number;
  lastSpawn: number;
  nextSpawnInterval: number;
  lastBossTime: number;
  lastDamageTime: number;
  lastItemSpawn: number;
  catMood: 'normal' | 'hit' | 'scared';
  catMoodUntil: number;
  nextId: number;
  idleMessageTime: number;

  // RogueLike fields
  catLevel: number;
  catXP: number;
  xpToNext: number;
  skills: Skill[];
  attacks: CatAttack[];
  xpGems: XPGem[];
  magnetRange: number;
  xpGainMult: number;

  // Environment + Endless
  endless: boolean;
  endlessWave: number;
  decors: EnvironmentDecor[];
  bgTheme: string;
}
