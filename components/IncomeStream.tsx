'use client';

// ═══════════════════════════════════════════════════════════════
// Income Stream - 인컴 자산 관리 컴포넌트 (리팩토링)
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { TAX_CONFIG } from '@/lib/config';
import PredictedDividend from './PredictedDividend';
import DividendCalendar from './DividendCalendar';
import { IncomeCard, WeeklySummary, RecentLogs, DPSTrendChart, LearningChart, IncomeStatData } from './income';

const { AFTER_TAX_RATE } = TAX_CONFIG;

interface IncomeStreamProps {
  showAnalytics?: boolean;
}

export default function IncomeStream({ showAnalytics = false }: IncomeStreamProps) {
  const { state, setTradeSums, toast } = useNexus();
  const { assets, dividends, tradeSums } = state;
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // INCOME 타입 자산만 필터링
  const incomeAssets = useMemo(() => {
    return assets.filter(a => a.type === 'INCOME');
  }, [assets]);

  // 12개월 전 날짜
  const twelveMonthsAgo = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 12);
    return date;
  }, []);

  // 티커별 배당 (최근 12개월)
  const dividendsByTicker = useMemo(() => {
    const indexed: Record<string, typeof dividends> = {};
    dividends.forEach(d => {
      const dividendDate = new Date(d.date);
      if (dividendDate >= twelveMonthsAgo) {
        if (!indexed[d.ticker]) indexed[d.ticker] = [];
        indexed[d.ticker].push(d);
      }
    });
    return indexed;
  }, [dividends, twelveMonthsAgo]);

  // 티커별 전체 배당
  const allDividendsByTicker = useMemo(() => {
    const indexed: Record<string, typeof dividends> = {};
    dividends.forEach(d => {
      if (!indexed[d.ticker]) indexed[d.ticker] = [];
      indexed[d.ticker].push(d);
    });
    return indexed;
  }, [dividends]);

  // 인컴 통계 계산
  const incomeStats = useMemo((): IncomeStatData[] => {
    return incomeAssets.map(asset => {
      const tickerDividends = dividendsByTicker[asset.ticker] || [];
      const allTickerDividends = allDividendsByTicker[asset.ticker] || [];

      const totalDividend = allTickerDividends.reduce((sum, d) => {
        return sum + d.qty * d.dps * AFTER_TAX_RATE;
      }, 0);

      const avgDps = tickerDividends.length > 0
        ? tickerDividends.reduce((sum, d) => sum + d.dps, 0) / tickerDividends.length
        : 0;

      const principal = asset.qty * asset.avg;
      const valuation = asset.qty * asset.price;
      const tradeReturn = tradeSums[asset.ticker] ?? 0;
      const totalReturn = tradeReturn + (valuation - principal) + totalDividend;
      const recoveryPct = principal > 0 ? (totalDividend / principal) * 100 : 0;

      return {
        ticker: asset.ticker,
        qty: asset.qty,
        avgDps,
        principal,
        totalDividend,
        valuation,
        tradeReturn,
        totalReturn,
        recoveryPct,
        dividendCount: allTickerDividends.length,
      };
    });
  }, [incomeAssets, dividendsByTicker, allDividendsByTicker, tradeSums]);

  // 주간 예상 배당
  const weeklySummary = useMemo(() => {
    let estimatedMin = 0, estimatedAvg = 0, estimatedMax = 0;

    incomeAssets.forEach(asset => {
      const tickerDividends = dividendsByTicker[asset.ticker] || [];
      if (tickerDividends.length > 0) {
        const recentDps = [...tickerDividends]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 6)
          .map(d => d.dps);

        if (recentDps.length > 0) {
          const minDps = Math.min(...recentDps);
          const maxDps = Math.max(...recentDps);
          const avgDps = recentDps.reduce((sum, d) => sum + d, 0) / recentDps.length;

          estimatedMin += asset.qty * minDps * AFTER_TAX_RATE;
          estimatedAvg += asset.qty * avgDps * AFTER_TAX_RATE;
          estimatedMax += asset.qty * maxDps * AFTER_TAX_RATE;
        }
      }
    });

    return { weeklyMin: estimatedMin, weeklyAvg: estimatedAvg, weeklyMax: estimatedMax };
  }, [dividendsByTicker, incomeAssets]);

  // 최근 배당 로그
  const recentLogs = useMemo(() => {
    return [...dividends]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [dividends]);

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

  // ===== Analytics Data =====
  const dpsData = useMemo(() => {
    const result: Record<string, { date: string; dps: number }[]> = {};
    incomeAssets.forEach(asset => {
      const tickerDividends = (dividendsByTicker[asset.ticker] || [])
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      result[asset.ticker] = tickerDividends.map(d => ({ date: d.date, dps: d.dps }));
    });
    return result;
  }, [incomeAssets, dividendsByTicker]);

  const avgDpsData = useMemo(() => {
    return incomeAssets.map(asset => {
      const data = dpsData[asset.ticker] || [];
      const avg = data.length > 0 ? data.reduce((sum, d) => sum + d.dps, 0) / data.length : 0;
      return { ticker: asset.ticker, avgDps: avg, count: data.length };
    });
  }, [incomeAssets, dpsData]);

  const monthlyPattern = useMemo(() => {
    const months: Record<string, number> = {};
    dividends.forEach(d => {
      const month = d.date.slice(0, 7);
      months[month] = (months[month] || 0) + d.qty * d.dps * AFTER_TAX_RATE;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-12) as [string, number][];
  }, [dividends]);

  const predictionAccuracy = useMemo(() => {
    if (avgDpsData.length === 0) return { accuracy: 0, totalPredicted: 0, totalActual: 0 };

    let totalPredicted = 0, totalActual = 0;
    incomeAssets.forEach(asset => {
      const data = dpsData[asset.ticker] || [];
      if (data.length >= 2) {
        const avgDps = data.reduce((sum, d) => sum + d.dps, 0) / data.length;
        const lastDps = data[data.length - 1].dps;
        totalPredicted += avgDps * asset.qty;
        totalActual += lastDps * asset.qty;
      }
    });

    const accuracy = totalPredicted > 0 ? Math.min(100, (totalActual / totalPredicted) * 100) : 0;
    return { accuracy, totalPredicted, totalActual };
  }, [incomeAssets, dpsData, avgDpsData]);

  // Empty state
  if (incomeAssets.length === 0) {
    return (
      <div className="text-center py-8 opacity-50">
        <i className="fas fa-coins text-3xl mb-3 opacity-30" />
        <div className="text-sm">INCOME 타입 자산이 없습니다</div>
      </div>
    );
  }

  const firstTicker = incomeStats[0]?.ticker;

  return (
    <div className={showAnalytics ? "space-y-3 md:space-y-4" : "space-y-3"}>
      {/* View Toggle (Only in full analytics mode) */}
      {showAnalytics && (
        <div className="flex justify-end mb-2">
          <div className="flex gap-1 inner-glass rounded p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-[10px] rounded transition-all flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-celestial-gold/20 text-celestial-gold border border-celestial-gold/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <i className="fas fa-list" />
              LIST
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-[10px] rounded transition-all flex items-center gap-1.5 ${
                viewMode === 'calendar'
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
        <DividendCalendar />
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
