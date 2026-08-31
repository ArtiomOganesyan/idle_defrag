import React from 'react';
import { UpgradeDef } from '../types';
import { sound } from '../utils/audio';

interface TuningInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  upgrades: Record<string, UpgradeDef>;
}

export const TuningInfoModal: React.FC<TuningInfoModalProps> = ({
  isOpen,
  onClose,
  upgrades,
}) => {
  if (!isOpen) return null;

  const cardDetails = [
    {
      id: 'speed',
      tag: 'SPEED',
      name: 'I/O Clock Rate',
      maxLevelText: 'Max LVL 25 (up to 40+ IOPS)',
      color: '#34d399',
      border: 'rgba(52, 211, 153, 0.3)',
      bg: 'rgba(6, 78, 59, 0.2)',
      description:
        'Accelerates defragmentation head clock frequency, rotational sweep rate, and cylinder seek latency. Higher clock rates allow heads to cycle through disk blocks significantly faster, resulting in higher continuous IOPS.',
      formula: 'Sweep Rate = 1.0 + (Level - 1) × 1.6 IOPS (amplified by Prestige yield multiplier).',
    },
    {
      id: 'capacity',
      tag: 'CAPACITY',
      name: 'Sector Map Capacity',
      maxLevelText: 'Max LVL 50 (up to 1,148 Sectors)',
      color: '#38bdf8',
      border: 'rgba(56, 189, 248, 0.3)',
      bg: 'rgba(12, 74, 110, 0.2)',
      description:
        'Expands total cluster map capacity on the storage partition. A larger sector map accommodates more simultaneous data blocks, increasing overall block density and parallel defrag potential.',
      formula: 'Total Capacity = 168 + (Level - 1) × 20 Sectors.',
    },
    {
      id: 'yield',
      tag: 'YIELD',
      name: 'Process Result / Bit Yield',
      maxLevelText: 'Max LVL 10 (1.0x to 5.0x Multiplier)',
      color: '#fbbf24',
      border: 'rgba(251, 191, 36, 0.3)',
      bg: 'rgba(120, 53, 15, 0.2)',
      description:
        'Amplifies raw point yield multiplier obtained from sorting fragmented data clusters into contiguous sequence. Reaching Max LVL 10 delivers a 5.0x baseline point multiplier on every resolved cluster.',
      formula: 'Bit Multiplier = 1.0x + (Level - 1) × 0.444x (reaches 5.0x at LVL 10).',
    },
    {
      id: 'heads',
      tag: 'THREADS',
      name: 'Concurrent Heads',
      maxLevelText: 'Max LVL 4 (up to 4 Parallel Threads)',
      color: '#c084fc',
      border: 'rgba(192, 132, 252, 0.3)',
      bg: 'rgba(88, 28, 135, 0.2)',
      description:
        'Spawns secondary asynchronous defragmentation read/write heads (Head_1, Head_2, Head_3). Heads sweep across disparate sectors in parallel, drastically multiplying throughput and resolving fragmented areas simultaneously.',
      formula: 'Simultaneous Defrag Threads = Level (1 to 4 independent reader heads).',
    },
    {
      id: 'algorithms',
      tag: 'OPTIMIZER',
      name: 'Buffer QuickSort',
      maxLevelText: 'Max LVL 10 (Lvl 1 - 10 Buffer)',
      color: '#2dd4bf',
      border: 'rgba(45, 212, 191, 0.3)',
      bg: 'rgba(19, 78, 74, 0.2)',
      description:
        'Employs an in-memory staging buffer and partition consolidation algorithm. Allows defrag heads to evaluate larger cluster batches at once, granting massive track boundary completion bonuses when sorting tiers.',
      formula: 'Batch Buffer Efficiency = Level 1 to 10 in-memory lookup depth.',
    },
    {
      id: 'autoFrag',
      tag: 'WRITE I/O',
      name: 'Write Activity / Auto-Frag',
      maxLevelText: 'Max LVL 50 (1 to 50 Blks/sec)',
      color: '#f87171',
      border: 'rgba(248, 113, 113, 0.3)',
      bg: 'rgba(127, 29, 29, 0.2)',
      description:
        'Simulates high-throughput background file writes and incoming data stream I/O, constantly creating new fragmented sectors on disk (1 to 50 blocks/sec). Crucial for keeping defrag heads continually fed with high-yield fragmented blocks.',
      formula: 'Write Rate = +1 to +50 fragmented blocks injected every second.',
    },
  ];

  return (
    <div
      id="tuning-info-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div
        id="tuning-info-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded border border-cyan-500/50 bg-[#0c0e14] text-[#dcdfe7] font-mono shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-xs font-black bg-cyan-500 text-black">
              ?
            </span>
            <span className="font-bold text-xs sm:text-sm text-cyan-300 tracking-wide">
              SYSTEM_TUNING // SPECIFICATION_MANUAL
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playBeep();
              onClose();
            }}
            className="px-2 py-0.5 rounded text-xs border border-zinc-700 hover:border-rose-400 hover:text-rose-300 text-zinc-400 transition-colors cursor-pointer"
          >
            [ESC / ✕]
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
          <div className="p-2.5 rounded border border-zinc-800 bg-black/40 text-[11px] sm:text-xs text-zinc-300 leading-relaxed">
            <span className="text-emerald-400 font-bold">SYSTEM ARCHITECTURE NOTE:</span> All 6 System Tuning upgrades scale in real-time, operating across memory buffers, write queues, and physical head seek routines. Upgrades feature exponential cost curves (tuned at 2x cost) for strategic progression.
          </div>

          {/* Cards Breakdown */}
          <div className="flex flex-col gap-2.5">
            {cardDetails.map((card, idx) => {
              const currentUpg = upgrades[card.id];
              return (
                <div
                  key={card.id}
                  id={`tuning-info-card-${card.id}`}
                  className="p-2.5 sm:p-3 rounded border flex flex-col gap-1.5 transition-all"
                  style={{
                    backgroundColor: card.bg,
                    borderColor: card.border,
                  }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs font-mono"
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: card.color,
                          border: `1px solid ${card.border}`,
                        }}
                      >
                        [{card.tag}] #{idx + 1}
                      </span>
                      <span className="text-xs sm:text-[13px] font-bold text-white">
                        {card.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono">
                      <span className="text-zinc-400">{card.maxLevelText}</span>
                      {currentUpg && (
                        <span className="px-1.5 py-0.2 rounded bg-black/60 border border-zinc-700 text-emerald-400 font-bold">
                          LVL {currentUpg.level}/{currentUpg.maxLevel}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed mt-0.5">
                    {card.description}
                  </p>

                  <div className="mt-1 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-zinc-400">
                    <span className="text-zinc-400">
                      <strong className="text-zinc-200">Formula:</strong> {card.formula}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-3 sm:px-4 py-2 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <span>Press [1] to open System Tuning tab in the sidebar.</span>
          <button
            type="button"
            onClick={() => {
              sound.playBeep();
              onClose();
            }}
            className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer transition-colors shadow-xs"
          >
            ACKNOWLEDGE [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
