import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BlockTier,
  ClusterBlock,
  DefragHead,
  LogEntry,
  PomodoroMode,
  UpgradeDef,
} from './types';
import { BLOCK_TIERS, THEMES } from './utils/themes';
import { sound } from './utils/audio';
import { HeaderBar } from './components/HeaderBar';
import { DefragGrid } from './components/DefragGrid';
import { LazyDockerSidebar, SidebarSectionKey } from './components/LazyDockerSidebar';
import { PomodoroTimer } from './components/PomodoroTimer';
import { HelpModal } from './components/HelpModal';
import { FormatModal } from './components/FormatModal';
import { TuningInfoModal } from './components/TuningInfoModal';

const INITIAL_CAPACITY = 168; // Starting block count

export const createDefaultUpgrades = (): Record<string, UpgradeDef> => ({
  speed: {
    id: 'speed',
    name: 'I/O Clock Rate',
    tag: 'SPEED',
    description: 'Accelerate defrag head sweep frequency and seek latency.',
    level: 1,
    maxLevel: 25,
    baseCost: 30, // 2x expensive
    costMultiplier: 1.45,
    unit: '1.0 IOPS',
    shortcut: '1',
  },
  capacity: {
    id: 'capacity',
    name: 'Sector Map Capacity',
    tag: 'CAPACITY',
    description: 'Expand cluster list length on disk for higher simultaneous density.',
    level: 1,
    maxLevel: 50, // Max level 50
    baseCost: 70, // 2x expensive
    costMultiplier: 1.65,
    unit: '168 Sectors',
    shortcut: '2',
  },
  yield: {
    id: 'yield',
    name: 'Process Result / Bit Yield',
    tag: 'YIELD',
    description: 'Amplify point multiplier obtained from processing data blocks (reaches 5.0x at Max LVL 10).',
    level: 1,
    maxLevel: 10, // Max level 10 at which 5x mult is used
    baseCost: 40, // 2x expensive
    costMultiplier: 1.5,
    unit: '1.0x Mult',
    shortcut: '3',
  },
  heads: {
    id: 'heads',
    name: 'Concurrent Heads',
    tag: 'THREADS',
    description: 'Add secondary parallel defragmentation read/write heads.',
    level: 1,
    maxLevel: 4,
    baseCost: 240, // 2x expensive
    costMultiplier: 3.2,
    unit: '1 Thread',
    shortcut: '4',
  },
  corruption: {
    id: 'corruption',
    name: 'Data Corruption Rate',
    tag: 'CORRUPTION',
    description: 'Induces sector parity glitches and bit-rot across clusters. Higher upgrades corrupt more blocks (0-10).',
    level: 0,
    maxLevel: 10,
    baseCost: 25,
    costMultiplier: 1.55,
    unit: '0% (Off)',
    shortcut: '5',
  },
  autoFrag: {
    id: 'autoFrag',
    name: 'Write Activity / Auto-Frag',
    tag: 'WRITE I/O',
    description: 'Simulates incoming file writes, generating 0 to 50 fragmented blocks/sec.',
    level: 1,
    maxLevel: 50, // Max level 50
    baseCost: 20, // 2x expensive
    costMultiplier: 1.25,
    unit: '1 Blk/s',
    shortcut: '6',
  },
});

const DEFAULT_UPGRADES: Record<string, UpgradeDef> = createDefaultUpgrades();

// Calculate track boundary zones for stratified disk sorting
export const getTrackBoundaries = (totalCount: number) => {
  // Track 0 (Tier 5 - Kernel): 0% to 15%
  // Track 1 (Tier 4 - System): 15% to 35%
  // Track 2 (Tier 3 - Apps): 35% to 60%
  // Track 3 (Tier 2 - User): 60% to 80%
  // Track 4 (Tier 1 - Temp): 80% to 90%
  // Track 5 (Free Space): 90% to 100%
  const t5End = Math.floor(totalCount * 0.15);
  const t4End = Math.floor(totalCount * 0.35);
  const t3End = Math.floor(totalCount * 0.60);
  const t2End = Math.floor(totalCount * 0.80);
  const t1End = Math.floor(totalCount * 0.90);

  return {
    5: { start: 0, end: t5End },
    4: { start: t5End, end: t4End },
    3: { start: t4End, end: t3End },
    2: { start: t3End, end: t2End },
    1: { start: t2End, end: t1End },
    0: { start: t1End, end: totalCount }, // Free space
  };
};

// Generate initial blocks array
const generateBlocks = (count: number): ClusterBlock[] => {
  const arr: ClusterBlock[] = [];
  for (let i = 0; i < count; i++) {
    const isFree = Math.random() < 0.10;
    // Generate tier 1 to 5 with realistic disk distribution
    const tierRand = Math.random();
    let tier: BlockTier = 1;
    if (tierRand > 0.85) tier = 5;
    else if (tierRand > 0.65) tier = 4;
    else if (tierRand > 0.45) tier = 3;
    else if (tierRand > 0.25) tier = 2;

    arr.push({
      id: i,
      tier,
      hexAddr: `0x${i.toString(16).padStart(4, '0').toUpperCase()}`,
      isSorted: false,
      isFree,
      isProcessing: false,
      processedCount: 0,
      isCorrupted: false,
    });
  }
  return arr;
};

