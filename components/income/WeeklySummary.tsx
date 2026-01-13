'use client';

interface WeeklySummaryProps {
  weeklyMin: number;
  weeklyAvg: number;
  weeklyMax: number;
  compact?: boolean;
}

export default function WeeklySummary({ weeklyMin, weeklyAvg, weeklyMax, compact = false }: WeeklySummaryProps) {
  if (compact) {
    return (
      <div className="inner-glass p-3 text-center rounded border border-celestial-purple/30">
        <div className="text-[10px] text-celestial-purple tracking-[0.15em] mb-0.5 font-medium uppercase">
          EST. WEEKLY
        </div>
        <div className="text-[8px] text-white/60 mb-1">(현재 수량 x 최근 6회 DPS)</div>
        <div className="text-lg font-display font-medium text-white">
          ${weeklyAvg.toFixed(2)}
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] font-medium">
          <span className="text-white/70">MIN: <span className="text-v64-danger">${weeklyMin.toFixed(2)}</span></span>
          <span className="text-white/70">MAX: <span className="text-v64-success">${weeklyMax.toFixed(2)}</span></span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="inner-glass p-5 text-center rounded border border-celestial-purple/30 flex flex-col justify-center"
      style={{ minHeight: '280px' }}
    >
      <div className="text-[11px] text-celestial-purple tracking-[0.2em] mb-2.5 font-semibold uppercase">
        EST. WEEKLY
      </div>
      <div className="text-[9px] text-white/60 mb-4">(현재 수량 x 최근 6회 DPS)</div>
      <div className="text-4xl font-display font-semibold text-white mb-5">
        ${weeklyAvg.toFixed(2)}
      </div>
      <div className="flex flex-col gap-2 text-[11px] font-medium">
        <div className="flex justify-between px-3">
          <span className="text-white/70">MIN:</span>
          <span className="text-v64-danger font-semibold">${weeklyMin.toFixed(2)}</span>
        </div>
        <div className="flex justify-between px-3">
          <span className="text-white/70">MAX:</span>
          <span className="text-v64-success font-semibold">${weeklyMax.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
