import React, { useEffect, useRef } from 'react';
import { LogEntry, ThemeConfig } from '../types';
import { BLOCK_TIERS } from '../utils/themes';

interface ClusterLegendAndLogsProps {
  theme: ThemeConfig;
  multiplier: number;
  logs: LogEntry[];
  onClearLogs: () => void;
  openSections: {
    legend: boolean;
    logs: boolean;
  };
  onToggleSection: (section: 'legend' | 'logs') => void;
}

export const ClusterLegendAndLogs: React.FC<ClusterLegendAndLogsProps> = ({
  theme,
  multiplier,
  logs,
  onClearLogs,
  openSections,
  onToggleSection,
}) => {
  const logScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logScrollRef.current && openSections.logs) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logs, openSections.logs]);

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
      id="cluster-legend-and-logs-accordion"
      className="flex flex-col md:grid md:grid-cols-2 gap-2 sm:gap-2.5 font-mono text-xs sm:text-[13px]"
    >
      {/* ========================================================================= */}
      {/* SECTION 1: CLUSTER_LEGEND ACCORDION TAB (HOTKEY: [5]) */}
      {/* ========================================================================= */}
      <div
        id="accordion-section-cluster-legend"
        className="rounded border overflow-hidden flex flex-col shadow-md transition-all duration-150"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: openSections.legend ? theme.accent : theme.cardBorder,
          color: theme.textPrimary,
        }}
      >
        {/* Accordion Header */}
        <button
          type="button"
          onClick={() => onToggleSection('legend')}
          className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between text-left font-bold text-xs sm:text-[13px] cursor-pointer hover:brightness-110 transition-colors border-b select-none shrink-0"
          style={{
            borderColor: openSections.legend ? theme.cardBorder : 'transparent',
            backgroundColor: openSections.legend ? theme.headerBg : 'rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-black">
              {openSections.legend ? '▼' : '▶'}
            </span>
            <span className="text-zinc-100 font-bold tracking-tight">
              <span className="text-emerald-400 mr-1">[5]</span>CLUSTER_LEGEND
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded bg-black/40 text-cyan-300 border border-zinc-700 font-mono">
              5 TIERS + BAD SECTORS
            </span>
          </div>
        </button>

        {/* Accordion Content */}
        {openSections.legend && (
          <div className="flex-1 p-2 sm:p-2.5 flex flex-col gap-1.5 min-h-[140px] max-h-[220px] overflow-y-auto custom-scrollbar bg-black/20">
            <div className="text-[10px] sm:text-[11px] uppercase text-zinc-400 font-bold flex justify-between shrink-0 px-0.5">
              <span>Target Ordered Sectors</span>
              <span className="text-zinc-500">Track Alignment</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {Object.values(BLOCK_TIERS)
                .sort((a, b) => b.tier - a.tier) // Ordered 5 -> 4 -> 3 -> 2 -> 1
                .map((item) => {
                  const calculatedPoints = Math.round(item.basePoints * multiplier * 10) / 10;
                  return (
                    <div
                      key={item.tier}
                      className="px-2 py-1 rounded border flex items-center justify-between text-[11px] sm:text-xs"
                      style={{
                        backgroundColor: theme.headerBg,
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
                          <span className="text-zinc-100 font-bold truncate">{item.name}</span>
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
                className="px-2 py-1 rounded border flex items-center justify-between text-[11px] sm:text-xs"
                style={{
                  backgroundColor: theme.headerBg,
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-rose-500 animate-pulse">
                    ✖
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-rose-400 font-bold">BAD_SECTOR (CORRUPT)</span>
                    <span className="text-[9.5px] text-zinc-400">Repaired by Autonomous Heads</span>
                  </div>
                </div>
                <span className="text-rose-400 font-bold text-[10.5px] sm:text-[11.5px]">
                  +50% BONUS PTS
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: EVENT_LOG ACCORDION TAB (HOTKEY: [6]) */}
      {/* ========================================================================= */}
      <div
        id="accordion-section-event-log"
        className="rounded border overflow-hidden flex flex-col shadow-md transition-all duration-150"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: openSections.logs ? theme.accent : theme.cardBorder,
          color: theme.textPrimary,
        }}
      >
        {/* Accordion Header */}
        <button
          type="button"
          onClick={() => onToggleSection('logs')}
          className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between text-left font-bold text-xs sm:text-[13px] cursor-pointer hover:brightness-110 transition-colors border-b select-none shrink-0"
          style={{
            borderColor: openSections.logs ? theme.cardBorder : 'transparent',
            backgroundColor: openSections.logs ? theme.headerBg : 'rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-black">
              {openSections.logs ? '▼' : '▶'}
            </span>
            <span className="text-zinc-100 font-bold tracking-tight">
              <span className="text-emerald-400 mr-1">[6]</span>EVENT_LOG
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded bg-black/40 text-emerald-400 border border-zinc-700 font-mono">
              {logs.length} EVENTS
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onClearLogs();
              }}
              className="text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.2 rounded border border-zinc-700 hover:border-zinc-500 bg-zinc-900 transition-colors cursor-pointer"
            >
              CLEAR
            </span>
          </div>
        </button>

        {/* Accordion Content (Log stream) */}
        {openSections.logs && (
          <div
            ref={logScrollRef}
            className="flex-1 p-2 sm:p-2.5 overflow-y-auto font-mono text-[11px] sm:text-xs space-y-1.5 custom-scrollbar min-h-[140px] max-h-[220px] bg-black/20"
          >
            {logs.length === 0 ? (
              <div className="text-center text-zinc-500 italic py-4">
                No events recorded. Waiting for disk operations...
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-zinc-500 text-[10px] sm:text-[11px] shrink-0 font-mono">
                    {log.timestamp}
                  </span>
                  <span
                    className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-xs border shrink-0 ${getBadgeColor(
                      log.level
                    )}`}
                  >
                    {log.tag}
                  </span>
                  <span className="text-zinc-200 break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
