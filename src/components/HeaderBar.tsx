import React, { useEffect, useState } from 'react';
import { ThemeConfig } from '../types';
import { sound } from '../utils/audio';

interface HeaderBarProps {
  theme: ThemeConfig;
  points: number;
  pointsPerSec: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onCycleTheme: () => void;
  crtEffect: boolean;
  onToggleCrt: () => void;
  onOpenHelp: () => void;
  onInjectFrag: () => void;
  onOpenFormat: () => void;
  formatCount: number;
  formatPoints: number;
  pendingFormatPoints: number;
  autoFragEnabled: boolean;
  onToggleAutoFrag: () => void;
  corruptionRate: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  theme,
  points,
  pointsPerSec,
  soundEnabled,
  onToggleSound,
  onCycleTheme,
  crtEffect,
  onToggleCrt,
  onOpenHelp,
  onInjectFrag,
  onOpenFormat,
  formatCount,
  formatPoints,
  pendingFormatPoints,
  autoFragEnabled,
  onToggleAutoFrag,
  corruptionRate,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [uptimeSec, setUptimeSec] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const d = new Date();
      setTimeStr(
        d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0').slice(0, 2)
      );
    };
    updateTimer();
    const interval = setInterval(updateTimer, 100);
    const uptimeTimer = setInterval(() => setUptimeSec((s) => s + 1), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(uptimeTimer);
    };
  }, []);

  const formatUptime = (total: number) => {
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 10_000) return (n / 1_000).toFixed(1) + 'k';
    return n.toLocaleString();
  };

  return (
    <header
      id="terminal-header"
      className="w-full border-b px-2 sm:px-3 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-xs select-none shrink-0"
      style={{
        backgroundColor: theme.headerBg,
        borderColor: theme.cardBorder,
        color: theme.textPrimary,
      }}
    >
      {/* App Branding & Telemetry Header */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 font-bold tracking-wider">
          <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-xs animate-pulse" />
          <span style={{ color: theme.accent }} className="font-extrabold text-xs sm:text-sm">
            DEFRAG_FS
          </span>
          <span className="opacity-60 text-[9px] sm:text-[10px] px-1 py-0.2 rounded border hidden xs:inline" style={{ borderColor: theme.cardBorder }}>
            v2.6
          </span>
        </div>

        {/* Format Disk (Prestige) Trigger */}
        <button
          id="btn-open-format-disk"
          onClick={onOpenFormat}
          title="Format Disk (Wipe & Earn Permanent Reset Points) [F]"
          className={`px-2 py-0.5 sm:py-1 rounded border font-mono font-bold text-[10px] sm:text-[11px] cursor-pointer transition-all flex items-center gap-1 shadow-xs ${
            pendingFormatPoints > 0
              ? 'bg-rose-950/70 border-rose-500 text-rose-300 hover:bg-rose-900 animate-pulse'
              : 'border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white'
          }`}
          style={{
            backgroundColor: pendingFormatPoints > 0 ? undefined : theme.cardBg,
          }}
        >
          <span className="text-rose-400 font-black">[F]</span>
          <span>FORMAT DISK</span>
          {pendingFormatPoints > 0 && (
            <span className="px-1 bg-rose-500 text-white rounded-xs text-[9px] font-black">
              +{pendingFormatPoints} PTS
            </span>
          )}
        </button>

        {/* Prestige Info Button (Click to view Prestige specs, Format disk, or Hard Reset) */}
        <button
          id="btn-prestige-info"
          type="button"
          onClick={onOpenFormat}
          title="Click to view Prestige info, Format Disk, or Hard Reset everything"
          className="flex items-center gap-1.5 px-2 py-0.5 sm:py-1 rounded border border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/60 hover:border-amber-400 text-amber-300 text-[10px] sm:text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
        >
          <span className="text-amber-400">★</span>
          <span>PRESTIGE:</span>
          <span>{formatPoints} PTS</span>
          <span className="text-emerald-400 hidden sm:inline">(+{(formatPoints * 1.5).toFixed(1)}%)</span>
        </button>
      </div>

      {/* Main Score / Points Display */}
      <div
        id="score-counter-panel"
        className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3.5 py-1 rounded border font-mono shadow-inner"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        }}
      >
        <div className="flex flex-col items-end">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-400 leading-none">
            Points / Fuel
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg md:text-xl font-black tracking-tight" style={{ color: theme.accent }}>
              {formatNum(points)}
            </span>
            <span className="text-[10px] text-zinc-400">PTS</span>
          </div>
        </div>
        <div className="h-5 sm:h-6 w-px bg-zinc-700 mx-0.5" />
        <div className="flex flex-col text-left">
          <span className="text-[9px] sm:text-[10px] uppercase text-zinc-400 leading-none">Rate</span>
          <span className="text-xs sm:text-[13px] font-bold text-emerald-400">
            +{formatNum(pointsPerSec)}
            <span className="text-[9px] font-normal text-zinc-400">/s</span>
          </span>
        </div>
      </div>

      {/* Terminal Tools & Quick Hotkeys */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
        {/* Auto Frag Toggle */}
        <button
          id="btn-toggle-auto-frag"
          onClick={onToggleAutoFrag}
          title="Toggle Background Auto-Fragmentation Daemon"
          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border transition-colors cursor-pointer flex items-center gap-1 text-[10px] sm:text-[11px] ${
            autoFragEnabled
              ? 'bg-amber-950/60 text-amber-300 border-amber-500'
              : 'text-zinc-500 border-zinc-800'
          }`}
          style={{ backgroundColor: autoFragEnabled ? undefined : theme.cardBg }}
        >
          <span className="font-bold">AUTO-FRAG:</span>
          <span>{autoFragEnabled ? 'ON' : 'OFF'}</span>
        </button>

        <button
          id="btn-inject-fragmentation"
          onClick={() => {
            sound.playBeep();
            onInjectFrag();
          }}
          title="Inject manual fragmented data pulse (HotKey: [R])"
          className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border transition-colors hover:brightness-125 cursor-pointer flex items-center gap-1 text-[10px] sm:text-[11px]"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <span className="text-amber-400 font-bold">[R]</span>
          <span>Frag</span>
        </button>

        <button
          id="btn-toggle-theme"
          onClick={onCycleTheme}
          title="Cycle Terminal Theme (HotKey: [T])"
          className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border transition-colors hover:brightness-125 cursor-pointer flex items-center gap-1 text-[10px] sm:text-[11px]"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <span style={{ color: theme.accent }} className="font-bold">[T]</span>
          <span className="hidden md:inline">{theme.name.split(' ')[0]}</span>
        </button>

        <button
          id="btn-toggle-audio"
          onClick={onToggleSound}
          title="Toggle PC Speaker Sound (HotKey: [M])"
          className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border transition-colors hover:brightness-125 cursor-pointer flex items-center gap-1 text-[10px] sm:text-[11px]"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <span className={soundEnabled ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            [M]
          </span>
          <span className="hidden sm:inline">{soundEnabled ? 'SND:ON' : 'SND:OFF'}</span>
        </button>

        <button
          id="btn-toggle-crt"
          onClick={onToggleCrt}
          title="Toggle CRT Scanline Effect (HotKey: [C])"
          className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border transition-colors hover:brightness-125 cursor-pointer flex items-center gap-1 text-[10px] sm:text-[11px] hidden xs:flex"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <span className={crtEffect ? 'text-cyan-400 font-bold' : 'text-zinc-500 font-bold'}>
            [C]
          </span>
          <span className="hidden xl:inline">{crtEffect ? 'CRT:ON' : 'CRT:OFF'}</span>
        </button>

        <button
          id="btn-open-help"
          onClick={onOpenHelp}
          title="Open Help / Manual (HotKey: [?])"
          className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border transition-colors hover:brightness-125 cursor-pointer flex items-center gap-1 text-[10px] sm:text-[11px]"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <span className="text-purple-400 font-bold">[?]</span>
          <span>MAN</span>
        </button>

        <div className="hidden 2xl:block font-mono text-[10px] text-zinc-400 ml-1 px-1 py-0.5 border rounded" style={{ borderColor: theme.cardBorder }}>
          {timeStr}
        </div>
      </div>
    </header>
  );
};
