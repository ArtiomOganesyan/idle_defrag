import React, { useEffect, useRef } from 'react';
import { ClusterBlock, DefragHead, LogEntry, ThemeConfig, UpgradeDef } from '../types';
import { BLOCK_TIERS } from '../utils/themes';
import { sound } from '../utils/audio';

export type SidebarSectionKey = 'tuning' | 'legend' | 'logs' | 'daemon' | 'threads';

interface LazyDockerSidebarProps {
  // Disk state
  blocks: ClusterBlock[];
  heads: DefragHead[];
  theme: ThemeConfig;
  multiplier: number;
  iops?: number;
  pointsPerSec?: number;
  totalBlocksDefragged?: number;
  totalManualClicks?: number;

  // Logs
  logs: LogEntry[];
  onClearLogs: () => void;

  // Upgrades
  upgrades: Record<string, UpgradeDef>;
  points: number;
  onPurchaseUpgrade: (id: string) => void;

  // Corruption Rate (derived from tuning)
  corruptionRate: number;

  // Daemon & Auto-Frag
  autoFragEnabled: boolean;
  onToggleAutoFrag: () => void;
  autoFragBatch?: number;
  onChangeAutoFragBatch?: (batch: number) => void;
  autoFragIntervalMs?: number;
  onChangeAutoFragInterval?: (intervalMs: number) => void;

  // Controlled Accordion Props
  activeSection?: SidebarSectionKey | null;
  onToggleSection?: (key: SidebarSectionKey) => void;
  onCloseAll?: () => void;
  onOpenTuningInfo?: () => void;
}