export default function App() {
  // --- Game State & Economy ---
  const [points, setPoints] = useState<number>(() => {
    const saved = localStorage.getItem('defragfs_points');
    return saved ? Math.max(0, parseFloat(saved)) : 0;
  });
  const [totalPointsEarned, setTotalPointsEarned] = useState<number>(0);
  const [totalBlocksDefragged, setTotalBlocksDefragged] = useState<number>(0);
  const [totalManualClicks, setTotalManualClicks] = useState<number>(0);

  // --- Prestige / Format Disk State ---
  const [formatCount, setFormatCount] = useState<number>(() => {
    const saved = localStorage.getItem('defragfs_format_count');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [formatPoints, setFormatPoints] = useState<number>(() => {
    const saved = localStorage.getItem('defragfs_format_points');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isFormatModalOpen, setIsFormatModalOpen] = useState<boolean>(false);

  // --- Auto-Fragmentation (R Frag Data) Engine ---
  const [autoFragEnabled, setAutoFragEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('defragfs_auto_frag_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [autoFragBatch, setAutoFragBatch] = useState<number>(() => {
    const saved = localStorage.getItem('defragfs_auto_frag_batch');
    return saved ? parseInt(saved, 10) : 3;
  });
  const [autoFragIntervalMs, setAutoFragIntervalMs] = useState<number>(() => {
    const saved = localStorage.getItem('defragfs_auto_frag_interval');
    return saved ? parseInt(saved, 10) : 2000;
  });

  // --- UI Settings & Theme ---
  const [themeKey, setThemeKey] = useState<string>('btop');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [crtEffect, setCrtEffect] = useState<boolean>(false);
  const [autoDefragActive, setAutoDefragActive] = useState<boolean>(true);
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [tuningInfoOpen, setTuningInfoOpen] = useState<boolean>(false);

  // --- Controlled Exclusive Accordion State for Sidebar Tabs ---
  const [activeAccordionSection, setActiveAccordionSection] = useState<SidebarSectionKey | null>('tuning');

  const toggleAccordionSection = (key: SidebarSectionKey) => {
    setActiveAccordionSection((prev) => (prev === key ? null : key));
    sound.playBeep();
  };

  // --- Pomodoro Focus Protocol State ---
  const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>('work');
  const [pomodoroWorkDuration, setPomodoroWorkDuration] = useState<number>(25 * 60);
  const [pomodoroShortBreakDuration, setPomodoroShortBreakDuration] = useState<number>(5 * 60);
  const [pomodoroLongBreakDuration, setPomodoroLongBreakDuration] = useState<number>(15 * 60);
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState<number>(25 * 60);
  const [pomodoroIsRunning, setPomodoroIsRunning] = useState<boolean>(false);
  const [pomodoroSessionsCompleted, setPomodoroSessionsCompleted] = useState<number>(() => {
    return parseInt(localStorage.getItem('defragfs_pomodoro_completed') || '0', 10);
  });
  const [pomodoroTotalFocusSeconds, setPomodoroTotalFocusSeconds] = useState<number>(() => {
    return parseInt(localStorage.getItem('defragfs_pomodoro_focus_sec') || '0', 10);
  });

  const isPomodoroActive = pomodoroIsRunning && pomodoroMode === 'work';

  // --- Upgrades ---
  const [upgrades, setUpgrades] = useState<Record<string, UpgradeDef>>(() => {
    const defaults = createDefaultUpgrades();
    const saved = localStorage.getItem('defragfs_upgrades');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged: Record<string, UpgradeDef> = {};
        for (const key of Object.keys(defaults)) {
          const loaded = parsed[key];
          const minLvl = key === 'corruption' ? 0 : 1;
          const lvl =
            loaded !== undefined && loaded.level !== undefined
              ? Math.min(defaults[key].maxLevel, Math.max(minLvl, loaded.level))
              : defaults[key].level;
          let unit = defaults[key].unit;
          if (key === 'speed') unit = `${(1.0 + (lvl - 1) * 1.6).toFixed(1)} IOPS`;
          if (key === 'capacity') unit = `${INITIAL_CAPACITY + (lvl - 1) * 20} Sectors`;
          if (key === 'yield') unit = `${(1 + (lvl - 1) * (4.0 / 9)).toFixed(1)}x Mult`;
          if (key === 'heads') unit = `${lvl} Thread${lvl === 1 ? '' : 's'}`;
          if (key === 'corruption') unit = lvl === 0 ? '0% (Off)' : `${lvl}% Glitch`;
          if (key === 'autoFrag') unit = `${lvl} Blk${lvl === 1 ? '' : 's'}/s`;

          merged[key] = {
            ...defaults[key],
            level: lvl,
            unit,
          };
        }
        return merged;
      } catch {
        return defaults;
      }
    }
    return defaults;
  });

  // Dynamic Corruption Rate derived directly from the System Tuning upgrade (0-10)
  const corruptionRate = upgrades.corruption ? upgrades.corruption.level : 0;

  // --- Disk Blocks ---
  const [blocks, setBlocks] = useState<ClusterBlock[]>(() => {
    const defaults = createDefaultUpgrades();
    const saved = localStorage.getItem('defragfs_upgrades');
    let capLvl = 1;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        capLvl = parsed?.capacity?.level || 1;
      } catch {
        capLvl = 1;
      }
    }
    const targetCap = INITIAL_CAPACITY + (Math.min(defaults.capacity.maxLevel, capLvl) - 1) * 20;
    return generateBlocks(targetCap);
  });

  // --- Defrag Heads ---
  const [heads, setHeads] = useState<DefragHead[]>([
    {
      id: 0,
      name: 'Head_0 (Kernel Thread)',
      position: 0,
      status: 'IDLE',
      targetIndex: 0,
      speedMultiplier: 1,
      color: '#ffffff',
    },
  ]);

  // --- Telemetry & Logs ---
  const [iops, setIops] = useState<number>(0);
  const [pointsPerSec, setPointsPerSec] = useState<number>(0);
  const [iopsHistory, setIopsHistory] = useState<number[]>([1, 1, 2, 2, 3]);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: '00:00:01',
      level: 'SYS',
      tag: 'INIT',
      message: 'DefragFS filesystem daemon initialized on /dev/nvme0n1p2',
    },
    {
      id: '2',
      timestamp: '00:00:02',
      level: 'INFO',
      tag: 'SCAN',
      message: 'Cluster map loaded. Press [SPACE] or toggle [A] for autonomous defragmentation.',
    },
  ]);

  // Multiplier from Yield upgrade (Level 1: 1.0x, Level 10: 5.0x) + Format Prestige bonus
  const prestigeMultiplier = 1 + formatPoints * 0.015;
  const yieldMultiplier = (1 + (upgrades.yield.level - 1) * (4.0 / 9)) * prestigeMultiplier;
  const currentTheme = THEMES[themeKey] || THEMES.btop;

  // Calculate pending format points (10x less pts when prestiging)
  const totalLevels = (Object.values(upgrades) as UpgradeDef[]).reduce((acc: number, u: UpgradeDef) => acc + u.level, 0);
  const pendingFormatPoints = useMemo(() => {
    const rawPointsFactor = Math.sqrt((points + totalPointsEarned) / 200);
    const rawLevelsFactor = Math.max(0, totalLevels - 5);
    return Math.max(0, Math.floor((rawPointsFactor + rawLevelsFactor) / 10));
  }, [points, totalPointsEarned, totalLevels]);

  // Add Log Helper
  const addLog = useCallback(
    (level: LogEntry['level'], tag: string, message: string) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const entry: LogEntry = {
        id: Date.now().toString() + Math.random(),
        timestamp: timeStr,
        level,
        tag,
        message,
      };
      setLogs((prev) => [...prev.slice(-45), entry]);
    },
    []
  );

  // --- Pomodoro Action Handlers ---
  const handleStartPomodoro = useCallback(() => {
    sound.playPomodoroStart();
    setPomodoroIsRunning(true);
    addLog('SUCCESS', 'POMO_START', `Pomodoro ${pomodoroMode.toUpperCase()} engaged. Defrag operational.`);
  }, [pomodoroMode, addLog]);

  const handlePausePomodoro = useCallback(() => {
    sound.playBeep();
    setPomodoroIsRunning(false);
    addLog('WARN', 'POMO_PAUSE', 'Pomodoro timer paused. Defrag heads parked in standby.');
  }, [addLog]);

  const handleResetPomodoro = useCallback(() => {
    sound.playBeep();
    setPomodoroIsRunning(false);
    const dur =
      pomodoroMode === 'work'
        ? pomodoroWorkDuration
        : pomodoroMode === 'shortBreak'
        ? pomodoroShortBreakDuration
        : pomodoroLongBreakDuration;
    setPomodoroTimeLeft(dur);
    addLog('SYS', 'POMO_RESET', `Pomodoro timer reset to ${Math.floor(dur / 60)}:00.`);
  }, [pomodoroMode, pomodoroWorkDuration, pomodoroShortBreakDuration, pomodoroLongBreakDuration, addLog]);

  const handleSetPomodoroMode = useCallback(
    (mode: PomodoroMode) => {
      sound.playBeep();
      setPomodoroMode(mode);
      setPomodoroIsRunning(false);
      const dur =
        mode === 'work'
          ? pomodoroWorkDuration
          : mode === 'shortBreak'
          ? pomodoroShortBreakDuration
          : pomodoroLongBreakDuration;
      setPomodoroTimeLeft(dur);
    },
    [pomodoroWorkDuration, pomodoroShortBreakDuration, pomodoroLongBreakDuration]
  );

  const handleSetPomodoroDuration = useCallback(
    (seconds: number) => {
      sound.playBeep();
      if (pomodoroMode === 'work') setPomodoroWorkDuration(seconds);
      else if (pomodoroMode === 'shortBreak') setPomodoroShortBreakDuration(seconds);
      else setPomodoroLongBreakDuration(seconds);
      setPomodoroTimeLeft(seconds);
    },
    [pomodoroMode]
  );

  const handleSkipPomodoro = useCallback(() => {
    sound.playBeep();
    if (pomodoroMode === 'work') {
      const nextCompleted = pomodoroSessionsCompleted + 1;
      setPomodoroSessionsCompleted(nextCompleted);
      localStorage.setItem('defragfs_pomodoro_completed', String(nextCompleted));
      const isLong = nextCompleted % 4 === 0;
      const nextMode: PomodoroMode = isLong ? 'longBreak' : 'shortBreak';
      const dur = isLong ? pomodoroLongBreakDuration : pomodoroShortBreakDuration;
      setPomodoroMode(nextMode);
      setPomodoroTimeLeft(dur);
      setPomodoroIsRunning(false);
      addLog('INFO', 'POMO_SKIP', `Advanced to ${nextMode === 'longBreak' ? 'LONG BREAK' : 'SHORT BREAK'} (${Math.floor(dur / 60)}m).`);
    } else {
      setPomodoroMode('work');
      setPomodoroTimeLeft(pomodoroWorkDuration);
      setPomodoroIsRunning(false);
      addLog('INFO', 'POMO_SKIP', `Advanced to WORK FOCUS (${Math.floor(pomodoroWorkDuration / 60)}m).`);
    }
  }, [pomodoroMode, pomodoroSessionsCompleted, pomodoroWorkDuration, pomodoroShortBreakDuration, pomodoroLongBreakDuration, addLog]);

  // --- Pomodoro Ticking Engine ---
  useEffect(() => {
    if (!pomodoroIsRunning) return;

    const timer = setInterval(() => {
      setPomodoroTimeLeft((prev) => {
        if (prev <= 1) {
          sound.playPomodoroFinish();

          if (pomodoroMode === 'work') {
            const nextCompleted = pomodoroSessionsCompleted + 1;
            setPomodoroSessionsCompleted(nextCompleted);
            localStorage.setItem('defragfs_pomodoro_completed', String(nextCompleted));

            const isLong = nextCompleted % 4 === 0;
            const nextMode: PomodoroMode = isLong ? 'longBreak' : 'shortBreak';
            const dur = isLong ? pomodoroLongBreakDuration : pomodoroShortBreakDuration;

            addLog(
              'SUCCESS',
              'POMO_FINISH',
              `[P] FOCUS PROTOCOL COMPLETE! Session #${nextCompleted} finished. Defrag heads parked. Time for a ${isLong ? 'Long Break' : 'Short Break'}!`
            );

            setPomodoroMode(nextMode);
            setPomodoroIsRunning(false);
            return dur;
          } else {
            addLog(
              'INFO',
              'POMO_FINISH',
              'Break session concluded. Ready for next focus session. Press START or [P] to engage defrag.'
            );
            setPomodoroMode('work');
            setPomodoroIsRunning(false);
            return pomodoroWorkDuration;
          }
        }

        if (pomodoroMode === 'work') {
          setPomodoroTotalFocusSeconds((s) => {
            const next = s + 1;
            if (next % 10 === 0) {
              localStorage.setItem('defragfs_pomodoro_focus_sec', String(next));
            }
            return next;
          });
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    pomodoroIsRunning,
    pomodoroMode,
    pomodoroSessionsCompleted,
    pomodoroWorkDuration,
    pomodoroShortBreakDuration,
    pomodoroLongBreakDuration,
    addLog,
  ]);

  // Sync sound settings
  useEffect(() => {
    sound.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Save progress persistently
  useEffect(() => {
    localStorage.setItem('defragfs_points', points.toString());
    localStorage.setItem('defragfs_upgrades', JSON.stringify(upgrades));
    localStorage.setItem('defragfs_format_count', formatCount.toString());
    localStorage.setItem('defragfs_format_points', formatPoints.toString());
    localStorage.setItem('defragfs_corruption_rate', corruptionRate.toString());
    localStorage.setItem('defragfs_auto_frag_enabled', autoFragEnabled.toString());
    localStorage.setItem('defragfs_auto_frag_batch', autoFragBatch.toString());
    localStorage.setItem('defragfs_auto_frag_interval', autoFragIntervalMs.toString());
  }, [
    points,
    upgrades,
    formatCount,
    formatPoints,
    corruptionRate,
    autoFragEnabled,
    autoFragBatch,
    autoFragIntervalMs,
  ]);

  // Handle Sector Capacity / List Length resize when upgrade level changes
  useEffect(() => {
    const targetCapacity = INITIAL_CAPACITY + (upgrades.capacity.level - 1) * 60;
    setBlocks((prev) => {
      if (prev.length === targetCapacity) return prev;
      if (prev.length < targetCapacity) {
        const extra = generateBlocks(targetCapacity - prev.length).map((b, i) => ({
          ...b,
          id: prev.length + i,
          hexAddr: `0x${(prev.length + i).toString(16).padStart(4, '0').toUpperCase()}`,
        }));
        return [...prev, ...extra];
      }
      return prev.slice(0, targetCapacity);
    });
  }, [upgrades.capacity.level]);

  // Sync active defrag heads with head upgrade level
  useEffect(() => {
    const headCount = upgrades.heads.level;
    setHeads((prev) => {
      if (prev.length === headCount) return prev;
      const newHeads: DefragHead[] = [];
      const names = [
        'Head_0 (Kernel)',
        'Head_1 (System)',
        'Head_2 (User)',
        'Head_3 (Temp)',
      ];
      for (let i = 0; i < headCount; i++) {
        if (prev[i]) {
          newHeads.push(prev[i]);
        } else {
          newHeads.push({
            id: i,
            name: names[i] || `Head_${i}`,
            position: Math.floor(Math.random() * blocks.length),
            status: 'IDLE',
            targetIndex: 0,
            speedMultiplier: 1 + i * 0.2,
            color: i === 0 ? '#ffffff' : i === 1 ? '#38bdf8' : i === 2 ? '#f59e0b' : '#ec4899',
          });
        }
      }
      return newHeads;
    });
  }, [upgrades.heads.level, blocks.length]);

  // --- Defragmentation & Stratification Ordering Engine ---
  // Relocates data blocks according to their target disk tracks:
  // Track 0 (0-15%): Tier 5 (Kernel)
  // Track 1 (15-35%): Tier 4 (System)
  // Track 2 (35-60%): Tier 3 (Apps)
  // Track 3 (60-80%): Tier 2 (User)
  // Track 4 (80-90%): Tier 1 (Temp)
  // Track 5 (90-100%): Free space
  const stepDefragProcess = useCallback(
    (headIndex: number = 0, manualSectorIndex?: number) => {
      setBlocks((prevBlocks) => {
        const nextBlocks = [...prevBlocks];
        const tracks = getTrackBoundaries(nextBlocks.length);
        let targetIdx = manualSectorIndex;

        // If no explicit sector specified, prioritize corrupted blocks first, then unsorted blocks
        if (targetIdx === undefined || targetIdx < 0 || targetIdx >= nextBlocks.length) {
          const corruptIndices: number[] = [];
          const unsortedIndices: number[] = [];

          for (let i = 0; i < nextBlocks.length; i++) {
            if (nextBlocks[i].isCorrupted) {
              corruptIndices.push(i);
            } else if (!nextBlocks[i].isSorted && !nextBlocks[i].isFree) {
              unsortedIndices.push(i);
            }
          }

          if (corruptIndices.length > 0) {
            targetIdx = corruptIndices[headIndex % corruptIndices.length];
          } else if (unsortedIndices.length > 0) {
            targetIdx = unsortedIndices[headIndex % unsortedIndices.length];
          } else {
            // Entire disk is sorted and healthy!
            return prevBlocks;
          }
        }

        const sourceBlock = nextBlocks[targetIdx];
        if (!sourceBlock || (sourceBlock.isFree && !sourceBlock.isCorrupted)) return prevBlocks;

        const tier = sourceBlock.tier;
        const tierConfig = BLOCK_TIERS[tier];
        const basePts = tierConfig?.basePoints || 1;
        const isCorruptHealed = sourceBlock.isCorrupted;
        // Corrupted blocks yield 1.5x bonus repair points
        const corruptionBonus = isCorruptHealed ? 1.5 : 1.0;
        const ptsGained = Math.round(basePts * yieldMultiplier * corruptionBonus * 10) / 10;

        // Calculate Target Stratification Track for this block's tier
        const targetTrack = tracks[tier as 1|2|3|4|5] || { start: 0, end: nextBlocks.length };
        
        // Find best slot within the target track zone
        let destinationIdx = -1;

        // Check if current position is already within the target track
        const isAlreadyInTargetTrack = targetIdx >= targetTrack.start && targetIdx < targetTrack.end;

        if (!isAlreadyInTargetTrack) {
          // Look for an available slot in target track (free slot, wrong tier slot, or unsorted slot)
          for (let i = targetTrack.start; i < targetTrack.end; i++) {
            const candidate = nextBlocks[i];
            if (candidate.isFree || candidate.tier !== tier || !candidate.isSorted) {
              destinationIdx = i;
              break;
            }
          }
        }

        if (destinationIdx !== -1 && destinationIdx !== targetIdx) {
          // Swap source block into its proper designated track zone
          const destBlock = nextBlocks[destinationIdx];
          nextBlocks[destinationIdx] = {
            ...sourceBlock,
            id: destinationIdx,
            hexAddr: `0x${destinationIdx.toString(16).padStart(4, '0').toUpperCase()}`,
            isSorted: true,
            isProcessing: true,
            isCorrupted: false,
            processedCount: sourceBlock.processedCount + 1,
          };
          nextBlocks[targetIdx] = {
            ...destBlock,
            id: targetIdx,
            hexAddr: `0x${targetIdx.toString(16).padStart(4, '0').toUpperCase()}`,
            isSorted: false,
            isProcessing: false,
          };
          sound.playSwap();
        } else {
          // Mark in-place sorted and healthy
          nextBlocks[targetIdx] = {
            ...sourceBlock,
            isSorted: true,
            isProcessing: true,
            isCorrupted: false,
            processedCount: sourceBlock.processedCount + 1,
          };
        }

        // Award points
        setPoints((p) => p + ptsGained);
        setTotalPointsEarned((p) => p + ptsGained);
        setTotalBlocksDefragged((b) => b + 1);

        // Update head position
        setHeads((prevHeads) =>
          prevHeads.map((h, i) =>
            i === headIndex
              ? {
                  ...h,
                  position: destinationIdx !== -1 ? destinationIdx : targetIdx!,
                  status: isCorruptHealed ? 'REPAIR' : 'WRITE',
                }
              : h
          )
        );

        // Clear processing animation flag after brief flash
        setTimeout(() => {
          setBlocks((curr) =>
            curr.map((b) =>
              b.id === destinationIdx || b.id === targetIdx ? { ...b, isProcessing: false } : b
            )
          );
        }, 120);

        return nextBlocks;
      });
    },
    [yieldMultiplier]
  );

  // Manual Spacebar / Read button cycle (operational exclusively during active Pomodoro focus session)
  const handleManualCycle = () => {
    if (!isPomodoroActive) {
      sound.playGlitch();
      addLog(
        'WARN',
        'POMO_STANDBY',
        'DEFRAG INHIBITED: Heads are parked. Start the Pomodoro focus timer [P] to engage defragmentation!'
      );
      return;
    }
    sound.playClick(2);
    setTotalManualClicks((c) => c + 1);
    stepDefragProcess(0);
  };

  // Manual Inject Fragmentation
  const handleInjectFrag = () => {
    setBlocks((prev) => {
      const copy = [...prev];
      const countToFrag = Math.min(25, Math.floor(copy.length * 0.25));
      for (let k = 0; k < countToFrag; k++) {
        const randIdx = Math.floor(Math.random() * copy.length);
        const newTier = ((Math.floor(Math.random() * 5) + 1) as BlockTier);
        copy[randIdx] = {
          ...copy[randIdx],
          tier: newTier,
          isSorted: false,
          isFree: false,
        };
      }
      return copy;
    });
    addLog('WARN', 'I/O_INJECT', 'Simulated heavy write pulse injected onto disk sectors.');
  };

  // --- Feature 1: Format Disk / Prestige Reset ---
  const handleExecuteFormat = () => {
    sound.playFormatWipe();
    const gained = pendingFormatPoints;

    const newFormatPoints = formatPoints + gained;
    const newFormatCount = formatCount + 1;
    const freshUpgrades = createDefaultUpgrades();

    setFormatPoints(newFormatPoints);
    setFormatCount(newFormatCount);
    setPoints(0);
    setTotalPointsEarned(0);
    setTotalBlocksDefragged(0);
    setUpgrades(freshUpgrades);
    setBlocks(generateBlocks(INITIAL_CAPACITY));
    setHeads([
      {
        id: 0,
        name: 'Head_0 (Kernel)',
        position: 0,
        status: 'IDLE',
        targetIndex: 0,
        speedMultiplier: 1,
        color: '#ffffff',
      },
    ]);
    setIsFormatModalOpen(false);

    // Explicitly update localStorage
    localStorage.setItem('defragfs_points', '0');
    localStorage.setItem('defragfs_upgrades', JSON.stringify(freshUpgrades));
    localStorage.setItem('defragfs_format_count', newFormatCount.toString());
    localStorage.setItem('defragfs_format_points', newFormatPoints.toString());

    addLog(
      'SUCCESS',
      'FORMAT',
      `DISK FORMAT COMPLETE! All system tuning reset to baseline. Earned +${gained} Format Points (+${(
        newFormatPoints * 1.5
      ).toFixed(1)}% Yield Boost)`
    );
  };

  // --- Feature: Factory Hard Reset (Complete Wipe of All Data & Prestige) ---
  const handleHardReset = () => {
    sound.playGlitch();

    // Clear all persistent storage keys
    localStorage.removeItem('defragfs_points');
    localStorage.removeItem('defragfs_upgrades');
    localStorage.removeItem('defragfs_format_count');
    localStorage.removeItem('defragfs_format_points');
    localStorage.removeItem('defragfs_corruption_rate');
    localStorage.removeItem('defragfs_auto_frag_enabled');
    localStorage.removeItem('defragfs_auto_frag_batch');
    localStorage.removeItem('defragfs_auto_frag_interval');
    localStorage.removeItem('defragfs_pomodoro_completed');
    localStorage.removeItem('defragfs_pomodoro_focus_sec');

    const freshUpgrades = createDefaultUpgrades();

    setPoints(0);
    setTotalPointsEarned(0);
    setTotalBlocksDefragged(0);
    setTotalManualClicks(0);
    setFormatPoints(0);
    setFormatCount(0);
    setAutoFragEnabled(true);
    setPomodoroSessionsCompleted(0);
    setPomodoroTotalFocusSeconds(0);
    setPomodoroIsRunning(false);
    setPomodoroTimeLeft(25 * 60);
    setPomodoroMode('work');
    setUpgrades(freshUpgrades);
    setBlocks(generateBlocks(INITIAL_CAPACITY));
    setHeads([
      {
        id: 0,
        name: 'Head_0 (Kernel)',
        position: 0,
        status: 'IDLE',
        targetIndex: 0,
        speedMultiplier: 1,
        color: '#ffffff',
      },
    ]);
    setIsFormatModalOpen(false);

    addLog(
      'WARN',
      'FACTORY_PURGE',
      'HARD RESET COMPLETE: All filesystem clusters, upgrades, points, and prestige wiped.'
    );
  };

  // --- Feature 2: Corruption Rate Engine (Driven by System Tuning Upgrade 0-10) ---
  useEffect(() => {
    if (corruptionRate <= 0) return;

    const corruptionTimer = setInterval(() => {
      // Chance of corruption scales with upgrade level (0-10)
      const roll = Math.random() * 100;
      if (roll < corruptionRate * 3.5) {
        setBlocks((prev) => {
          const nonCorrupt = prev.filter((b) => !b.isCorrupted && !b.isFree);
          if (nonCorrupt.length === 0) return prev;

          // Higher upgrade levels corrupt more sectors simultaneously
          const countToCorrupt = corruptionRate >= 8 ? 3 : corruptionRate >= 5 ? 2 : 1;
          const targetIds = new Set<number>();
          for (let i = 0; i < countToCorrupt; i++) {
            const available = nonCorrupt.filter((b) => !targetIds.has(b.id));
            if (available.length > 0) {
              const pick = available[Math.floor(Math.random() * available.length)];
              targetIds.add(pick.id);
            }
          }

          sound.playGlitch();
          addLog(
            'WARN',
            'CORRUPT',
            `Cluster parity glitch (${targetIds.size} sectors)! Tuning LVL ${corruptionRate} active.`
          );

          return prev.map((b) =>
            targetIds.has(b.id)
              ? {
                  ...b,
                  isCorrupted: true,
                  isSorted: false,
                }
              : b
          );
        });
      }
    }, 1000);

    return () => clearInterval(corruptionTimer);
  }, [corruptionRate, addLog]);

  // --- Feature 3: Automated "Write Activity / Auto-Frag" (0 to 30 blocks added every second based on upgrade) ---
  useEffect(() => {
    const blocksPerSec = upgrades.autoFrag ? upgrades.autoFrag.level : 0;
    if (!autoFragEnabled || blocksPerSec <= 0) return;

    const autoFragTimer = setInterval(() => {
      setBlocks((prev) => {
        const next = [...prev];
        const countToFrag = Math.min(blocksPerSec, next.length);
        for (let i = 0; i < countToFrag; i++) {
          const randIdx = Math.floor(Math.random() * next.length);
          const newTier = ((Math.floor(Math.random() * 5) + 1) as BlockTier);
          next[randIdx] = {
            ...next[randIdx],
            tier: newTier,
            isSorted: false,
            isFree: false,
          };
        }
        return next;
      });
    }, 1000); // 1.0 second exact rate

    return () => clearInterval(autoFragTimer);
  }, [autoFragEnabled, upgrades.autoFrag?.level]);

  // Autonomous Game Loop: runs defrag heads based on Speed upgrade + prestige boost
  // RESTRICTION: Defragmentation operates exclusively when the Pomodoro timer is active!
  useEffect(() => {
    if (!autoDefragActive || !isPomodoroActive) {
      // Set heads to standby when Pomodoro is inactive
      setHeads((prev) =>
        prev.map((h) => ({
          ...h,
          status: 'IDLE',
        }))
      );
      return;
    }

    // Speed calculation: Level 1 = 1.0 IOPS, Level 10 = 15 IOPS, Level 25 = 45 IOPS (0.5% boost per format point)
    const speedLvl = upgrades.speed.level;
    const speedMultiplierFromPrestige = 1 + formatPoints * 0.005;
    const baseIops = (1.0 + (speedLvl - 1) * 1.6) * speedMultiplierFromPrestige;
    const intervalMs = Math.max(35, Math.floor(1000 / (baseIops * heads.length)));

    let headCounter = 0;
    const loop = setInterval(() => {
      const currentHeadIdx = headCounter % heads.length;
      stepDefragProcess(currentHeadIdx);
      headCounter++;
    }, intervalMs);

    return () => clearInterval(loop);
  }, [autoDefragActive, isPomodoroActive, upgrades.speed.level, heads.length, formatPoints, stepDefragProcess]);

  // Telemetry metrics updater (IOPS & Points/sec calculation)
  useEffect(() => {
    let lastPoints = points;
    let lastDefragCount = totalBlocksDefragged;

    const metricsInterval = setInterval(() => {
      const pps = Math.max(0, points - lastPoints);
      const curIops = Math.max(0, totalBlocksDefragged - lastDefragCount);
      lastPoints = points;
      lastDefragCount = totalBlocksDefragged;

      setPointsPerSec(pps);
      setIops(curIops);
      setIopsHistory((prev) => [...prev.slice(-30), curIops]);
    }, 1000);

    return () => clearInterval(metricsInterval);
  }, [points, totalBlocksDefragged]);

  // Purchase Upgrade handler
  const handlePurchaseUpgrade = (id: string) => {
    const upg = upgrades[id];
    if (!upg || upg.level >= upg.maxLevel) return;

    const cost = Math.floor(upg.baseCost * Math.pow(upg.costMultiplier, upg.level));
    if (points < cost) return;

    setPoints((p) => p - cost);
    setUpgrades((prev) => {
      const nextLvl = prev[id].level + 1;
      let nextUnit = prev[id].unit;

      if (id === 'speed') nextUnit = `${(1.0 + (nextLvl - 1) * 1.6).toFixed(1)} IOPS`;
      if (id === 'capacity') {
        const nextCap = INITIAL_CAPACITY + (nextLvl - 1) * 20;
        nextUnit = `${nextCap} Sectors`;
        setBlocks((bPrev) => {
          if (bPrev.length < nextCap) {
            const addedCount = nextCap - bPrev.length;
            const startIdx = bPrev.length;
            const newBlocks: ClusterBlock[] = [];
            for (let i = 0; i < addedCount; i++) {
              const idx = startIdx + i;
              const tierRand = Math.random();
              let tier: BlockTier = 1;
              if (tierRand > 0.85) tier = 5;
              else if (tierRand > 0.65) tier = 4;
              else if (tierRand > 0.45) tier = 3;
              else if (tierRand > 0.25) tier = 2;
              newBlocks.push({
                id: idx,
                tier,
                hexAddr: `0x${idx.toString(16).padStart(4, '0').toUpperCase()}`,
                isSorted: false,
                isFree: Math.random() < 0.10,
                isProcessing: false,
                processedCount: 0,
                isCorrupted: false,
              });
            }
            return [...bPrev, ...newBlocks];
          }
          return bPrev;
        });
      }
      if (id === 'yield') nextUnit = `${(1 + (nextLvl - 1) * (4.0 / 9)).toFixed(1)}x Mult`;
      if (id === 'heads') nextUnit = `${nextLvl} Thread${nextLvl === 1 ? '' : 's'}`;
      if (id === 'corruption') nextUnit = nextLvl === 0 ? '0% (Off)' : `${nextLvl}% Glitch`;
      if (id === 'autoFrag') nextUnit = `${nextLvl} Blk${nextLvl === 1 ? '' : 's'}/s`;

      return {
        ...prev,
        [id]: {
          ...prev[id],
          level: nextLvl,
          unit: nextUnit,
        },
      };
    });

    addLog(
      'SUCCESS',
      'UPGRADE',
      `Tuned ${upg.name} to LVL ${upg.level + 1} (${upg.unit}) [-${cost} PTS]`
    );
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid hotkeys when typing in input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleManualCycle();
      } else if (e.key === '1') {
        toggleAccordionSection('tuning');
      } else if (e.key === '2') {
        toggleAccordionSection('legend');
      } else if (e.key === '3') {
        toggleAccordionSection('logs');
      } else if (e.key === '4') {
        toggleAccordionSection('daemon');
      } else if (e.key === '5') {
        toggleAccordionSection('threads');
      } else if (e.key === 'p' || e.key === 'P') {
        setPomodoroIsRunning((r) => {
          const next = !r;
          if (next) {
            sound.playPomodoroStart();
            addLog('SUCCESS', 'POMO_START', `Pomodoro ${pomodoroMode.toUpperCase()} engaged via hotkey [P].`);
          } else {
            sound.playBeep();
            addLog('WARN', 'POMO_PAUSE', 'Pomodoro timer paused via hotkey [P].');
          }
          return next;
        });
      } else if (e.key === 'r' || e.key === 'R') {
        handleInjectFrag();
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFormatModalOpen(true);
      } else if (e.key === 't' || e.key === 'T') {
        cycleTheme();
      } else if (e.key === 'm' || e.key === 'M') {
        setSoundEnabled((s) => !s);
      } else if (e.key === 'c' || e.key === 'C') {
        setCrtEffect((c) => !c);
      } else if (e.key === 'a' || e.key === 'A') {
        setAutoDefragActive((a) => !a);
      } else if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        setHelpOpen((h) => !h);
      } else if (e.key === 'Escape') {
        setHelpOpen(false);
        setIsFormatModalOpen(false);
        setTuningInfoOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const cycleTheme = () => {
    const themeKeys = Object.keys(THEMES);
    const currentIndex = themeKeys.indexOf(themeKey);
    const nextKey = themeKeys[(currentIndex + 1) % themeKeys.length];
    setThemeKey(nextKey);
    sound.playBeep();
  };

  return (
    <div
      id="app-terminal-root"
      className={`min-h-screen lg:h-screen lg:max-h-screen w-full flex flex-col font-mono relative select-none overflow-x-hidden overflow-y-auto lg:overflow-hidden ${
        crtEffect ? 'crt-overlay' : ''
      }`}
      style={{
        backgroundColor: currentTheme.bg,
        color: currentTheme.textPrimary,
      }}
    >
      {/* Top Header with Telemetry & Hotkeys */}
      <HeaderBar
        theme={currentTheme}
        points={points}
        pointsPerSec={pointsPerSec}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onCycleTheme={cycleTheme}
        crtEffect={crtEffect}
        onToggleCrt={() => setCrtEffect((c) => !c)}
        onOpenHelp={() => setHelpOpen(true)}
        onInjectFrag={handleInjectFrag}
        onOpenFormat={() => setIsFormatModalOpen(true)}
        formatCount={formatCount}
        formatPoints={formatPoints}
        pendingFormatPoints={pendingFormatPoints}
        autoFragEnabled={autoFragEnabled}
        onToggleAutoFrag={() => setAutoFragEnabled((a) => !a)}
        corruptionRate={corruptionRate}
        pomodoroTimeLeft={pomodoroTimeLeft}
        isPomodoroActive={isPomodoroActive}
        pomodoroIsRunning={pomodoroIsRunning}
        onOpenPomodoro={() => {
          setActiveAccordionSection('pomodoro');
          sound.playBeep();
        }}
      />

      {/* Main Terminal Body Bento Grid Layout (LazyDocker style with mobile optimization) */}
      <main className="flex-1 min-h-0 p-2 sm:p-2.5 flex flex-col lg:grid lg:grid-cols-12 gap-2 sm:gap-2.5 overflow-y-auto lg:overflow-hidden custom-scrollbar">
        {/* Disk Cluster Map + Legend + Logs (Displayed top on phone/mobile, right on desktop) */}
        <div className="order-1 lg:order-2 lg:col-span-8 h-auto lg:h-full min-h-0 flex flex-col gap-2 sm:gap-2.5">
          {/* Main Defragmentation Cluster Map */}
          <div className="h-[320px] xs:h-[360px] sm:h-[400px] lg:h-auto lg:flex-1 min-h-[260px] shrink-0 lg:shrink">
            <DefragGrid
              blocks={blocks}
              heads={heads}
              theme={currentTheme}
              activeHeadIndex={0}
              onManualCycle={handleManualCycle}
              autoDefragActive={autoDefragActive}
              onToggleAutoDefrag={() => setAutoDefragActive((a) => !a)}
              isPomodoroActive={isPomodoroActive}
            />
          </div>

          {/* Lower Row: Pomodoro Focus Timer Component */}
          <div className="h-auto lg:h-[235px] shrink-0">
            <PomodoroTimer
              theme={currentTheme}
              mode={pomodoroMode}
              timeLeft={pomodoroTimeLeft}
              isRunning={pomodoroIsRunning}
              sessionsCompleted={pomodoroSessionsCompleted}
              totalFocusSeconds={pomodoroTotalFocusSeconds}
              workDuration={pomodoroWorkDuration}
              shortBreakDuration={pomodoroShortBreakDuration}
              longBreakDuration={pomodoroLongBreakDuration}
              onStart={handleStartPomodoro}
              onPause={handlePausePomodoro}
              onReset={handleResetPomodoro}
              onSkip={handleSkipPomodoro}
              onSetMode={handleSetPomodoroMode}
              onSetDuration={handleSetPomodoroDuration}
            />
          </div>
        </div>

        {/* LazyDocker Accordion Sidebar (Contains Tuning, Legend, Logs, Daemon, Threads) */}
        <div className="order-2 lg:order-1 lg:col-span-4 h-auto lg:h-full min-h-[360px] lg:min-h-0 flex flex-col">
          <LazyDockerSidebar
            blocks={blocks}
            heads={heads}
            theme={currentTheme}
            multiplier={yieldMultiplier}
            iops={iops}
            pointsPerSec={pointsPerSec}
            totalBlocksDefragged={totalBlocksDefragged}
            totalManualClicks={totalManualClicks}
            logs={logs}
            onClearLogs={() => setLogs([])}
            upgrades={upgrades}
            points={points}
            onPurchaseUpgrade={handlePurchaseUpgrade}
            corruptionRate={corruptionRate}
            autoFragEnabled={autoFragEnabled}
            onToggleAutoFrag={() => setAutoFragEnabled((a) => !a)}
            autoFragBatch={autoFragBatch}
            onChangeAutoFragBatch={setAutoFragBatch}
            autoFragIntervalMs={autoFragIntervalMs}
            onChangeAutoFragInterval={setAutoFragIntervalMs}
            activeSection={activeAccordionSection}
            onToggleSection={toggleAccordionSection}
            onCloseAll={() => setActiveAccordionSection(null)}
            onOpenTuningInfo={() => setTuningInfoOpen(true)}
          />
        </div>
      </main>

      {/* Bottom Footer Status Bar */}
      <footer
        id="terminal-status-footer"
        className="w-full border-t px-2.5 sm:px-3 py-1 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] select-none font-mono shrink-0"
        style={{
          backgroundColor: currentTheme.headerBg,
          borderColor: currentTheme.cardBorder,
          color: currentTheme.textMuted,
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span>
            <strong className="text-rose-400">[F]</strong> Format
          </span>
          <span>
            <strong className="text-zinc-200">[SPACE]</strong> Defrag Read
          </span>
          <span>
            <strong className="text-emerald-400">[P]</strong> Pomo Focus
          </span>
          <span>
            <strong className="text-zinc-200">[1]</strong> Tuning
          </span>
          <span>
            <strong className="text-zinc-200">[2]</strong> Legend
          </span>
          <span>
            <strong className="text-zinc-200">[3]</strong> Logs
          </span>
          <span>
            <strong className="text-zinc-200">[4]</strong> Daemon
          </span>
          <span>
            <strong className="text-zinc-200">[5]</strong> Threads
          </span>
          <span>
            <strong className="text-zinc-200">[A]</strong> Auto
          </span>
          <span>
            <strong className="text-zinc-200">[R]</strong> Frag
          </span>
          <span>
            <strong className="text-zinc-200">[T]</strong> Theme
          </span>
          <span>
            <strong className="text-zinc-200">[M]</strong> Mute
          </span>
          <span>
            <strong className="text-zinc-200">[?]</strong> Man
          </span>
        </div>

        <div className="flex items-center gap-2">
          {formatPoints > 0 && (
            <span className="text-amber-400 font-bold">PRESTIGE: +{(formatPoints * 1.5).toFixed(1)}%</span>
          )}
          <span className="text-emerald-400 font-bold">● FILESYSTEM MOUNTED</span>
        </div>
      </footer>

      {/* System Tuning Directory & Specifications Modal */}
      <TuningInfoModal
        isOpen={tuningInfoOpen}
        onClose={() => setTuningInfoOpen(false)}
        upgrades={upgrades}
      />

      {/* Format Disk (Prestige Wipe) Confirmation Modal */}
      <FormatModal
        isOpen={isFormatModalOpen}
        onClose={() => setIsFormatModalOpen(false)}
        onConfirmFormat={handleExecuteFormat}
        onHardReset={handleHardReset}
        theme={currentTheme}
        currentPoints={points}
        totalPointsEarned={totalPointsEarned + points}
        totalBlocksDefragged={totalBlocksDefragged}
        pendingFormatPoints={pendingFormatPoints}
        currentFormatPoints={formatPoints}
        formatCount={formatCount}
      />

      {/* Help / Manual Dialog Modal */}
      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        theme={currentTheme}
      />
    </div>
  );
}
