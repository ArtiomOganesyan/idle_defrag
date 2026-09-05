export type BlockTier = 1 | 2 | 3 | 4 | 5;

export type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

export interface BlockTypeConfig {
  tier: BlockTier;
  id: string;
  name: string;
  shortName: string;
  basePoints: number;
  char: string;
  description: string;
  colorKey: string; // Tailwind / CSS color identifier
  targetZone: string; // E.g. "Track 0-1 (Kernel)", "Outer Rim"
}

export interface ClusterBlock {
  id: number;
  tier: BlockTier;
  hexAddr: string;
  isSorted: boolean;
  isFree: boolean;
  isCorrupted?: boolean;
  isProcessing: boolean;
  processedCount: number;
  highlightHead?: number; // Head id currently on this block
}

export interface DefragHead {
  id: number;
  name: string;
  position: number;
  status: 'IDLE' | 'READ' | 'WRITE' | 'SEEK' | 'CORRUPT_REPAIR';
  targetIndex: number;
  speedMultiplier: number;
  color: string;
}

export interface UpgradeDef {
  id: string;
  name: string;
  tag: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  unit: string;
  shortcut: string;
}

export interface GameState {
  points: number;
  totalPointsEarned: number;
  totalBlocksDefragged: number;
  totalManualClicks: number;
  consecutiveSortedCount: number;
  diskFragmentPercentage: number;
  iops: number;
  pointsPerSec: number;
  theme: string;
  soundEnabled: boolean;
  autoDefragActive: boolean;
  crtEffect: boolean;
  // Format / Prestige
  formatPoints: number;
  formatCount: number;
  // Auto Frag
  autoFragEnabled: boolean;
  autoFragBatch: number;
  autoFragIntervalMs: number;
  // Corruption
  corruptionRate: number; // 0 to 10
  corruptedBlocksCount: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'IO' | 'SYS' | 'CORRUPT' | 'FORMAT';
  message: string;
  tag: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  bg: string;
  cardBg: string;
  cardBorder: string;
  headerBg: string;
  accent: string;
  accentHover: string;
  textPrimary: string;
  textMuted: string;
  textDim: string;
  tierColors: {
    1: string; // 1 pt (Temp/Cache - Blue)
    2: string; // 2 pt (User data - Green)
    3: string; // 3 pt (App data - Cyan)
    4: string; // 4 pt (System - Yellow)
    5: string; // 5 pt (Kernel/Archive - Magenta)
    free: string;
    corrupt: string;
    head: string;
    sorted: string;
  };
}
