import React, { useState } from 'react';
import { ClusterBlock, DefragHead, ThemeConfig } from '../types';
import { BLOCK_TIERS } from '../utils/themes';

interface DefragGridProps {
  blocks: ClusterBlock[];
  heads: DefragHead[];
  theme: ThemeConfig;
  activeHeadIndex: number;
  onManualCycle: () => void;
  autoDefragActive: boolean;
  onToggleAutoDefrag: () => void;
}

export const DefragGrid: React.FC<DefragGridProps> = ({
  blocks,
  heads,
  theme,
  onManualCycle,
  autoDefragActive,
  onToggleAutoDefrag,
}) => {
  const [density, setDensity] = useState<'compact' | 'normal' | 'relaxed'>('normal');

  // Determine block style and glyph based on its state
  const renderBlockGlyph = (block: ClusterBlock) => {
    const activeHeadOnBlock = heads.find((h) => h.position === block.id);
    if (activeHeadOnBlock) {
      return '▲';
    }
    if (block.isCorrupted) {
      return '✖';
    }
    if (block.isFree) {
      return '·';
    }
    const tierInfo = BLOCK_TIERS[block.tier];
    return tierInfo ? tierInfo.char : '█';
  };

  const getBlockColor = (block: ClusterBlock) => {
    const activeHeadOnBlock = heads.find((h) => h.position === block.id);
    if (activeHeadOnBlock) {
      return '#ffffff';
    }
    if (block.isCorrupted) {
      return theme.tierColors.corrupt || '#ef4444';
    }
    if (block.isFree) {
      return theme.tierColors.free;
    }
    return theme.tierColors[block.tier] || theme.accent;
  };

  // Calculate statistics for the visual status line
  const total = blocks.length;
  const totalOkBlocks = blocks.filter((b) => !b.isFree && !b.isCorrupted).length;
  const sortedCount = blocks.filter((b) => b.isSorted && !b.isFree && !b.isCorrupted).length;
  const fragCount = blocks.filter((b) => !b.isSorted && !b.isFree && !b.isCorrupted).length;
  const corruptCount = blocks.filter((b) => b.isCorrupted).length;
  const freeCount = blocks.filter((b) => b.isFree).length;
  const percentSorted = totalOkBlocks > 0 ? ((sortedCount / totalOkBlocks) * 100).toFixed(1) : '0.0';

  const minBlockSize = density === 'compact' ? '0.42rem' : density === 'normal' ? '0.54rem' : '0.72rem';

  return (
    <div
      id="defrag-cluster-map"
      className="flex flex-col h-full rounded border overflow-hidden relative shadow-lg"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.cardBorder,
      }}
    >
      {/* Box Drawing Window Header */}
      <div
        className="px-2.5 sm:px-3 py-1 sm:py-1.5 border-b flex items-center justify-between gap-1.5 text-[11px] sm:text-xs font-mono font-bold shrink-0"
        style={{
          backgroundColor: theme.headerBg,
          borderColor: theme.cardBorder,
          color: theme.textPrimary,
        }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
          <span className="text-zinc-500 hidden sm:inline">┌─</span>
          <span className="tracking-wide" style={{ color: theme.accent }}>
            DISK_CLUSTER_MAP
          </span>
          <span className="text-[10px] text-zinc-400 font-normal hidden md:inline">
            ({total} SECTORS // LBA 0x0000 - 0x{total.toString(16).toUpperCase().padStart(4, '0')})
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] sm:text-[11px]">
          {/* Density Switcher */}
          <div className="flex items-center rounded border border-zinc-800 bg-black/40 text-[9px] sm:text-[10px]">
            <button
              onClick={() => setDensity('compact')}
              title="Compact Density"
              className={`px-1.5 py-0.5 rounded-l cursor-pointer ${density === 'compact' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
            >
              XS
            </button>
            <button
              onClick={() => setDensity('normal')}
              title="Normal Density"
              className={`px-1.5 py-0.5 cursor-pointer ${density === 'normal' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
            >
              MD
            </button>
            <button
              onClick={() => setDensity('relaxed')}
              title="Relaxed Density"
              className={`px-1.5 py-0.5 rounded-r cursor-pointer ${density === 'relaxed' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
            >
              LG
            </button>
          </div>

          <span className="text-emerald-400 font-mono font-bold whitespace-nowrap">
            {percentSorted}% CONTIG
          </span>
          <span className="text-zinc-500 hidden sm:inline">─┐</span>
        </div>
      </div>

      {/* Target Defrag Stratification Zone Order Track Bar */}
      <div
        className="px-2.5 py-1 border-b flex items-center justify-between gap-1 text-[9px] sm:text-[10px] font-mono overflow-x-auto select-none bg-black/30"
        style={{ borderColor: theme.cardBorder }}
      >
        <span className="text-zinc-400 font-bold shrink-0 hidden sm:inline">TRACK ORDER ➔</span>
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto whitespace-nowrap">
          <span className="px-1 py-0.2 rounded bg-pink-950/40 border border-pink-700/50" style={{ color: theme.tierColors[5] }}>
            █ 5.KERNEL
          </span>
          <span className="text-zinc-600">➔</span>
          <span className="px-1 py-0.2 rounded bg-amber-950/40 border border-amber-700/50" style={{ color: theme.tierColors[4] }}>
            █ 4.SYSTEM
          </span>
          <span className="text-zinc-600">➔</span>
          <span className="px-1 py-0.2 rounded bg-cyan-950/40 border border-cyan-700/50" style={{ color: theme.tierColors[3] }}>
            ▓ 3.APPS
          </span>
          <span className="text-zinc-600">➔</span>
          <span className="px-1 py-0.2 rounded bg-emerald-950/40 border border-emerald-700/50" style={{ color: theme.tierColors[2] }}>
            ▒ 2.USER
          </span>
          <span className="text-zinc-600">➔</span>
          <span className="px-1 py-0.2 rounded bg-slate-800/60 border border-slate-700/50" style={{ color: theme.tierColors[1] }}>
            ░ 1.TEMP
          </span>
          <span className="text-zinc-600">➔</span>
          <span className="px-1 py-0.2 rounded bg-black border border-zinc-800 text-zinc-500">
            · FREE SPACE
          </span>
        </div>
      </div>

      {/* The ASCII Grid Container with Adaptive Flow */}
      <div
        id="cluster-grid-scroll-area"
        className="flex-1 p-1.5 sm:p-2 overflow-y-auto overflow-x-hidden font-mono select-none flex flex-col justify-start custom-scrollbar"
      >
        <div
          className="grid gap-[1px] sm:gap-[1.5px] items-center justify-center auto-rows-max"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${minBlockSize}, 1fr))`,
          }}
        >
          {blocks.map((block) => {
            const isHead = heads.some((h) => h.position === block.id);
            const headObj = heads.find((h) => h.position === block.id);
            const color = getBlockColor(block);
            const glyph = renderBlockGlyph(block);

            return (
              <div
                key={block.id}
                id={`sector-block-${block.id}`}
                className={`group relative aspect-square flex items-center justify-center text-[7px] sm:text-[8px] md:text-[9px] font-black rounded-xs transition-all duration-100 cursor-default border select-none ${
                  isHead
                    ? 'scale-115 z-20 animate-pulse border-white shadow-[0_0_6px_#ffffff]'
                    : block.isCorrupted
                    ? 'scale-110 z-10 border-rose-500 bg-rose-950/60 shadow-[0_0_6px_#ef4444] animate-pulse'
                    : block.isProcessing
                    ? 'scale-110 z-10 border-amber-300 shadow-[0_0_5px_#f59e0b]'
                    : block.isSorted
                    ? 'border-emerald-500/30'
                    : 'border-transparent opacity-90'
                }`}
                style={{
                  backgroundColor: isHead
                    ? '#ffffff'
                    : block.isCorrupted
                    ? 'rgba(239, 68, 68, 0.25)'
                    : block.isFree
                    ? 'rgba(255, 255, 255, 0.02)'
                    : block.isSorted
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(255, 255, 255, 0.06)',
                  color: isHead ? '#000000' : color,
                }}
              >
                <span className="leading-none select-none pointer-events-none">
                  {glyph}
                </span>

                {/* Head Indicator Badge */}
                {headObj && (
                  <span
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[6px] sm:text-[7px] font-mono font-black px-0.5 py-0 bg-white text-black rounded-xs shadow-md z-30"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    H{headObj.id}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Defrag Bottom Action & Shortcut Bar */}
      <div
        className="px-2.5 sm:px-3 py-1.5 sm:py-2 border-t flex flex-wrap items-center justify-between gap-1.5 text-xs font-mono shrink-0"
        style={{
          backgroundColor: theme.headerBg,
          borderColor: theme.cardBorder,
          color: theme.textPrimary,
        }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-[11px]">
          <button
            id="btn-manual-step-head"
            onClick={onManualCycle}
            className="px-2 sm:px-2.5 py-1 rounded border font-bold cursor-pointer transition-all hover:brightness-125 active:scale-95 flex items-center gap-1 shadow-sm"
            style={{
              backgroundColor: theme.accent,
              color: '#000000',
              borderColor: theme.accent,
            }}
          >
            <span>[SPACE]</span>
            <span className="hidden xs:inline">DEFRAG</span>
            <span className="xs:hidden">STEP</span>
          </button>

          <button
            id="btn-toggle-auto-defrag"
            onClick={onToggleAutoDefrag}
            className={`px-2 py-1 rounded border font-mono font-bold cursor-pointer transition-colors ${
              autoDefragActive
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500'
                : 'bg-zinc-800 text-zinc-400 border-zinc-600'
            }`}
          >
            <span>[A] AUTO: {autoDefragActive ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] opacity-90">
          <span className="flex items-center gap-1">
            <span className="text-emerald-400">●</span> {sortedCount} <span className="hidden sm:inline">Sorted</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-amber-400">●</span> {fragCount} <span className="hidden sm:inline">Frag</span>
          </span>
          {corruptCount > 0 && (
            <span className="flex items-center gap-1 text-rose-400 font-bold animate-pulse">
              <span>✖</span> {corruptCount} Bad
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="text-zinc-500">○</span> {freeCount} <span className="hidden sm:inline">Free</span>
          </span>
        </div>
      </div>
    </div>
  );
};
