import React from 'react';
import { ClusterBlock, DefragHead, ThemeConfig, UpgradeDef } from '../types';
import { BLOCK_TIERS } from '../utils/themes';
import { sound } from '../utils/audio';

export type SidebarSectionKey = 'tuning' | 'telemetry' | 'daemon' | 'threads';

interface LazyDockerSidebarProps {
  // Telemetry & Disk state
  blocks: ClusterBlock[];
  heads: DefragHead[];
  theme: ThemeConfig;
  iops: number;
  pointsPerSec: number;
  totalBlocksDefragged: number;
  totalManualClicks: number;
  iopsHistory: number[];

  // Upgrades
  upgrades: Record<string, UpgradeDef>;
  points: number;
  onPurchaseUpgrade: (id: string) => void;

  // Corruption & Daemon
  corruptionRate: number;
  onChangeCorruptionRate: (rate: number) => void;
  autoFragEnabled: boolean;
  onToggleAutoFrag: () => void;
  autoFragBatch?: number;
  onChangeAutoFragBatch?: (batch: number) => void;
  autoFragIntervalMs?: number;
  onChangeAutoFragInterval?: (intervalMs: number) => void;

  // Controlled Accordion Props (Exclusive Single-Open Accordion)
  activeSection?: SidebarSectionKey | null;
  onToggleSection?: (key: SidebarSectionKey) => void;
  onCloseAll?: () => void;
  onOpenTuningInfo?: () => void;
}

