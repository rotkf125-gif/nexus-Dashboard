'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useNexus } from '@/lib/context';
import PredictedDividend from './PredictedDividend';
import { IncomeCard, WeeklySummary, RecentLogs, IncomeStatData } from './income';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, BarController, BarElement } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, BarController, BarElement);

const TICKER_COLORS = [
  'rgba(255, 255, 255, 0.7)',
  'rgba(255, 215, 0, 0.9)',
  'rgba(129, 199, 132, 0.8)',
  'rgba(179, 157, 219, 0.8)',
  'rgba(96, 165, 250, 0.8)',
  'rgba(244, 143, 177, 0.8)',
];

// 세후 배당금 비율 (15% 이자세)
const AFTER_TAX_RATE = 0.85;

interface IncomeStreamProps {
  showAnalytics?: boolean;
}

export default function IncomeStream({ showAnalytics = false }: IncomeStreamProps) {
  const { state, setTradeSums, toast } = useNexus();
  const { assets, dividends, tradeSums } = state;

  // Chart refs
  const dpsChartRef = useRef<HTMLCanvasElement>(null);
  const dpsChartInstance = useRef<Chart | null>(null);
  const learningChartRef = useRef<HTMLCanvasElement>(null);
  const learningChartInstance = useRef<Chart | null>(null);

  // INCOME 타입 자산만 필터링
  const incomeAssets = useMemo(() => {
    return assets.filter(a => a.type === 'INCOME');
  }, [assets]);

  // 최근 12개월 기준 날짜 계산
  const twelveMonthsAgo = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 12);
    return date;
  }, []);

  // 배당금 데이터 사전 색인화 (O(n²) → O(n) 최적화) + 최근 12개월 필터링
  const dividendsByTicker = useMemo(() => {
    const indexed: Record<string, typeof dividends> = {};
    dividends.forEach(d => {
      // 최근 12개월 배당금만 포함 (성능 최적화)
      const dividendDate = new Date(d.date);
      if (dividendDate >= twelveMonthsAgo) {
        if (!indexed[d.ticker]) indexed[d.ticker] = [];
        indexed[d.ticker].push(d);
      }
    });
    return indexed;
  }, [dividends, twelveMonthsAgo]);

  // 전체 배당금 (과거 포함) - 총 수익 계산용
  const allDividendsByTicker = useMemo(() => {
    const indexed: Record<string, typeof dividends> = {};
    dividends.forEach(d => {
      if (!indexed[d.ticker]) indexed[d.ticker] = [];
      indexed[d.ticker].push(d);
    });
    return indexed;
  }, [dividends]);

  // 각 INCOME 자산별 통계 계산
  const incomeStats = useMemo((): IncomeStatData[] => {
    return incomeAssets.map(asset => {
      const tickerDividends = dividendsByTicker[asset.ticker] || []; // 최근 12개월
      const allTickerDividends = allDividendsByTicker[asset.ticker] || []; // 전체 기간

      // 총 배당금 (세후) - 전체 기간 사용
      const totalDividend = allTickerDividends.reduce((sum, d) => {
        return sum + d.qty * d.dps * AFTER_TAX_RATE;
      }, 0);

      // 평균 DPS - 최근 12개월 사용 (더 정확한 예측)
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

  // Weekly Summary 계산
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
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
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

  // DPS Trend Chart
  useEffect(() => {
    if (!showAnalytics || !dpsChartRef.current) return;

    if (dpsChartInstance.current) dpsChartInstance.current.destroy();

    const allDates = new Set<string>();
    Object.values(dpsData).forEach(data => data.forEach(d => allDates.add(d.date)));
    const sortedDates = Array.from(allDates).sort();

    const datasets = incomeAssets.map((asset, i) => {
      const data = dpsData[asset.ticker] || [];
      const dateMap = new Map(data.map(d => [d.date, d.dps]));
      return {
        label: asset.ticker,
        data: sortedDates.map(date => dateMap.get(date) || null),
        borderColor: TICKER_COLORS[i % TICKER_COLORS.length],
        backgroundColor: TICKER_COLORS[i % TICKER_COLORS.length],
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
        spanGaps: true,
      };
    });

    dpsChartInstance.current = new Chart(dpsChartRef.current, {
      type: 'line',
      data: {
        labels: sortedDates.map(d => {
          const parts = d.split('-');
          return `${parts[0].slice(2)}/${parts[1]}/${parts[2]}`;
        }),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 9 }, maxTicksLimit: 6 },
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 9 }, callback: (v) => `$${Number(v).toFixed(2)}` },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10, 15, 41, 0.95)',
            titleColor: 'rgba(255, 255, 255, 0.8)',
            bodyColor: 'rgba(255, 255, 255, 0.7)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: { label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y?.toFixed(4) || '0'}` },
          },
        },
      },
    });

    return () => { dpsChartInstance.current?.destroy(); };
  }, [showAnalytics, dpsData, incomeAssets]);

  // Learning Chart
  useEffect(() => {
    if (!showAnalytics || !learningChartRef.current) return;

    if (learningChartInstance.current) learningChartInstance.current.destroy();

    learningChartInstance.current = new Chart(learningChartRef.current, {
      type: 'bar',
      data: {
        labels: monthlyPattern.map(([m]) => m.slice(2).replace('-', '/')),
        datasets: [{
          label: 'Monthly Dividend',
          data: monthlyPattern.map(([, v]) => v),
          backgroundColor: 'rgba(96, 165, 250, 0.6)',
          borderColor: 'rgba(96, 165, 250, 1)',
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 8 } },
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 9 }, callback: (v) => `$${v}` },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10, 15, 41, 0.95)',
            callbacks: { label: (ctx) => `$${ctx.parsed.y?.toFixed(2) ?? '0'}` },
          },
        },
      },
    });

    return () => { learningChartInstance.current?.destroy(); };
  }, [showAnalytics, monthlyPattern]);

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
      {showAnalytics ? (
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
            {/* DPS Trend */}
            <div className="inner-glass p-4 rounded" style={{ minHeight: '280px' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] tracking-widest text-celestial-cyan font-medium uppercase">DPS TREND</span>
                <div className="flex items-center gap-3 text-[9px] font-medium">
                  {incomeAssets.slice(0, 3).map((asset, i) => (
                    <span key={asset.ticker} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TICKER_COLORS[i] }} />
                      <span className="text-white/70">{asset.ticker}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ height: 140 }}>
                <canvas ref={dpsChartRef} />
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                {avgDpsData.slice(0, 2).map((item, i) => {
                  const isGold = i % 2 === 1;
                  return (
                    <div key={item.ticker} className={`inner-glass p-2 rounded text-center ${isGold ? 'border border-celestial-gold/30' : ''}`}>
                      <div className={`text-[8px] tracking-widest mb-0.5 font-medium uppercase ${isGold ? 'text-celestial-gold/70' : 'text-white/60'}`}>
                        {item.ticker} AVG
                      </div>
                      <div className={`text-[12px] font-display font-medium ${isGold ? 'text-celestial-gold' : 'text-white'}`}>
                        ${item.avgDps.toFixed(4)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Learning */}
            <div className="inner-glass p-4 rounded" style={{ minHeight: '280px' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] tracking-widest text-celestial-purple font-medium uppercase">LEARNING</span>
                <span className="text-[9px] text-white/60 font-medium">Monthly Pattern</span>
              </div>
              <div style={{ height: 140 }}>
                <canvas ref={learningChartRef} />
              </div>
              <div className="grid grid-cols-3 gap-2.5 mt-3">
                <div className="inner-glass p-2 rounded text-center">
                  <div className="text-[8px] tracking-widest mb-0.5 text-white/60 font-medium uppercase">RECORDS</div>
                  <div className="text-[12px] font-display font-medium text-white">{dividends.length}</div>
                </div>
                <div className="inner-glass p-2 rounded text-center border border-celestial-purple/30">
                  <div className="text-[8px] tracking-widest mb-0.5 text-celestial-purple/70 font-medium uppercase">ACCURACY</div>
                  <div className="text-[12px] font-display font-medium text-celestial-purple">{predictionAccuracy.accuracy.toFixed(0)}%</div>
                </div>
                <div className="inner-glass p-2 rounded text-center">
                  <div className="text-[8px] tracking-widest mb-0.5 text-white/60 font-medium uppercase">AVG/MO</div>
                  <div className="text-[12px] font-display font-medium text-v64-success">
                    ${monthlyPattern.length > 0
                      ? (monthlyPattern.reduce((s, [, v]) => s + v, 0) / monthlyPattern.length).toFixed(0)
                      : '0'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Non-Analytics Mode */
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
