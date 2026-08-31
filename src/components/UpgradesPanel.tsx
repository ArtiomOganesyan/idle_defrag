import React from 'react';
import { ThemeConfig, UpgradeDef } from '../types';
import { sound } from '../utils/audio';

interface UpgradesPanelProps {
  upgrades: Record<string, UpgradeDef>;
  points: number;
  theme: ThemeConfig;
  onPurchaseUpgrade: (id: string) => void;
}

export const UpgradesPanel: React.FC<UpgradesPanelProps> = ({
  upgrades,
  points,
  theme,
  onPurchaseUpgrade,
}) => {
  const calculateCost = (upg: UpgradeDef) => {
    return Math.floor(upg.baseCost * Math.pow(upg.costMultiplier, upg.level));
  };

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 10_000) return (n / 1_000).toFixed(1) + 'k';
    return n.toLocaleString();
  };

  const getProgressBar = (level: number, maxLevel: number, length: number = 10) => {
    const filled = Math.min(length, Math.floor((level / maxLevel) * length));
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  return (
    <div
      id="system-tuning-upgrades-panel"
      className="flex flex-col gap-2 p-3 rounded border font-mono text-xs shadow-md"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.cardBorder,
        color: theme.textPrimary,
      }}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b pb-1 font-bold text-[11px] sm:text-xs" style={{ borderColor: theme.cardBorder }}>
        <div className="flex items-center gap-1">
          <span className="text-zinc-500">┌─</span>
          <span style={{ color: theme.accent }}>SYSTEM_TUNING</span>
        </div>
        <span className="text-[9px] sm:text-[10px] text-zinc-400">HOTKEYS: [1]-[5]</span>
      </div>

      {/* Upgrades List */}
      <div className="flex flex-col gap-1.5">
        {(Object.values(upgrades) as UpgradeDef[]).map((upg) => {
          const cost = calculateCost(upg);
          const canAfford = points >= cost && upg.level < upg.maxLevel;
          const isMaxed = upg.level >= upg.maxLevel;

          return (
            <div
              key={upg.id}
              id={`upgrade-item-${upg.id}`}
              className={`p-1.5 sm:p-2 rounded border transition-all ${
                canAfford
                  ? 'hover:border-emerald-400 cursor-pointer shadow-xs'
                  : isMaxed
                  ? 'opacity-60 border-zinc-700'
                  : 'opacity-85 border-zinc-800'
              }`}
              style={{
                backgroundColor: theme.headerBg,
                borderColor: canAfford ? theme.accent : undefined,
              }}
              onClick={() => {
                if (canAfford) {
                  sound.playUpgrade();
                  onPurchaseUpgrade(upg.id);
                } else if (!isMaxed) {
                  sound.playBeep();
                }
              }}
            >
              <div className="flex items-center justify-between gap-1.5 mb-0.5">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="font-black px-1 py-0.2 rounded text-[9px] sm:text-[10px]"
                    style={{
                      backgroundColor: theme.accent,
                      color: '#000000',
                    }}
                  >
                    [{upg.shortcut}]
                  </span>
                  <span className="font-bold tracking-tight text-zinc-100 text-[11px] sm:text-xs truncate">
                    {upg.name}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-zinc-400 px-1 py-0.2 rounded bg-black/30 border border-zinc-700 hidden sm:inline">
                    {upg.tag}
                  </span>
                </div>

                {/* Level / Max Status */}
                <div className="text-[10px] sm:text-[11px] font-bold shrink-0">
                  {isMaxed ? (
                    <span className="text-amber-400">MAX</span>
                  ) : (
                    <span className={canAfford ? 'text-emerald-400' : 'text-zinc-400'}>
                      {formatNum(cost)} <span className="text-[8px] sm:text-[9px]">PTS</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Description & Value Status */}
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-400 my-0.5">
                <span className="truncate mr-1 text-[9px] sm:text-[10px]">{upg.description}</span>
                <span className="text-cyan-300 font-bold whitespace-nowrap shrink-0 text-[10px] sm:text-[11px]">
                  {upg.unit}
                </span>
              </div>

              {/* Progress bar and Level */}
              <div className="flex items-center justify-between gap-1 text-[9px] sm:text-[10px] text-zinc-400 pt-0.5 border-t border-zinc-800/80">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-emerald-400 text-[9px]">
                    [{getProgressBar(upg.level, upg.maxLevel, 8)}]
                  </span>
                  <span>
                    LVL {upg.level}/{upg.maxLevel}
                  </span>
                </div>

                <button
                  id={`btn-upgrade-${upg.id}`}
                  disabled={!canAfford}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canAfford) {
                      sound.playUpgrade();
                      onPurchaseUpgrade(upg.id);
                    }
                  }}
                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold border transition-colors ${
                    isMaxed
                      ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                      : canAfford
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 cursor-pointer shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-500 border-zinc-700 cursor-not-allowed'
                  }`}
                >
                  {isMaxed ? 'MAX' : canAfford ? `BUY [${upg.shortcut}]` : 'LOCKED'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