export const LazyDockerSidebar: React.FC<LazyDockerSidebarProps> = ({
  blocks,
  heads,
  theme,
  multiplier,
  logs,
  onClearLogs,
  upgrades,
  points,
  onPurchaseUpgrade,
  corruptionRate,
  autoFragEnabled,
  onToggleAutoFrag,
  autoFragBatch = 3,
  onChangeAutoFragBatch,
  autoFragIntervalMs = 2000,
  onChangeAutoFragInterval,
  activeSection = 'tuning',
  onToggleSection,
  onCloseAll,
  onOpenTuningInfo,
}) => {
  const logScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logScrollRef.current && activeSection === 'logs') {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logs, activeSection]);

  const toggleSection = (key: SidebarSectionKey) => {
    if (onToggleSection) {
      onToggleSection(key);
    }
  };

  const corruptCount = blocks.filter((b) => b.isCorrupted).length;
  const freeCount = blocks.filter((b) => b.isFree).length;

  // Tier distribution on disk
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

  // Define ordered keys for the 6 upgrade cards: Speed, Capacity, Yield, Heads, Corruption (0-10), AutoFrag
  const upgradeKeys = ['speed', 'capacity', 'yield', 'heads', 'corruption', 'autoFrag'];
  const upgradeList: UpgradeDef[] = upgradeKeys
    .map((k) => upgrades[k])
    .filter(Boolean);

  const getBadgeColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'SUCCESS':
        return 'text-emerald-400 border-emerald-800 bg-emerald-950/40';
      case 'WARN':
        return 'text-amber-400 border-amber-800 bg-amber-950/40';
      case 'IO':
        return 'text-cyan-400 border-cyan-800 bg-cyan-950/40';
      case 'SYS':
        return 'text-purple-400 border-purple-800 bg-purple-950/40';
      case 'CORRUPT':
        return 'text-rose-400 border-rose-800 bg-rose-950/40';
      case 'FORMAT':
        return 'text-pink-400 border-pink-800 bg-pink-950/40';
      default:
        return 'text-zinc-400 border-zinc-700 bg-zinc-900/40';
    }
  };

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
          {(['tuning', 'legend', 'logs', 'daemon', 'threads'] as SidebarSectionKey[]).map((sec, idx) => {
            const isActive = activeSection === sec;
            const labels: Record<SidebarSectionKey, string> = {
              tuning: 'TUN',
              legend: 'LEG',
              logs: 'LOG',
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
                [{idx + 1}] {labels[sec]}
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
                <span className="text-emerald-400 mr-1">[1]</span>SYSTEM_TUNING_UPGRADES
              </span>
            </button>

            <div className="flex items-center gap-1.5">
              {onOpenTuningInfo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playBeep();
                    onOpenTuningInfo();
                  }}
                  title="Open detailed Tuning Specifications Directory"
                  className="px-1.5 py-0.2 rounded text-[10px] sm:text-[11px] font-bold border border-cyan-500/50 text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 hover:border-cyan-400 cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                >
                  <span>ⓘ SPECS</span>
                </button>
              )}
              <span className="text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded bg-black/40 text-emerald-400 border border-zinc-700 font-mono">
                6 UPGRADES
              </span>
            </div>
          </div>

          {/* Body: Upgrades Cards */}
          {activeSection === 'tuning' && (
            <div className="p-2 sm:p-2.5 flex flex-col gap-2 bg-black/20">
              <div className="grid grid-cols-1 gap-2">
                {upgradeList.map((upg, idx) => {
                  const cost = calculateCost(upg);
                  const isMax = upg.level >= upg.maxLevel;
                  const canAfford = points >= cost && !isMax;

                  return (
                    <div
                      key={upg.id}
                      className="p-2 rounded border transition-all flex flex-col gap-1.5 shadow-sm"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderColor: canAfford ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      {/* Top Row: Tag, Name & Level Badge */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.2 rounded border uppercase tracking-wider"
                            style={{
                              borderColor:
                                upg.id === 'corruption'
                                  ? 'rgba(244, 63, 94, 0.4)'
                                  : upg.id === 'speed'
                                  ? 'rgba(52, 211, 153, 0.4)'
                                  : upg.id === 'capacity'
                                  ? 'rgba(56, 189, 248, 0.4)'
                                  : upg.id === 'yield'
                                  ? 'rgba(251, 191, 36, 0.4)'
                                  : upg.id === 'heads'
                                  ? 'rgba(192, 132, 252, 0.4)'
                                  : 'rgba(248, 113, 113, 0.4)',
                              color:
                                upg.id === 'corruption'
                                  ? '#fb7185'
                                  : upg.id === 'speed'
                                  ? '#34d399'
                                  : upg.id === 'capacity'
                                  ? '#38bdf8'
                                  : upg.id === 'yield'
                                  ? '#fbbf24'
                                  : upg.id === 'heads'
                                  ? '#c084fc'
                                  : '#f87171',
                              backgroundColor: 'rgba(0,0,0,0.4)',
                            }}
                          >
                            {upg.tag}
                          </span>
                          <span className="font-bold text-zinc-100 text-[11px] sm:text-xs truncate">
                            {upg.name}
                          </span>
                        </div>

                        <span className="text-[10px] sm:text-[11px] font-mono text-zinc-300 shrink-0 font-bold">
                          LVL {upg.level}/{upg.maxLevel}
                        </span>
                      </div>

                      {/* Middle Row: Progress Bar & Current Value */}
                      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px] text-zinc-400">
                        <span className="font-mono text-emerald-400">
                          [{getProgressBar(upg.level, upg.maxLevel, 8)}]
                        </span>
                        <span className="font-mono text-zinc-200 font-bold">{upg.unit}</span>
                      </div>

                      {/* Description */}
                      <p className="text-[9.5px] sm:text-[10px] text-zinc-400 leading-tight">
                        {upg.description}
                      </p>

                      {/* Bottom Row: Buy Button */}
                      <div className="flex items-center justify-end pt-1 border-t border-zinc-800/80">
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => {
                            sound.playUpgrade();
                            onPurchaseUpgrade(upg.id);
                          }}
                          className={`px-2 py-1 rounded text-[10.5px] sm:text-xs font-bold border cursor-pointer font-mono transition-all flex items-center gap-1.5 ${
                            isMax
                              ? 'border-zinc-700 bg-zinc-800 text-zinc-400 cursor-not-allowed'
                              : canAfford
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-xs active:scale-95'
                              : 'border-zinc-800 bg-zinc-900/60 text-zinc-500 cursor-not-allowed'
                          }`}
                        >
                          {isMax ? (
                            <span>MAX LVL ({upg.maxLevel})</span>
                          ) : (
                            <>
                              <span className="text-zinc-300 font-normal">[{idx + 1}]</span>
                              <span>BUY (-{formatNum(cost)} PTS)</span>
                            </>
                          )}
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
        {/* SECTION 2: CLUSTER LEGEND (MOVED TO SIDEBAR) (HOTKEY: [2]) */}
        {/* ========================================================================= */}
        <div
          id="accordion-section-legend"
          className="rounded border overflow-hidden transition-all duration-150 flex flex-col shrink-0"
          style={{
            borderColor: activeSection === 'legend' ? theme.accent : theme.cardBorder,
            backgroundColor: theme.headerBg,
          }}
        >
          {/* Header */}
          <button
            type="button"
            onClick={() => toggleSection('legend')}
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between text-left font-bold text-xs sm:text-[13px] cursor-pointer hover:brightness-110 transition-colors border-b select-none shrink-0"
            style={{
              borderColor: activeSection === 'legend' ? theme.cardBorder : 'transparent',
              backgroundColor: activeSection === 'legend' ? 'rgba(0,0,0,0.3)' : undefined,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-black font-mono">
                {activeSection === 'legend' ? '▼' : '▶'}
              </span>
              <span className="text-zinc-100 font-bold tracking-tight">
                <span className="text-emerald-400 mr-1">[2]</span>CLUSTER_LEGEND
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded bg-black/40 text-cyan-300 border border-zinc-700 font-mono">
                5 TIERS + BAD
              </span>
            </div>
          </button>

          {/* Body */}
          {activeSection === 'legend' && (
            <div className="p-2 sm:p-2.5 flex flex-col gap-1.5 bg-black/20">
              <div className="text-[10px] sm:text-[11px] uppercase text-zinc-400 font-bold flex justify-between shrink-0 px-0.5">
                <span>Target Ordered Sectors</span>
                <span className="text-zinc-500">Track Alignment</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {Object.values(BLOCK_TIERS)
                  .sort((a, b) => b.tier - a.tier) // Ordered 5 -> 4 -> 3 -> 2 -> 1
                  .map((item) => {
                    const calculatedPoints = Math.round(item.basePoints * multiplier * 10) / 10;
                    const count = tierDistribution[item.tier] || 0;
                    return (
                      <div
                        key={item.tier}
                        className="px-2 py-1.5 rounded border flex items-center justify-between text-[11px] sm:text-xs"
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.35)',
                          borderColor: theme.cardBorder,
                        }}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="font-bold text-sm sm:text-base shrink-0"
                            style={{ color: theme.tierColors[item.tier] }}
                          >
                            {item.char}
                          </span>
                          <div className="flex flex-col leading-tight truncate">
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-100 font-bold truncate">{item.name}</span>
                              <span className="text-[9.5px] text-zinc-400">({count} on disk)</span>
                            </div>
                            <span className="text-[9.5px] text-zinc-400 truncate">{item.targetZone}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 font-mono text-[10.5px] sm:text-[11.5px] shrink-0">
                          <span className="text-emerald-400 font-bold">
                            {calculatedPoints} PTS
                          </span>
                        </div>
                      </div>
                    );
                  })}

                {/* Bad Sector Legend Item */}
                <div
                  className="px-2 py-1.5 rounded border flex items-center justify-between text-[11px] sm:text-xs"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-sm sm:text-base text-rose-500 animate-pulse shrink-0">
                      ✖
                    </span>
                    <div className="flex flex-col leading-tight truncate">
                      <div className="flex items-center gap-1">
                        <span className="text-rose-400 font-bold truncate">BAD_SECTOR (CORRUPT)</span>
                        <span className="text-[9.5px] text-rose-300">({corruptCount} active)</span>
                      </div>
                      <span className="text-[9.5px] text-zinc-400 truncate">Repaired by Autonomous Heads</span>
                    </div>
                  </div>
                  <span className="text-rose-400 font-bold text-[10.5px] sm:text-[11.5px] shrink-0">
                    +50% BONUS
                  </span>
                </div>

                {/* Free Space */}
                <div
                  className="px-2 py-1.5 rounded border flex items-center justify-between text-[11px] sm:text-xs"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-600">_</span>
                    <div className="flex flex-col leading-tight">
                      <span className="text-zinc-300 font-bold">FREE_SECTOR (EMPTY)</span>
                      <span className="text-[9.5px] text-zinc-500">{freeCount} available clusters</span>
                    </div>
                  </div>
                  <span className="text-zinc-500 font-bold text-[10.5px]">0 PTS</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: EVENT LOGS (MOVED TO SIDEBAR) (HOTKEY: [3]) */}
        {/* ========================================================================= */}
        <div
          id="accordion-section-logs"
          className="rounded border overflow-hidden transition-all duration-150 flex flex-col shrink-0"
          style={{
            borderColor: activeSection === 'logs' ? theme.accent : theme.cardBorder,
            backgroundColor: theme.headerBg,
          }}
        >
          {/* Header */}
          <button
            type="button"
            onClick={() => toggleSection('logs')}
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between text-left font-bold text-xs sm:text-[13px] cursor-pointer hover:brightness-110 transition-colors border-b select-none shrink-0"
            style={{
              borderColor: activeSection === 'logs' ? theme.cardBorder : 'transparent',
              backgroundColor: activeSection === 'logs' ? 'rgba(0,0,0,0.3)' : undefined,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-black font-mono">
                {activeSection === 'logs' ? '▼' : '▶'}
              </span>
              <span className="text-zinc-100 font-bold tracking-tight">
                <span className="text-emerald-400 mr-1">[3]</span>EVENT_LOG
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded bg-black/40 text-emerald-400 border border-zinc-700 font-mono">
                {logs.length} EVENTS
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playBeep();
                  onClearLogs();
                }}
                className="text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.2 rounded border border-zinc-700 hover:border-zinc-500 bg-zinc-900 transition-colors cursor-pointer"
              >
                CLEAR
              </span>
            </div>
          </button>

          {/* Body */}
          {activeSection === 'logs' && (
            <div
              ref={logScrollRef}
              className="p-2 sm:p-2.5 overflow-y-auto font-mono text-[11px] sm:text-xs space-y-1.5 custom-scrollbar min-h-[140px] max-h-[260px] bg-black/20"
            >
              {logs.length === 0 ? (
                <div className="text-center text-zinc-500 italic py-4">
                  No events recorded. Waiting for disk operations...
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-zinc-500 text-[9.5px] sm:text-[10.5px] shrink-0 font-mono">
                      {log.timestamp}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1 py-0.2 rounded-xs border shrink-0 ${getBadgeColor(
                        log.level
                      )}`}
                    >
                      {log.tag}
                    </span>
                    <span className="text-zinc-200 break-all text-[10.5px] sm:text-[11.5px]">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: DAEMON & WRITE ACTIVITY (HOTKEY: [4]) */}
        {/* ========================================================================= */}
        <div
          id="accordion-section-daemon"
          className="rounded border overflow-hidden transition-all duration-150 flex flex-col shrink-0"
          style={{
            borderColor: activeSection === 'daemon' ? theme.accent : theme.cardBorder,
            backgroundColor: theme.headerBg,
          }}
        >
          {/* Header */}
          <button
            type="button"
            onClick={() => toggleSection('daemon')}
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between text-left font-bold text-xs sm:text-[13px] cursor-pointer hover:brightness-110 transition-colors border-b select-none shrink-0"
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
                <span className="text-amber-400 mr-1">[4]</span>DAEMON_&_WRITE_INGESTION
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono">
              <span className={autoFragEnabled ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                {autoFragEnabled ? 'WRITE RUNNING' : 'PAUSED'}
              </span>
            </div>
          </button>

          {/* Body */}
          {activeSection === 'daemon' && (
            <div className="p-2 sm:p-2.5 flex flex-col gap-2 bg-black/20">
              {/* Auto-Frag Daemon Switch */}
              <div
                className="p-2 rounded border flex flex-col gap-1.5"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  borderColor: autoFragEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-200">
                    SIMULATED INCOMING FILE WRITES
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playBeep();
                      onToggleAutoFrag();
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer transition-all ${
                      autoFragEnabled
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {autoFragEnabled ? 'ACTIVE [ON]' : 'PAUSED [OFF]'}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Injects fresh fragmented blocks onto drive sectors continuously to simulate background OS filesystem writes.
                </p>
              </div>

              {/* Data Corruption Telemetry Status */}
              <div
                className="p-2 rounded border flex flex-col gap-1.5"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  borderColor: corruptionRate > 0 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1">
                    <span className={corruptionRate > 0 ? 'text-rose-400 animate-pulse' : 'text-zinc-400'}>
                      ⚠
                    </span>
                    <span className="text-zinc-200">ACTIVE DATA CORRUPTION:</span>
                  </span>
                  <span className={corruptionRate > 0 ? 'text-rose-400 font-black' : 'text-zinc-400'}>
                    {corruptionRate > 0 ? `LVL ${corruptionRate}/10 (${corruptionRate}% GLITCH)` : '0% (OFF)'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Controlled by System Tuning Upgrade [1]. Higher levels corrupt more blocks across disk. Bad sectors repaired by heads yield +50% bonus points.
                </p>
                {corruptCount > 0 && (
                  <div className="text-[10px] text-rose-300 font-bold font-mono">
                    ● {corruptCount} corrupted blocks currently awaiting head repair.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: THREADS & ACTIVE HEADS (HOTKEY: [5]) */}
        {/* ========================================================================= */}
        <div
          id="accordion-section-threads"
          className="rounded border overflow-hidden transition-all duration-150 flex flex-col shrink-0"
          style={{
            borderColor: activeSection === 'threads' ? theme.accent : theme.cardBorder,
            backgroundColor: theme.headerBg,
          }}
        >
          {/* Header */}
          <button
            type="button"
            onClick={() => toggleSection('threads')}
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between text-left font-bold text-xs sm:text-[13px] cursor-pointer hover:brightness-110 transition-colors border-b select-none shrink-0"
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
                <span className="text-purple-400 mr-1">[5]</span>THREADS_&_HEADS_MONITOR
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-zinc-400">
              <span>{heads.length} Threads</span>
            </div>
          </button>

          {/* Body */}
          {activeSection === 'threads' && (
            <div className="p-2 sm:p-2.5 flex flex-col gap-2 bg-black/20">
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
                        <span className="text-emerald-400 font-bold">
                          [{head.status}]
                        </span>
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
