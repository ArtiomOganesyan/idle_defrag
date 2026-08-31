import React from 'react';
import { ThemeConfig } from '../types';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="help-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono select-none"
      onClick={onClose}
    >
      <div
        id="help-modal-window"
        className="w-full max-w-2xl rounded border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
          color: theme.textPrimary,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title bar */}
        <div
          className="px-3 py-2 border-b flex items-center justify-between font-bold text-xs"
          style={{
            backgroundColor: theme.headerBg,
            borderColor: theme.cardBorder,
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: theme.accent }}>MANUAL(1)</span>
            <span className="text-zinc-400">defragfs - Terminal Disk Defragmenter & Clicker</span>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-0.5 rounded border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white"
          >
            [ESC / Q] CLOSE
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs leading-relaxed custom-scrollbar">
          <div>
            <h3 className="font-bold text-sm mb-1" style={{ color: theme.accent }}>
              NAME
            </h3>
            <p className="text-zinc-300 pl-4">
              <span className="font-bold">defragfs</span> - vintage cluster defragmentation emulator and high-speed resource optimization tool.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-1" style={{ color: theme.accent }}>
              SYNOPSIS & OBJECTIVE
            </h3>
            <p className="text-zinc-300 pl-4">
              Your drive sectors arrive fragmented across multiple data tiers (1 to 5 points each). Your goal is to accumulate points by using manual read cycles [SPACE] or automating the autonomous read/write heads to sort fragmented sectors into contiguous clusters.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-1" style={{ color: theme.accent }}>
              DATA SECTOR TIERS (1 - 5 POINTS)
            </h3>
            <div className="pl-4 space-y-1 text-zinc-300">
              <p>• <span className="font-bold text-slate-400">░ [1 PT]  TEMP/CACHE:</span> Volatile scratchpads & temporary stream logs.</p>
              <p>• <span className="font-bold text-emerald-400">▒ [2 PTS] USER DATA:</span> Personal documents, saved media packages.</p>
              <p>• <span className="font-bold text-cyan-400">▓ [3 PTS] APP EXEC:</span> Executable binaries & dynamic link libraries.</p>
              <p>• <span className="font-bold text-amber-400">█ [4 PTS] SYS REG:</span> Operating system registries & kernel hardware trees.</p>
              <p>• <span className="font-bold text-pink-400">█ [5 PTS] KERNEL:</span> High-density encrypted core payload & archives.</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-sm sm:text-base mb-1" style={{ color: theme.accent }}>
              CORE SYSTEM UPGRADES
            </h3>
            <div className="pl-4 space-y-1.5 text-zinc-300 text-xs sm:text-[13px]">
              <p>
                <span className="font-bold text-emerald-400">SPEED (Clock Rate):</span> Accelerates the autonomous read/write head sweep frequency (IOPS).
              </p>
              <p>
                <span className="font-bold text-cyan-400">LIST LENGTH (Capacity):</span> Expands total disk sectors (144 to 1024+ blocks), scaling maximum density and defrag chain bonuses.
              </p>
              <p>
                <span className="font-bold text-purple-400">PROCESS RESULT (Yield Multiplier):</span> Multiplies points earned per block processed (1x, 2x, 5x, 10x...).
              </p>
              <p>
                <span className="font-bold text-amber-400">DEFRAG HEADS:</span> Adds concurrent parallel read/write heads (Head #0, #1, #2).
              </p>
              <p>
                <span className="font-bold text-rose-400">BUFFER ALGORITHMS:</span> Enhances batch sorting and instant track consolidation bonuses.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-sm sm:text-base mb-1" style={{ color: theme.accent }}>
              KEYBOARD SHORTCUTS
            </h3>
            <div className="pl-4 grid grid-cols-2 gap-2 text-zinc-300 text-xs sm:text-[13px]">
              <div><span className="font-bold text-zinc-100">[SPACE]</span> : Single Read/Defrag Cycle</div>
              <div><span className="font-bold text-zinc-100">[A]</span> : Toggle Auto-Defrag</div>
              <div><span className="font-bold text-emerald-400">[1]</span> : Toggle Tuning Accordion</div>
              <div><span className="font-bold text-cyan-400">[2]</span> : Toggle IOPS Telemetry</div>
              <div><span className="font-bold text-amber-400">[3]</span> : Toggle Daemon & Glitch</div>
              <div><span className="font-bold text-purple-400">[4]</span> : Toggle Threads Accordion</div>
              <div><span className="font-bold text-pink-400">[5]</span> : Toggle Cluster Legend</div>
              <div><span className="font-bold text-indigo-400">[6]</span> : Toggle Event Log</div>
              <div><span className="font-bold text-rose-400">[F]</span> : Open Format / Prestige Modal</div>
              <div><span className="font-bold text-zinc-100">[R]</span> : Inject Fragmented Data</div>
              <div><span className="font-bold text-zinc-100">[T]</span> : Cycle Color Theme</div>
              <div><span className="font-bold text-zinc-100">[M]</span> : Mute / Unmute Sound</div>
              <div><span className="font-bold text-zinc-100">[C]</span> : Toggle CRT Scanlines</div>
              <div><span className="font-bold text-zinc-100">[?] / [H]</span> : Toggle This Manual</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-3 py-2 border-t flex justify-end"
          style={{
            backgroundColor: theme.headerBg,
            borderColor: theme.cardBorder,
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-1 rounded font-bold border transition-colors cursor-pointer text-xs"
            style={{
              backgroundColor: theme.accent,
              color: '#000000',
              borderColor: theme.accent,
            }}
          >
            RETURN TO TERMINAL [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