export const LazyDockerSidebar: React.FC<LazyDockerSidebarProps> = ({
  blocks,
  heads,
  theme,
  iops,
  totalBlocksDefragged,
  totalManualClicks,
  iopsHistory,
  upgrades,
  points,
  onPurchaseUpgrade,
  corruptionRate,
  onChangeCorruptionRate,
  activeSection = 'tuning',
  onToggleSection,
  onCloseAll,
  onOpenTuningInfo,
}) => {
  const toggleSection = (key: SidebarSectionKey) => {
    if (onToggleSection) {
      onToggleSection(key);
    }
  };

  // Telemetry statistics
  const totalOccupied = blocks.filter((b) => !b.isFree).length;
  const fragmentedCount = blocks.filter((b) => !b.isFree && !b.isSorted && !b.isCorrupted).length;
  const sortedCount = blocks.filter((b) => !b.isFree && b.isSorted && !b.isCorrupted).length;
  const corruptCount = blocks.filter((b) => b.isCorrupted).length;
  const fragPercent = totalOccupied > 0 ? (fragmentedCount / totalOccupied) * 100 : 0;
  const sortedPercent = totalOccupied > 0 ? (sortedCount / totalOccupied) * 100 : 100;

  // IOPS Sparkline
  const sparklineChars = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const maxIops = Math.max(...iopsHistory, 10);
  const sparklineString = iopsHistory
    .slice(-24)
    .map((val) => {
      const idx = Math.min(
        sparklineChars.length - 1,
        Math.floor((val / maxIops) * (sparklineChars.length - 1))
      );
      return sparklineChars[idx];
    })
    .join('');

  // Tier distribution
  const tierDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  blocks.forEach((b) => {
    if (!b.isFree && !b.isCorrupted) {
      tierDistribution[b.tier] = (tierDistribution[b.tier] || 0) + 1;
    }
  });

  // Upgrades helpers
  const calculateCost = (upg: UpgradeDef) => {
    return Math.floor(upg.baseCost * Math.pow(upg.costMultiplier, upg.level));
  };

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 10_000) return (n / 1_000).toFixed(1) + 'k';
    return (n ?? 0).toLocaleString();
  };

  const getProgressBar = (level: number, maxLevel: number, length: number = 7) => {
    const filled = Math.min(length, Math.floor((level / maxLevel) * length));
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  // Define ordered keys for the 6 upgrade cards
  const upgradeKeys = ['speed', 'capacity', 'yield', 'heads', 'algorithms', 'autoFrag'];
  const upgradeList: UpgradeDef[] = upgradeKeys
    .map((k) => upgrades[k])
    .filter(Boolean);

  return (
    <div
      id="lazydocker-sidebar"
      className="flex flex-col h-full min-h-0 rounded border font-mono text-xs sm:text-[13px] overflow-hidden shadow-lg select-none"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.cardBorder,
        color: theme.textPrimary,
      }}
    >
      {/* Sidebar Top Controls (Exclusive Tab Navigator) */}
      <div
        className="px-2.5 sm:px-3 py-1.5 sm:py-2 border-b flex items-center justify-between gap-1.5 text-xs font-bold shrink-0 select-none"
        style={{
          backgroundColor: theme.headerBg,
          borderColor: theme.cardBorder,
          color: theme.textPrimary,
        }}
      >
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-zinc-500">┌─</span>
          <span style={{ color: theme.accent }} className="tracking-wide">
            SIDEBAR_ACCORDION
          </span>
          <span className="text-[10px] text-zinc-400 font-normal hidden sm:inline">(Single-Tab)</span>
        </div>

        {/* Quick tab switcher buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {(['tuning', 'telemetry', 'daemon', 'threads'] as SidebarSectionKey[]).map((sec, idx) => {
            const isActive = activeSection === sec;
            const labels: Record<SidebarSectionKey, string> = {
              tuning: 'TUN',
              telemetry: 'IOPS',
              daemon: 'DAEM',
              threads: 'THRD',
            };
            return (
              <button
                key={sec}
                onClick={() => toggleSection(sec)}
                title={`Switch to [${idx + 1}] ${sec.toUpperCase()}`}
                className={`px-1.5 py-0.5 rounded text-[9.5px] sm:text-[10px] border cursor-pointer font-bold transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'border-zinc-700 text-zinc-400 hover:text-zinc-200 bg-zinc-900/60'
                }`}
              >
                [{idx + 1}]
              </button>
            );
          })}
          <button
            onClick={() => (onCloseAll ? onCloseAll() : toggleSection(activeSection as SidebarSectionKey))}
            title="Collapse active tab"
            className="px-1.5 py-0.5 rounded border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200 text-zinc-400 text-[9.5px] sm:text-[10px] cursor-pointer bg-zinc-900 transition-colors"
          >
            [-]
          </button>
        </div>
      </div>

      {/* Accordion Panels Scrollable Body */}
      <div className="flex-1 min-h-0 p-2 sm:p-2.5 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
        {/* ========================================================================= */}
        {/* SECTION 1: SYSTEM TUNING & UPGRADES (6 CARDS GRID) (HOTKEY: [1]) */}
        {/* ========================================================================= */}
        <div
          id="accordion-section-tuning"
          className="rounded border overflow-hidden transition-all duration-150 flex flex-col shrink-0"
          style={{
            borderColor: activeSection === 'tuning' ? theme.accent : theme.cardBorder,
            backgroundColor: theme.headerBg,
          }}
        >
          {/* Header */}
          <div
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between text-left font-bold text-xs sm:text-[13px] border-b select-none shrink-0"
            style={{
              borderColor: activeSection === 'tuning' ? theme.cardBorder : 'transparent',
              backgroundColor: activeSection === 'tuning' ? 'rgba(0,0,0,0.3)' : undefined,
            }}
          >
            <button
              type="button"
              onClick={() => toggleSection('tuning')}
              className="flex-1 flex items-center gap-2 cursor-pointer hover:brightness-110 transition-colors text-left"
            >
              <span className="text-emerald-400 font-black font-mono">
                {activeSection === 'tuning' ? '▼' : '▶'}
              </span>
              <span className="text-zinc-100 font-bold tracking-tight">
                <span className="text-emerald-400 mr-1">[1]</span>SYSTEM_TUNING
              </span>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playBeep();
                  if (onOpenTuningInfo) onOpenTuningInfo();
                }}
                title="View System Tuning Specifications & Formulas"
                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 hover:bg-cyan-900 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>?</span>
                <span className="hidden sm:inline text-[9px]">INFO</span>
              </button>
              <span className="text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded bg-black/40 text-emerald-400 border border-emerald-800 font-mono">
                6 CARDS
              </span>
            </div>
          </div>

          {/* Body: 6 Upgrade Cards */}
          {activeSection === 'tuning' && (
            <div className="p-2 sm:p-2.5 flex flex-col gap-2 bg-black/20 overflow-y-auto custom-scrollbar max-h-[380px] sm:max-h-[460px] lg:max-h-[420px] xl:max-h-[480px]">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono px-0.5 shrink-0 sticky top-0 bg-[#0c0e14]/90 backdrop-blur-xs py-0.5 z-10">
                <div className="flex items-center gap-1.5">
                  <span>TUNING MATRIX (6 CARDS)</span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playBeep();
                      if (onOpenTuningInfo) onOpenTuningInfo();
                    }}
                    title="View card descriptions"
                    className="text-cyan-400 hover:text-cyan-200 underline cursor-pointer text-[9.5px]"
                  >
                    [?] Specs
                  </button>
                </div>
                <span className="text-emerald-400">
                  {upgradeList.filter((u) => u.level >= u.maxLevel).length}/{upgradeList.length} MAXED
                </span>
              </div>

              {/* 6 Cards Grid (Responsive 2-Columns on wide, 1-Column on compact) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {upgradeList.map((upg, idx) => {
                  const cost = calculateCost(upg);
                  const isMaxed = upg.level >= upg.maxLevel;
                  const canAfford = points >= cost && !isMaxed;

                  return (
                    <div
                      key={upg.id}
                      id={`upgrade-card-${upg.id}`}
                      className="p-2 sm:p-2.5 rounded border flex flex-col justify-between gap-2 shadow-xs transition-all duration-150 relative overflow-hidden"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.45)',
                        borderColor: isMaxed
                          ? 'rgba(234, 179, 8, 0.4)'
                          : canAfford
                          ? 'rgba(52, 211, 153, 0.35)'
                          : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      {/* Top Row: Tag & Level */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-xs bg-zinc-800 border border-zinc-700 text-cyan-300 font-mono">
                            {upg.tag}
                          </span>
                          <span className="text-[9.5px] text-zinc-500 font-mono">#{idx + 1}</span>
                        </div>
                        <span
                          className={`text-[9.5px] sm:text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-xs border ${
                            isMaxed
                              ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                          }`}
                        >
                          {isMaxed ? 'MAX' : `LVL ${upg.level}/${upg.maxLevel}`}
                        </span>
                      </div>

                      {/* Middle: Title & Output Metric (Descriptions removed as requested) */}
                      <div className="flex flex-col gap-0.5">
                        <div className="text-zinc-100 font-bold text-[11.5px] sm:text-xs leading-tight">
                          {upg.name}
                        </div>
                        <div className="text-[10.5px] text-emerald-400 font-mono font-bold">
                          {upg.id === 'autoFrag'
                            ? `+${upg.level} Blk${upg.level === 1 ? '' : 's'}/s Write Rate`
                            : upg.unit}
                        </div>
                      </div>

                      {/* Bottom Row: Progress & Action Button */}
                      <div className="pt-1.5 border-t border-zinc-800 flex items-center justify-between gap-1.5">
                        <div className="flex flex-col font-mono text-[9px] text-zinc-400">
                          <span className="text-zinc-500">[{getProgressBar(upg.level, upg.maxLevel)}]</span>
                          {!isMaxed && (
                            <span className={canAfford ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                              {formatNum(cost)} PTS
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => {
                            sound.playUpgrade();
                            onPurchaseUpgrade(upg.id);
                          }}
                          className={`px-2.5 py-1 rounded text-[10px] sm:text-[11px] font-bold border font-mono transition-all duration-150 cursor-pointer ${
                            isMaxed
                              ? 'bg-amber-900/30 text-amber-400 border-amber-700/50 cursor-not-allowed'
                              : canAfford
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-xs active:scale-95'
                              : 'bg-zinc-800/80 text-zinc-500 border-zinc-700 cursor-not-allowed'
                          }`}
                        >
                          {isMaxed ? 'MAX' : canAfford ? 'TUNE' : 'LOCK'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: TELEMETRY & IOPS PERFORMANCE (HOTKEY: [2]) */}
        {/* ========================================================================= */}
        <div
          id="accordion-section-telemetry"
          className="rounded border overflow-hidden transition-all duration-150"
          style={{
            borderColor: activeSection === 'telemetry' ? theme.accent : theme.cardBorder,
            backgroundColor: theme.headerBg,
          }}
        >
          {/* Header */}
          <button
            type="button"
            onClick={() => toggleSection('telemetry')}
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between text-left font-bold text-xs sm:text-[13px] cursor-pointer hover:brightness-110 transition-colors border-b select-none"
            style={{
              borderColor: activeSection === 'telemetry' ? theme.cardBorder : 'transparent',
              backgroundColor: activeSection === 'telemetry' ? 'rgba(0,0,0,0.3)' : undefined,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-black font-mono">
                {activeSection === 'telemetry' ? '▼' : '▶'}
              </span>
              <span className="text-zinc-100 font-bold tracking-tight">
                <span className="text-cyan-400 mr-1">[2]</span>IOPS_&_DRIVE_HEALTH
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px]">
              <span className="text-emerald-400 font-bold">{iops.toFixed(1)} IOPS</span>
              <span className="text-zinc-500">|</span>
              <span className="text-cyan-300">{sortedPercent.toFixed(0)}% CONTIG</span>
            </div>
          </button>

          {/* Body */}
          {activeSection === 'telemetry' && (
            <div className="p-2 sm:p-2.5 flex flex-col gap-2.5 bg-black/20">
              {/* Sparkline Graph */}
              <div className="p-2 rounded border border-zinc-800 bg-zinc-950/60 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-300">
                  <span>I/O THROUGHPUT SPARKLINE</span>
                  <span className="font-bold text-emerald-400">{iops.toFixed(1)} IOPS</span>
                </div>
                <div
                  className="text-sm tracking-wider font-mono select-none overflow-hidden text-right"
                  style={{ color: theme.accent }}
                >
                  {sparklineString || '                        '}
                </div>
              </div>

              {/* Disk Alignment Gauge */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10.5px] sm:text-[11.5px]">
                  <span className="text-zinc-400">ALIGNMENT RATIO:</span>
                  <span className={fragPercent > 50 ? 'text-rose-400 font-bold' : fragPercent > 20 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {sortedPercent.toFixed(1)}% SORTED ({fragmentedCount} frag)
                  </span>
                </div>

                <div className="w-full bg-zinc-900 h-2.5 rounded-xs border border-zinc-700 overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-200"
                    style={{ width: `${sortedPercent}%` }}
                    title={`Optimized contiguous: ${sortedPercent.toFixed(1)}%`}
                  />
                  <div
                    className="h-full bg-amber-500 transition-all duration-200"
                    style={{ width: `${fragPercent}%` }}
                    title={`Fragmented: ${fragPercent.toFixed(1)}%`}
                  />
                  {corruptCount > 0 && (
                    <div
                      className="h-full bg-rose-500 transition-all duration-200 animate-pulse"
                      style={{ width: `${(corruptCount / (blocks.length || 1)) * 100}%` }}
                      title={`Corrupted: ${corruptCount} blocks`}
                    />
                  )}
                </div>
              </div>

              {/* Cumulative Counters */}
              <div className="pt-1.5 border-t border-zinc-800 flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-300">
                <div>
                  DEFRAGGED: <span className="text-zinc-100 font-bold">{(totalBlocksDefragged ?? 0).toLocaleString()}</span>
                </div>
                <div>
                  MANUAL READS: <span className="text-zinc-100 font-bold">{(totalManualClicks ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: DAEMON & CORRUPTION TUNING (HOTKEY: [3]) */}
        {/* ========================================================================= */}
        <div
          id="accordion-section-daemon"
          className="rounded border overflow-hidden transition-all duration-150"
          style={{
            borderColor: activeSection === 'daemon' ? theme.accent : theme.cardBorder,
            backgroundColor: theme.headerBg,
          }}
        >
          {/* Header */}
          <button
            type="button"
            onClick={() => toggleSection('daemon')}
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between text-left font-bold text-xs sm:text-[13px] cursor-pointer hover:brightness-110 transition-colors border-b select-none"
            style={{
              borderColor: activeSection === 'daemon' ? theme.cardBorder : 'transparent',
              backgroundColor: activeSection === 'daemon' ? 'rgba(0,0,0,0.3)' : undefined,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-black font-mono">
                {activeSection === 'daemon' ? '▼' : '▶'}
              </span>
              <span className="text-zinc-100 font-bold tracking-tight">
                <span className="text-amber-400 mr-1">[3]</span>DAEMON_&_CORRUPTION
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono">
              <span className={corruptionRate > 0 ? 'text-rose-400 font-bold' : 'text-zinc-400'}>
                {corruptionRate > 0 ? `GLITCH ${corruptionRate}%` : 'GLITCH OFF'}
              </span>
            </div>
          </button>

          {/* Body */}
          {activeSection === 'daemon' && (
            <div className="p-2 sm:p-2.5 flex flex-col gap-2.5 bg-black/20">
              {/* Corruption Rate Tuning */}
              <div
                className="p-2 rounded border flex flex-col gap-1.5"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  borderColor: corruptionRate > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center justify-between text-[10.5px] sm:text-[11.5px] font-bold">
                  <span className="flex items-center gap-1">
                    <span className={corruptionRate > 0 ? 'text-rose-400 animate-pulse' : 'text-zinc-400'}>⚠</span>
                    <span className="text-zinc-200">SECTOR CORRUPTION RATE:</span>
                  </span>
                  <span className={corruptionRate > 0 ? 'text-rose-400 font-black' : 'text-zinc-400'}>
                    {corruptionRate}% / SEC {corruptCount > 0 ? `(${corruptCount} BAD)` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={corruptionRate}
                    onChange={(e) => onChangeCorruptionRate(parseInt(e.target.value, 10) || 0)}
                    className="flex-1 accent-rose-500 h-1.5 bg-zinc-800 rounded cursor-pointer"
                  />
                  <div className="flex items-center gap-1">
                    {[0, 2, 5, 10].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => onChangeCorruptionRate(rate)}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] sm:text-[10px] border cursor-pointer font-bold ${
                          corruptionRate === rate
                            ? 'bg-rose-600 text-white border-rose-400'
                            : 'border-zinc-700 text-zinc-300 hover:text-zinc-100'
                        }`}
                      >
                        {rate === 0 ? '0' : `${rate}%`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-[9.5px] text-zinc-400">
                  Autonomous defrag heads repair bad sectors on sweep, yielding +50% bonus points.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: THREADS & SECTOR ALLOCATION (HOTKEY: [4]) */}
        {/* ========================================================================= */}
        <div
          id="accordion-section-threads"
          className="rounded border overflow-hidden transition-all duration-150"
          style={{
            borderColor: activeSection === 'threads' ? theme.accent : theme.cardBorder,
            backgroundColor: theme.headerBg,
          }}
        >
          {/* Header */}
          <button
            type="button"
            onClick={() => toggleSection('threads')}
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between text-left font-bold text-xs sm:text-[13px] cursor-pointer hover:brightness-110 transition-colors border-b select-none"
            style={{
              borderColor: activeSection === 'threads' ? theme.cardBorder : 'transparent',
              backgroundColor: activeSection === 'threads' ? 'rgba(0,0,0,0.3)' : undefined,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-purple-400 font-black font-mono">
                {activeSection === 'threads' ? '▼' : '▶'}
              </span>
              <span className="text-zinc-100 font-bold tracking-tight">
                <span className="text-purple-400 mr-1">[4]</span>THREADS_&_SECTOR_MAP
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-zinc-400">
              <span>{heads.length} Threads</span>
            </div>
          </button>

          {/* Body */}
          {activeSection === 'threads' && (
            <div className="p-2 sm:p-2.5 flex flex-col gap-2.5 bg-black/20">
              {/* Sector Data Tier Distribution */}
              <div className="flex flex-col gap-1">
                <div className="text-[9.5px] sm:text-[10.5px] text-zinc-400 uppercase font-bold">
                  Cluster Types (1 - 5 Points Yield)
                </div>
                <div className="grid grid-cols-5 gap-1 text-[9.5px] sm:text-[10.5px]">
                  {[1, 2, 3, 4, 5].map((tier) => {
                    const conf = BLOCK_TIERS[tier];
                    const count = tierDistribution[tier] || 0;
                    return (
                      <div
                        key={tier}
                        className="p-1 rounded border border-zinc-800 bg-zinc-950/60 flex flex-col items-center justify-center text-center"
                      >
                        <div className="flex items-center gap-0.5 font-bold" style={{ color: theme.tierColors[tier as 1|2|3|4|5] }}>
                          <span>{conf.char}</span>
                          <span>{conf.basePoints}p</span>
                        </div>
                        <div className="text-[9px] text-zinc-300 font-mono">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Defrag Read/Write Heads */}
              <div className="flex flex-col gap-1">
                <div className="text-[9.5px] sm:text-[10.5px] text-zinc-400 uppercase font-bold flex justify-between">
                  <span>Active Defrag Heads</span>
                  <span className="text-cyan-400">{heads.length} Threads</span>
                </div>

                <div className="flex flex-col gap-1">
                  {heads.map((head) => (
                    <div
                      key={head.id}
                      className="px-2 py-1 rounded border border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-[10px] sm:text-[11px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-black px-1 rounded-xs bg-white text-black text-[8px] sm:text-[9px]">
                          H{head.id}
                        </span>
                        <span className="text-zinc-200 font-bold truncate max-w-[90px] sm:max-w-none">{head.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px]">
                        <span className="text-zinc-400">0x{head.position.toString(16).padStart(3, '0').toUpperCase()}</span>
                        <span className="text-emerald-400 font-bold">[{head.status}]</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
