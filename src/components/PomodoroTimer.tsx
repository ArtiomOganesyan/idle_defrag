import React from 'react';
import { PomodoroMode, ThemeConfig } from '../types';
import { sound } from '../utils/audio';

interface PomodoroTimerProps {
  theme: ThemeConfig;
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  sessionsCompleted: number;
  totalFocusSeconds: number;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSetMode: (mode: PomodoroMode) => void;
  onSetDuration: (durationSeconds: number) => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  theme,
  mode,
  timeLeft,
  isRunning,
  sessionsCompleted,
  totalFocusSeconds,
  workDuration,
  shortBreakDuration,
  longBreakDuration,
  onStart,
  onPause,
  onReset,
  onSkip,
  onSetMode,
  onSetDuration,
}) => {
  const currentTotalDuration =
    mode === 'work'
      ? workDuration
      : mode === 'shortBreak'
      ? shortBreakDuration
      : longBreakDuration;

  const progressPercent = Math.min(
    100,
    Math.max(0, ((currentTotalDuration - timeLeft) / (currentTotalDuration || 1)) * 100)
  );

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isDefragActive = isRunning && mode === 'work';

  // Generate ASCII progress bar
  const totalBars = 22;
  const filledBars = Math.round((progressPercent / 100) * totalBars);
  const progressBarAscii = '█'.repeat(filledBars) + '░'.repeat(Math.max(0, totalBars - filledBars));

  return (
    <div
      id="pomodoro-timer-module"
      className="h-full rounded border font-mono text-xs sm:text-[13px] flex flex-col shadow-md overflow-hidden"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: isDefragActive ? theme.accent : theme.cardBorder,
        color: theme.textPrimary,
      }}
    >
      {/* Header Bar */}
      <div
        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between text-left font-bold text-xs sm:text-[13px] border-b select-none shrink-0"
        style={{
          borderColor: theme.cardBorder,
          backgroundColor: isDefragActive ? 'rgba(16, 185, 129, 0.12)' : theme.headerBg,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              isDefragActive
                ? 'bg-emerald-400 animate-ping'
                : isRunning
                ? 'bg-cyan-400 animate-pulse'
                : 'bg-amber-400'
            }`}
          />
          <span className="text-zinc-100 font-bold tracking-tight flex items-center gap-1">
            <span className="text-emerald-400 mr-1">[P]</span>
            <span>POMODORO_FOCUS_PROTOCOL</span>
          </span>
          <span
            className={`px-1.5 py-0.2 rounded text-[9.5px] font-extrabold border uppercase ${
              isDefragActive
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : isRunning
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400'
            }`}
          >
            {isDefragActive ? 'DEFRAG ENGAGED' : isRunning ? 'BREAK PARKED' : 'DEFRAG STANDBY'}
          </span>
        </div>

        {/* Right Header Metrics */}
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-mono">
          <div className="hidden sm:flex items-center gap-1 text-zinc-300">
            <span>STREAK:</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4].map((step) => {
                const completedInCycle = sessionsCompleted % 4;
                const isFilled = step <= completedInCycle;
                return (
                  <span
                    key={step}
                    className={`px-1 py-0.2 rounded-xs text-[9px] border ${
                      isFilled
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-black/50 border-zinc-800 text-zinc-600'
                    }`}
                  >
                    #{step}
                  </span>
                );
              })}
            </div>
          </div>
          <span className="text-zinc-500 hidden sm:inline">|</span>
          <span className="text-amber-400 font-bold">
            CYCLES: {sessionsCompleted}
          </span>
          <span className="text-zinc-400 hidden xs:inline">
            ({Math.floor(totalFocusSeconds / 60)}m focus)
          </span>
        </div>
      </div>

      {/* Bento Body Grid (2 Columns on Medium/Desktop) */}
      <div className="flex-1 p-2 sm:p-2.5 grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-2.5 overflow-y-auto custom-scrollbar bg-black/25">
        {/* Left Bento: Clock, Mode Tabs, and Presets */}
        <div className="md:col-span-6 flex flex-col justify-between gap-1.5">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                sound.playBeep();
                onSetMode('work');
              }}
              className={`py-1 px-1.5 rounded border text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all ${
                mode === 'work'
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-xs'
                  : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ★ FOCUS ({Math.round(workDuration / 60)}m)
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playBeep();
                onSetMode('shortBreak');
              }}
              className={`py-1 px-1.5 rounded border text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all ${
                mode === 'shortBreak'
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-xs'
                  : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              c[_] BREAK ({Math.round(shortBreakDuration / 60)}m)
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playBeep();
                onSetMode('longBreak');
              }}
              className={`py-1 px-1.5 rounded border text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all ${
                mode === 'longBreak'
                  ? 'bg-purple-950/80 border-purple-400 text-purple-300 shadow-xs'
                  : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              zZz LONG ({Math.round(longBreakDuration / 60)}m)
            </button>
          </div>

          {/* Big Retro Digital Readout */}
          <div
            className="flex-1 min-h-[75px] sm:min-h-[85px] p-2 rounded border border-zinc-800 bg-zinc-950/80 flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              boxShadow: isDefragActive ? 'inset 0 0 20px rgba(16,185,129,0.12)' : undefined,
            }}
          >
            <div className="w-full flex items-center justify-between text-[9.5px] sm:text-[10px] text-zinc-400">
              <span className="uppercase tracking-wide">PHASE: {mode}</span>
              <span className={isRunning ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                {isRunning ? '● RUNNING' : '○ PAUSED'}
              </span>
            </div>

            <div
              className={`text-3xl sm:text-4xl lg:text-[42px] font-black tracking-widest font-mono select-none transition-colors my-0.5 leading-none ${
                mode === 'work'
                  ? isRunning
                    ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.35)]'
                    : 'text-zinc-200'
                  : mode === 'shortBreak'
                  ? 'text-cyan-400'
                  : 'text-purple-400'
              }`}
            >
              {formatTime(timeLeft)}
            </div>

            <div className="w-full flex items-center justify-between text-[9.5px] sm:text-[10px] text-zinc-400">
              <span className="font-mono text-emerald-400 tracking-tighter truncate max-w-[200px] sm:max-w-none">
                [{progressBarAscii}]
              </span>
              <span className="font-bold text-zinc-200 ml-1">{progressPercent.toFixed(0)}%</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center justify-between gap-1 text-[9.5px] sm:text-[10px] shrink-0">
            <span className="text-zinc-400 font-bold shrink-0">PRESET:</span>
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { label: '1m test', secs: 60 },
                { label: '5m', secs: 300 },
                { label: '15m', secs: 900 },
                { label: '25m', secs: 1500 },
                { label: '50m', secs: 3000 },
              ].map((preset) => (
                <button
                  key={preset.secs}
                  type="button"
                  onClick={() => {
                    sound.playBeep();
                    onSetDuration(preset.secs);
                  }}
                  className={`px-1.5 py-0.5 rounded border cursor-pointer font-bold transition-colors ${
                    currentTotalDuration === preset.secs
                      ? 'bg-zinc-700 text-white border-zinc-500'
                      : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Bento: Status Banner, Actions, and Rules */}
        <div className="md:col-span-6 flex flex-col justify-between gap-1.5">
          {/* Status Alert Banner */}
          <div
            className={`p-2 rounded border flex flex-col gap-1 transition-colors duration-200 ${
              isDefragActive
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                : isRunning
                ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-[10.5px] sm:text-[11.5px]">
              <span className="flex items-center gap-1.5">
                <span className={isDefragActive ? 'animate-bounce font-mono' : 'font-mono'}>
                  {isDefragActive ? '⚡' : isRunning ? (mode === 'shortBreak' ? 'c[_]' : 'zZz') : '⏸'}
                </span>
                <span>
                  {isDefragActive
                    ? 'HEADS ENGAGED: DEFRAG OPERATIONAL'
                    : isRunning
                    ? 'BREAK PROTOCOL: DRIVE HEADS PARKED'
                    : 'STANDBY: START FOCUS TO DEFRAG'}
                </span>
              </span>
              <span className="text-[9px] font-extrabold px-1 py-0.2 rounded border bg-black/40 border-current">
                {isDefragActive ? 'HARVESTING PTS' : 'PARKED'}
              </span>
            </div>

            <p className="text-[10px] sm:text-[10.5px] leading-relaxed text-zinc-300">
              {isDefragActive
                ? 'Drive heads and manual [SPACE] cycles are actively sorting sectors and harvesting points.'
                : isRunning
                ? 'Break mode. Drive heads parked in standby. Write daemons and glitches continue running in background.'
                : 'Heads are parked. Start the Pomodoro focus timer or press [P] to engage active defragmentation!'}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => {
                if (isRunning) {
                  sound.playBeep();
                  onPause();
                } else {
                  sound.playPomodoroStart();
                  onStart();
                }
              }}
              className={`py-2 px-2.5 rounded font-bold border font-mono text-xs sm:text-[13px] cursor-pointer transition-all flex items-center justify-center gap-1.5 col-span-2 shadow-sm ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-black border-amber-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 active:scale-98'
              }`}
            >
              <span>{isRunning ? '⏸ PAUSE TIMER [P]' : '▶ START FOCUS [P]'}</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  sound.playBeep();
                  onReset();
                }}
                title="Reset timer to phase duration"
                className="flex-1 py-2 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[10.5px] font-bold cursor-pointer transition-colors"
              >
                ↺ RESET
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playSwap();
                  onSkip();
                }}
                title="Skip to next phase"
                className="px-2 py-2 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[10.5px] font-bold cursor-pointer transition-colors"
              >
                ⏭
              </button>
            </div>
          </div>

          {/* Focus Protocol Summary Rule */}
          <div className="p-1.5 rounded border border-zinc-800/80 bg-black/40 text-[9.5px] sm:text-[10px] text-zinc-400 flex items-center justify-between">
            <span>RULE: Defrag runs ONLY during Focus.</span>
            <span className="text-zinc-500">I/O writes & glitches run 24/7</span>
          </div>
        </div>
      </div>
    </div>
  );
};
