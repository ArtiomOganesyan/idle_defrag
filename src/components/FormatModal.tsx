import React, { useState } from 'react';
import { ThemeConfig } from '../types';
import { sound } from '../utils/audio';

interface FormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmFormat: () => void;
  onHardReset?: () => void;
  theme: ThemeConfig;
  currentPoints?: number;
  totalPointsEarned?: number;
  totalBlocksDefragged?: number;
  formatCount?: number;
  currentFormatPoints?: number;
  pendingFormatPoints?: number;
}

export const FormatModal: React.FC<FormatModalProps> = ({
  isOpen,
  onClose,
  onConfirmFormat,
  onHardReset,
  theme,
  currentPoints = 0,
  totalPointsEarned = 0,
  totalBlocksDefragged = 0,
  formatCount = 0,
  currentFormatPoints = 0,
  pendingFormatPoints = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'prestige' | 'hardReset'>('prestige');
  const [hardResetConfirmStage, setHardResetConfirmStage] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentBoostPercent = ((currentFormatPoints ?? 0) * 1.5).toFixed(1);
  const newTotalFormatPoints = (currentFormatPoints ?? 0) + (pendingFormatPoints ?? 0);
  const newBoostPercent = (newTotalFormatPoints * 1.5).toFixed(1);

  const handleClose = () => {
    setHardResetConfirmStage(false);
    onClose();
  };

  return (
    <div
      id="format-disk-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs font-mono"
      onClick={handleClose}
    >
      <div
        id="format-disk-modal-card"
        className="w-full max-w-xl rounded border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: activeTab === 'hardReset' ? '#ef4444' : theme.accent,
          color: theme.textPrimary,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-3 sm:px-4 py-2 sm:py-2.5 border-b flex items-center justify-between shrink-0"
          style={{ backgroundColor: theme.headerBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
            <span className={activeTab === 'hardReset' ? 'text-rose-500 font-black animate-pulse' : 'text-amber-400 font-black'}>
              {activeTab === 'hardReset' ? '☣' : '★'}
            </span>
            <span style={{ color: activeTab === 'hardReset' ? '#f87171' : theme.accent }}>
              {activeTab === 'hardReset' ? 'FACTORY_RESET // TOTAL_DATA_PURGE' : 'PRESTIGE_SYSTEM // DISK_FORMAT_UTILITY'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-xs px-2 py-0.5 rounded border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white cursor-pointer"
          >
            ESC / ✕
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="px-3 sm:px-4 pt-2 pb-0 flex items-center gap-2 border-b border-zinc-800 bg-black/30 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('prestige');
              setHardResetConfirmStage(false);
              sound.playBeep();
            }}
            className={`px-3 py-1.5 rounded-t text-xs font-bold font-mono transition-colors cursor-pointer border-t border-x ${
              activeTab === 'prestige'
                ? 'bg-zinc-900 border-amber-500/60 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ★ PRESTIGE & FORMAT
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('hardReset');
              sound.playBeep();
            }}
            className={`px-3 py-1.5 rounded-t text-xs font-bold font-mono transition-colors cursor-pointer border-t border-x ${
              activeTab === 'hardReset'
                ? 'bg-zinc-900 border-rose-500/60 text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-rose-300'
            }`}
          >
            ☣ HARD RESET ALL
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-3 sm:p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 text-xs">
          {activeTab === 'prestige' ? (
            <>
              {/* Prestige Info & Warning Banner */}
              <div className="p-3 rounded border border-amber-500/40 bg-amber-950/25 text-amber-200 flex flex-col gap-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-400">
                  <span>[★] PRESTIGE MECHANICS & FORMAT REWARDS</span>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-300">
                  Formatting zeroes out current points and system tuning levels, but awards permanent{' '}
                  <strong className="text-amber-300">PRESTIGE FORMAT POINTS</strong>. Each point permanently grants a{' '}
                  <strong className="text-emerald-400">+1.5% multiplier</strong> to all future defragmentation points and increases autonomous head seek speed.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div
                  className="p-2.5 rounded border flex flex-col gap-1.5"
                  style={{ backgroundColor: theme.headerBg, borderColor: theme.cardBorder }}
                >
                  <span className="text-zinc-400 text-[10px] font-bold">CURRENT SESSION METRICS</span>
                  <div className="flex justify-between">
                    <span>Available Fuel:</span>
                    <span className="font-bold text-cyan-300">{Math.floor(currentPoints ?? 0).toLocaleString()} PTS</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lifetime Earned:</span>
                    <span className="font-bold text-zinc-200">{Math.floor(totalPointsEarned ?? 0).toLocaleString()} PTS</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clusters Defragged:</span>
                    <span className="font-bold text-emerald-400">{(totalBlocksDefragged ?? 0).toLocaleString()}</span>
                  </div>
                </div>

                <div
                  className="p-2.5 rounded border flex flex-col gap-1.5"
                  style={{ backgroundColor: theme.headerBg, borderColor: 'rgba(245, 158, 11, 0.4)' }}
                >
                  <span className="text-amber-400 text-[10px] font-bold">PERMANENT PRESTIGE STATUS</span>
                  <div className="flex justify-between">
                    <span>Format Runs Executed:</span>
                    <span className="font-bold text-zinc-200">#{formatCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Prestige Pts:</span>
                    <span className="font-bold text-amber-400">{currentFormatPoints} (+{currentBoostPercent}%)</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Gain on Next Format:</span>
                    <span>+{pendingFormatPoints} PTS</span>
                  </div>
                </div>
              </div>

              {/* Multiplier Calculation Banner */}
              <div
                className="p-3 rounded border flex items-center justify-between"
                style={{ backgroundColor: theme.headerBg, borderColor: theme.cardBorder }}
              >
                <div>
                  <div className="text-[10px] text-zinc-400">NEXT TOTAL PERMANENT PRESTIGE BOOST:</div>
                  <div className="text-sm font-bold text-emerald-400">
                    +{newBoostPercent}% Point Yield ({newTotalFormatPoints} Total Prestige Pts)
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black text-xs">
                    +{pendingFormatPoints} PTS ON FORMAT
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: theme.cardBorder }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('hardReset')}
                  className="text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                >
                  Need a complete factory wipe instead?
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-3 py-1.5 rounded border border-zinc-700 hover:border-zinc-500 text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onConfirmFormat();
                      handleClose();
                    }}
                    disabled={pendingFormatPoints <= 0 && totalPointsEarned < 50}
                    className={`px-4 py-1.5 rounded border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      pendingFormatPoints > 0 || totalPointsEarned >= 50
                        ? 'bg-amber-600 hover:bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-950/50'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                    }`}
                  >
                    <span>[F] EXECUTE FORMAT & CLAIM +{pendingFormatPoints} PTS</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* HARD RESET ALL TAB */
            <div className="flex flex-col gap-3">
              {/* Threat Warning Box */}
              <div className="p-3 sm:p-4 rounded border border-rose-500 bg-rose-950/40 text-rose-200 flex flex-col gap-2">
                <div className="font-extrabold flex items-center gap-2 text-rose-400 text-sm">
                  <span>☣ PERMANENT FACTORY HARD RESET (WIPE EVERYTHING)</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-zinc-200">
                  This operation will <strong>permanently purge all data</strong> from the filesystem and browser storage:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[11px]">
                  <li>All accumulated Points / Fuel reset to <strong className="text-white">0 PTS</strong></li>
                  <li>All 6 System Tuning upgrades reset back to <strong className="text-white">Level 1</strong></li>
                  <li>Sector Map Capacity reset to baseline <strong className="text-white">168 Sectors</strong></li>
                  <li>All <strong className="text-amber-400">Prestige Format Points ({currentFormatPoints} PTS)</strong> and Format counts reset to <strong className="text-rose-400">0</strong></li>
                  <li>Defrag heads reset to single Kernel Head</li>
                  <li>Browser local storage keys cleared</li>
                </ul>
              </div>

              {!hardResetConfirmStage ? (
                <div className="p-3 rounded border border-zinc-800 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-[11px] text-zinc-400">
                    Are you sure you want to initialize a complete zero-state reset?
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playGlitch();
                      setHardResetConfirmStage(true);
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-500 text-rose-200 font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <span>☣ INITIALIZE FACTORY HARD RESET</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 sm:p-4 rounded border-2 border-rose-500 bg-rose-900/30 flex flex-col gap-3 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                    CONFIRMATION REQUIRED: THIS ACTION CANNOT BE UNDONE!
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-rose-500/40">
                    <button
                      type="button"
                      onClick={() => setHardResetConfirmStage(false)}
                      className="px-3 py-1.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white cursor-pointer text-xs"
                    >
                      ABORT (Keep My Data)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onHardReset) {
                          onHardReset();
                        }
                        handleClose();
                      }}
                      className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs cursor-pointer border border-rose-300 shadow-lg shadow-rose-950/80 transition-transform active:scale-95"
                    >
                      CONFIRM HARD RESET (WIPE EVERYTHING)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

