'use client';

import { Dividend } from '@/lib/types';
import { TAX_CONFIG } from '@/lib/config';

interface RecentLogsProps {
  logs: Dividend[];
  firstTicker?: string;
  compact?: boolean;
}

export default function RecentLogs({ logs, firstTicker, compact = false }: RecentLogsProps) {
  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    return `${parts[0].slice(2)}/${parts[1]}/${parts[2]}`;
  };

  if (compact) {
    return (
      <div className="inner-glass p-3 rounded flex flex-col">
        <div className="flex justify-between items-center mb-2 text-[10px] text-white/80 tracking-widest font-medium uppercase">
          <span>RECENT LOGS</span>
          <i className="fas fa-history text-[9px] text-white/50" />
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-grow max-h-[80px] space-y-1">
          {logs.length > 0 ? logs.map((d, i) => (
            <div key={i} className="flex justify-between text-[10px] font-medium">
              <span className="text-white/60 w-16">{formatDate(d.date)}</span>
              <span className={`w-12 text-center ${d.ticker === firstTicker ? 'text-white' : 'text-celestial-gold'}`}>
                {d.ticker}
              </span>
              <span className="text-white w-14 text-right">${(d.qty * d.dps * TAX_CONFIG.AFTER_TAX_RATE).toFixed(2)}</span>
            </div>
          )) : (
            <div className="text-[10px] text-white/60 text-center py-2">기록 없음</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="inner-glass p-4 rounded flex flex-col" style={{ minHeight: '280px' }}>
      <div className="flex justify-between items-center mb-3 text-[10px] text-white/80 tracking-widest font-semibold uppercase">
        <span>RECENT LOGS</span>
        <i className="fas fa-history text-[9px] text-white/50" />
      </div>
      <div className="overflow-y-auto custom-scrollbar flex-grow space-y-2">
        {logs.length > 0 ? logs.map((d, i) => (
          <div key={i} className="flex justify-between text-[10px] font-medium items-center">
            <span className="text-white/60 w-16">{formatDate(d.date)}</span>
            <span className={`w-12 text-center font-semibold ${d.ticker === firstTicker ? 'text-white' : 'text-celestial-gold'}`}>
              {d.ticker}
            </span>
            <span className="text-white w-16 text-right font-semibold">${(d.qty * d.dps * TAX_CONFIG.AFTER_TAX_RATE).toFixed(2)}</span>
          </div>
        )) : (
          <div className="text-[10px] text-white/60 text-center py-4">기록 없음</div>
        )}
      </div>
    </div>
  );
}
