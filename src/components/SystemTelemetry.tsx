import React from 'react';
import { ClusterBlock, DefragHead, ThemeConfig } from '../types';
import { BLOCK_TIERS } from '../utils/themes';

interface SystemTelemetryProps {
  blocks: ClusterBlock[];
  heads: DefragHead[];
  theme: ThemeConfig;
  iops: number;
  pointsPerSec: number;
  totalBlocksDefragged: number;
  totalManualClicks: number;
  iopsHistory: number[];
  corruptionRate: number;
  onChangeCorruptionRate: (rate: number) => void;
  autoFragEnabled: boolean;
  onToggleAutoFrag: () => void;
  autoFragBatch: number;
  onChangeAutoFragBatch: (batch: number) => void;
  autoFragIntervalMs: number;
  onChangeAutoFragInterval: (intervalMs: number) => void;
}

export const SystemTelemetry: React.FC<SystemTelemetryProps> = ({
  blocks,
  heads,
  theme,
  iops,
  pointsPerSec,
  totalBlocksDefragged,
  totalManualClicks,
  iopsHistory,
  corruptionRate,
  onChangeCorruptionRate,
  autoFragEnabled,
  onToggleAutoFrag,
  autoFragBatch,
  onChangeAutoFragBatch,
  autoFragIntervalMs,
  onChangeAutoFragInterval,
}) => {
  // Calculate fragmentation percentage
  const totalOccupied = blocks.filter((b) => !b.isFree).length;
  const fragmentedCount = blocks.filter((b) => !b.isFree && !b.isSorted && !b.isCorrupted).length;
  const sortedCount = blocks.filter((b) => !b.isFree && b.isSorted && !b.isCorrupted).length;
  const corruptCount = blocks.filter((b) => b.isCorrupted).length;
  
  const fragPercent = totalOccupied > 0 ? (fragmentedCount / totalOccupied) * 100 : 0;
  const sortedPercent = totalOccupied > 0 ? (sortedCount / totalOccupied) * 100 : 100;

  // Generate ASCII Sparkline for IOPS history (btop style)
  const sparklineChars = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const maxIops = Math.max(...iopsHistory, 10);
  const sparklineString = iopsHistory
    .slice(-28)
    .map((val) => {
      const idx = Math.min(
        sparklineChars.length - 1,
        Math.floor((val / maxIops) * (sparklineChars.length - 1))
      );
      return sparklineChars[idx];
    })
    .join('');

  // Calculate cluster tier distribution
  const tierDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  blocks.forEach((b) => {
    if (!b.isFree && !b.isCorrupted) {
      tierDistribution[b.tier] = (tierDistribution[b.tier] || 0) + 1;
    }
  });

  return (
    <div
      id="system-telemetry-panel"
      className="flex flex-col gap-2.5 p-3 rounded border font-mono text-xs shadow-md"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.cardBorder,
        color: theme.textPrimary,
      }}
    >
      {/* Box Title */}
      <div className="flex items-center justify-between border-b pb-1 font-bold text-[11px] sm:text-xs" style={{ borderColor: theme.cardBorder }}>
        <div className="flex items-center gap-1">
          <span className="text-zinc-500">┌─</span>
          <span style={{ color: theme.accent }}>IOPS_&_DRIVE_HEALTH</span>
        </div>
        <span className="text-[9px] sm:text-[10px] text-zinc-400">REALTIME</span>
      </div>

      {/* IOPS Sparkline Graph (btop aesthetic) */}
      <div
        className="p-1.5 sm:p-2 rounded border flex flex-col gap-0.5"
        style={{
          backgroundColor: theme.headerBg,
          borderColor: theme.cardBorder,
        }}
      >
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-zinc-400">
          <span>I/O THROUGHPUT (IOPS)</span>
          <span className="font-bold text-emerald-400">{iops.toFixed(1)} IOPS</span>
        </div>
        <div
          className="text-xs sm:text-sm tracking-widest font-mono select-none overflow-hidden text-right"
          style={{ color: theme.accent }}
        >
          {sparklineString || '                                '}
        </div>
      </div>

      {/* Fragmentation Status Gauge */}
      <div className="flex flex-col gap-0.5">
        <div className="flex justify-between text-[10px] sm:text-[11px]">
          <span className="text-zinc-400">DISK ALIGNMENT:</span>
          <span className={fragPercent > 50 ? 'text-rose-400 font-bold' : fragPercent > 20 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
            {sortedPercent.toFixed(1)}% SORTED ({fragmentedCount} frag)
          </span>
        </div>

        {/* ASCII Gauge Bar */}
        <div className="w-full bg-zinc-900 h-2 sm:h-2.5 rounded-xs border border-zinc-700 overflow-hidden flex">
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

      {/* Corruption Rate Tuning Section */}
      <div
        className="p-2 rounded border flex flex-col gap-1.5"
        style={{
          backgroundColor: theme.headerBg,
          borderColor: corruptionRate > 0 ? 'rgba(239, 68, 68, 0.4)' : theme.cardBorder,
        }}
      >
        <div className="flex items-center justify-between text-[10px] font-bold">
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
                className={`px-1.5 py-0.2 rounded text-[9px] border cursor-pointer font-bold ${
                  corruptionRate === rate
                    ? 'bg-rose-600 text-white border-rose-400'
                    : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {rate === 0 ? 'OFF' : `${rate}%`}
              </button>
            ))}
          </div>
        </div>
        <span className="text-[9px] text-zinc-400 leading-tight">
          {corruptionRate > 0
            ? 'Bad sectors trigger periodically. Repairing corrupted clusters gives +50% bonus yield.'
            : 'Corruption disabled. Increase slider to introduce volatile glitch sectors.'}
        </span>
      </div>

      {/* Auto-Fragmentation (R Frag Data) Configuration */}
      <div
        className="p-2 rounded border flex flex-col gap-1.5"
        style={{
          backgroundColor: theme.headerBg,
          borderColor: autoFragEnabled ? 'rgba(245, 158, 11, 0.4)' : theme.cardBorder,
        }}
      >
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-amber-400 flex items-center gap-1">
            <span>⚡</span>
            <span>AUTO-FRAG DAEMON (DATA INJECTION)</span>
          </span>
          <button
            onClick={onToggleAutoFrag}
            className={`px-1.5 py-0.2 rounded text-[9px] border font-bold cursor-pointer ${
              autoFragEnabled ? 'bg-amber-500 text-black border-amber-400' : 'border-zinc-700 text-zinc-400'
            }`}
          >
            {autoFragEnabled ? 'ENABLED' : 'PAUSED'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {/* Batch Size */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[9px] text-zinc-400">
              <span>BATCH SIZE:</span>
              <span className="text-amber-300 font-bold">{autoFragBatch} BLOCKS</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={autoFragBatch}
              onChange={(e) => onChangeAutoFragBatch(parseInt(e.target.value, 10) || 1)}
              className="accent-amber-500 h-1.5 bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          {/* Injection Speed / Interval */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[9px] text-zinc-400">
              <span>INTERVAL:</span>
              <span className="text-amber-300 font-bold">{(autoFragIntervalMs / 1000).toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="250"
              value={autoFragIntervalMs}
              onChange={(e) => onChangeAutoFragInterval(parseInt(e.target.value, 10) || 1500)}
              className="accent-amber-500 h-1.5 bg-zinc-800 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Sector Tier Breakdown */}
      <div className="flex flex-col gap-1 pt-0.5">
        <div className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
          Cluster Data Types (1 - 5 Points Yield)
        </div>
        <div className="grid grid-cols-5 gap-1 text-[9px] sm:text-[10px]">
          {[1, 2, 3, 4, 5].map((tier) => {
            const conf = BLOCK_TIERS[tier];
            const count = tierDistribution[tier] || 0;
            return (
              <div
                key={tier}
                className="p-0.5 sm:p-1 rounded border flex flex-col items-center justify-center text-center"
                style={{
                  backgroundColor: theme.headerBg,
                  borderColor: theme.cardBorder,
                }}
              >
                <div className="flex items-center gap-0.5 sm:gap-1 font-bold" style={{ color: theme.tierColors[tier as 1|2|3|4|5] }}>
                  <span>{conf.char}</span>
                  <span>{conf.basePoints}pt</span>
                </div>
                <div className="text-[9px] sm:text-[10px] text-zinc-300 font-mono">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Defrag Read/Write Heads status */}
      <div className="flex flex-col gap-1 pt-0.5">
        <div className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex justify-between">
          <span>Active Defrag Heads</span>
          <span className="text-cyan-400">{heads.length} Threads</span>
        </div>

        <div className="flex flex-col gap-1">
          {heads.map((head) => (
            <div
              key={head.id}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border flex items-center justify-between text-[10px] sm:text-[11px]"
              style={{
                backgroundColor: theme.headerBg,
                borderColor: theme.cardBorder,
              }}
            >
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-black px-1 rounded-xs bg-white text-black text-[8px] sm:text-[9px]">
                  H{head.id}
                </span>
                <span className="text-zinc-300 font-bold truncate max-w-[90px] sm:max-w-none">{head.name}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px]">
                <span className="text-zinc-400 hidden xs:inline">0x{head.position.toString(16).padStart(3, '0').toUpperCase()}</span>
                <span className="text-emerald-400 font-bold">[{head.status}]</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cumulative Counters */}
      <div className="pt-1 sm:pt-1.5 border-t flex items-center justify-between text-[9px] sm:text-[10px] text-zinc-400" style={{ borderColor: theme.cardBorder }}>
        <div>
          DEFRAGGED: <span className="text-zinc-200 font-bold">{(totalBlocksDefragged ?? 0).toLocaleString()}</span>
        </div>
        <div>
          MANUAL: <span className="text-zinc-200 font-bold">{(totalManualClicks ?? 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
