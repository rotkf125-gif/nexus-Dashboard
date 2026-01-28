'use client';

// ═══════════════════════════════════════════════════════════════
// Income Stream - 인컴 자산 관리 컴포넌트 (리팩토링)
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { TAX_CONFIG } from '@/lib/config';
import { useIncomeAnalytics } from '@/lib/hooks/useIncomeAnalytics';
import PredictedDividend from './PredictedDividend';
import DividendCalendar from './DividendCalendar';
import InteractiveDividendCalendar from './charts/InteractiveDividendCalendar';
import { IncomeCard, WeeklySummary, RecentLogs, DPSTrendChart, LearningChart } from './income';

// Removed unused constant import since it's used inside the hook now
// const { AFTER_TAX_RATE } = TAX_CONFIG;

interface IncomeStreamProps {
  showAnalytics?: boolean;
}

export default function IncomeStream({ showAnalytics = false }: IncomeStreamProps) {
  const { state, setTradeSums, toast } = useNexus();
  const { assets, dividends, tradeSums } = state;
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Use Custom Hook for Logic
  const {
    incomeAssets,
    incomeStats,
    weeklySummary,
    recentLogs,
    dpsData,
    avgDpsData,
    monthlyPattern,
    predictionAccuracy
  } = useIncomeAnalytics({ assets, dividends, tradeSums });

  // Empty state
  if (incomeAssets.length === 0) {
    return (
      <div className="text-center py-8 opacity-70">
        <i className="fas fa-coins text-3xl mb-3 opacity-30" />
        <div className="text-sm">INCOME 타입 자산이 없습니다</div>
      </div>
    );
  }

  // Trade Return 수정 핸들러
  const handleEditTradeReturn = (ticker: string, currentValue: number) => {
    const input = prompt(`Trade Return (${ticker}):`, currentValue.toString());
    if (input !== null) {
      const amount = parseFloat(input);
      if (!isNaN(amount)) {
        setTradeSums(ticker, amount);
        toast(`${ticker} Trade Return: $${amount.toFixed(2)}`, 'success');
      }
    }
  };

  const firstTicker = incomeStats[0]?.ticker;

  return (
    <div className={showAnalytics ? "space-y-3 md:space-y-4" : "space-y-3"}>
      {/* View Toggle (Only in full analytics mode) */}
      {showAnalytics && (
        <div className="flex justify-end mb-2">
          <div className="flex gap-1 inner-glass rounded p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-[10px] rounded transition-all flex items-center gap-1.5 ${viewMode === 'list'
                ? 'bg-celestial-gold/20 text-celestial-gold border border-celestial-gold/30'
                : 'text-white/60 hover:text-white'
                }`}
            >
              <i className="fas fa-list" />
              LIST
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-[10px] rounded transition-all flex items-center gap-1.5 ${viewMode === 'calendar'
                ? 'bg-celestial-gold/20 text-celestial-gold border border-celestial-gold/30'
                : 'text-white/60 hover:text-white'
                }`}
            >
              <i className="fas fa-calendar-alt" />
              CALENDAR
            </button>
          </div>
        </div>
      )}

      {/* Conditional Rendering based on View Mode */}
      {viewMode === 'calendar' && showAnalytics ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DividendCalendar />
          <InteractiveDividendCalendar />
        </div>
      ) : showAnalytics ? (
        <>
          {/* Row 1: Income Cards | EST. WEEKLY | RECENT LOGS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {incomeStats.map((stat, i) => (
              <IncomeCard
                key={stat.ticker}
                stat={stat}
                index={i}
                compact={false}
                onEditTradeReturn={handleEditTradeReturn}
              />
            ))}
            <WeeklySummary {...weeklySummary} compact={false} />
            <RecentLogs logs={recentLogs} firstTicker={firstTicker} compact={false} />
          </div>

          {/* Row 2: DPS Trend | Learning */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <DPSTrendChart
              incomeAssets={incomeAssets}
              dpsData={dpsData}
              avgDpsData={avgDpsData}
            />
            <LearningChart
              monthlyPattern={monthlyPattern}
              dividendCount={dividends.length}
              predictionAccuracy={predictionAccuracy}
            />
          </div>
        </>
      ) : (
        /* Non-Analytics Mode (Compact List) */
        <div className="space-y-3">
          {/* Income Cards */}
          <div className={`grid ${incomeAssets.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-3`}>
            {incomeStats.map((stat, i) => (
              <IncomeCard
                key={stat.ticker}
                stat={stat}
                index={i}
                compact={true}
                onEditTradeReturn={handleEditTradeReturn}
              />
            ))}
          </div>

          {/* Weekly Summary & Recent Logs */}
          <div className="grid grid-cols-2 gap-3">
            <WeeklySummary {...weeklySummary} compact={true} />
            <RecentLogs logs={recentLogs} firstTicker={firstTicker} compact={true} />
          </div>

          {/* Predicted Dividend */}
          <PredictedDividend />
        </div>
      )}
    </div>
  );
}
