'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useNexus } from '@/lib/context';
import PredictedDividend from './PredictedDividend';
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

interface IncomeStreamProps {
  showAnalytics?: boolean;
}

export default function IncomeStream({ showAnalytics = false }: IncomeStreamProps) {
  const { state, setTradeSums, toast } = useNexus();
  const { assets, dividends, tradeSums } = state;

  // Chart refs for analytics
  const dpsChartRef = useRef<HTMLCanvasElement>(null);
  const dpsChartInstance = useRef<Chart | null>(null);
  const learningChartRef = useRef<HTMLCanvasElement>(null);
  const learningChartInstance = useRef<Chart | null>(null);

  // INCOME 타입 자산만 필터링
  const incomeAssets = useMemo(() => {
    return assets.filter(a => a.type === 'INCOME');
  }, [assets]);

  // 각 INCOME 자산별 통계 계산
  const incomeStats = useMemo(() => {
    return incomeAssets.map(asset => {
      const tickerDividends = dividends.filter(d => d.ticker === asset.ticker);

      // 총 배당금 (세후 15%)
      const totalDividend = tickerDividends.reduce((sum, d) => {
        const gross = d.qty * d.dps;
        return sum + gross * 0.85;
      }, 0);

      // 배당 횟수
      const dividendCount = tickerDividends.length;

      // 평균 DPS (1주당 배당금)
      const avgDps = dividendCount > 0
        ? tickerDividends.reduce((sum, d) => sum + d.dps, 0) / dividendCount
        : 0;

      // 원금 (매수 비용) - PRINCIPAL
      const principal = asset.qty * asset.avg;

      // 평가금 (현재 가치) - VALUATION
      const valuation = asset.qty * asset.price;

      // 미실현 수익금
      const unrealizedPL = valuation - principal;

      // 매수/매도 합 - TRADE RETURN
      const tradeReturn = tradeSums[asset.ticker] ?? 0;

      // Total Return = 매수/매도 합 + 미실현 수익금 + 누적 배당금
      const totalReturn = tradeReturn + unrealizedPL + totalDividend;

      // Recovery = 총 누적 배당금 / 원금 × 100
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
        dividendCount,
      };
    });
  }, [incomeAssets, dividends, tradeSums]);

  // Weekly Summary 계산 (현재 보유 수량 기반 예상 주간 배당)
  const weeklySummary = useMemo(() => {
    // 현재 보유 수량 기반 MIN/AVG/MAX 계산
    let estimatedMin = 0;
    let estimatedAvg = 0;
    let estimatedMax = 0;

    incomeAssets.forEach(asset => {
      const tickerDividends = dividends.filter(d => d.ticker === asset.ticker);
      if (tickerDividends.length > 0) {
        // 최근 6개 DPS 추출
        const recentDps = tickerDividends
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 6)
          .map(d => d.dps);

        if (recentDps.length > 0) {
          const minDps = Math.min(...recentDps);
          const maxDps = Math.max(...recentDps);
          const avgDps = recentDps.reduce((sum, d) => sum + d, 0) / recentDps.length;

          // 현재 보유 수량 × DPS × 세후 85%
          estimatedMin += asset.qty * minDps * 0.85;
          estimatedAvg += asset.qty * avgDps * 0.85;
          estimatedMax += asset.qty * maxDps * 0.85;
        }
      }
    });

    return {
      weeklyMin: estimatedMin,
      weeklyAvg: estimatedAvg,
      weeklyMax: estimatedMax,
    };
  }, [dividends, incomeAssets]);

  // 최근 배당 로그 (최근 5개)
  const recentLogs = useMemo(() => {
    return [...dividends]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [dividends]);

  // Trade Return 입력 (브라우저 prompt 사용)
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

  // ===== Analytics Data (DPS Trend + Learning) =====
  const dpsData = useMemo(() => {
    const result: { [ticker: string]: { date: string; dps: number }[] } = {};
    incomeAssets.forEach(asset => {
      const tickerDividends = dividends
        .filter(d => d.ticker === asset.ticker)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      result[asset.ticker] = tickerDividends.map(d => ({ date: d.date, dps: d.dps }));
    });
    return result;
  }, [incomeAssets, dividends]);

  const avgDpsData = useMemo(() => {
    return incomeAssets.map(asset => {
      const data = dpsData[asset.ticker] || [];
      const avg = data.length > 0 ? data.reduce((sum, d) => sum + d.dps, 0) / data.length : 0;
      return { ticker: asset.ticker, avgDps: avg, count: data.length };
    });
  }, [incomeAssets, dpsData]);

  const monthlyPattern = useMemo(() => {
    const months: { [key: string]: number } = {};
    dividends.forEach(d => {
      const month = d.date.slice(0, 7); // YYYY-MM
      const amount = d.qty * d.dps * 0.85;
      months[month] = (months[month] || 0) + amount;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12);
  }, [dividends]);

  const predictionAccuracy = useMemo(() => {
    if (avgDpsData.length === 0) return { accuracy: 0, totalPredicted: 0, totalActual: 0 };

    let totalPredicted = 0;
    let totalActual = 0;

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

    if (dpsChartInstance.current) {
      dpsChartInstance.current.destroy();
    }

    const allDates = new Set<string>();
    Object.values(dpsData).forEach(data => {
      data.forEach(d => allDates.add(d.date));
    });
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

    return () => {
      if (dpsChartInstance.current) dpsChartInstance.current.destroy();
    };
  }, [showAnalytics, dpsData, incomeAssets]);

  // Learning Chart (월별 배당)
  useEffect(() => {
    if (!showAnalytics || !learningChartRef.current) return;

    if (learningChartInstance.current) {
      learningChartInstance.current.destroy();
    }

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

    return () => {
      if (learningChartInstance.current) learningChartInstance.current.destroy();
    };
  }, [showAnalytics, monthlyPattern]);

  if (incomeAssets.length === 0) {
    return (
      <div className="text-center py-8 opacity-50">
        <i className="fas fa-coins text-3xl mb-3 opacity-30" />
        <div className="text-sm">INCOME 타입 자산이 없습니다</div>
      </div>
    );
  }

  return (
    <div className={showAnalytics ? "grid grid-cols-1 xl:grid-cols-5 gap-5" : "space-y-3"}>
      {/* Left Section: Income Cards + Summary (2/5 when showAnalytics) */}
      <div className={showAnalytics ? "xl:col-span-2 space-y-3" : "space-y-3"}>
        {/* Income Cards */}
        <div className={`grid ${incomeAssets.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-3`}>
          {incomeStats.map((stat, i) => {
            const isGold = i % 2 === 1;
            const borderClass = isGold ? 'border-celestial-gold/20' : 'border-white/10';
            const textClass = isGold ? 'text-celestial-gold' : 'text-white';
            const barBg = isGold ? 'bg-celestial-gold/10' : 'bg-white/5';
            const barFill = isGold
              ? 'bg-gradient-to-r from-celestial-gold/50 to-celestial-gold'
              : 'bg-gradient-to-r from-white/30 to-white/60';

            const totalReturnColor = stat.totalReturn >= 0 ? 'text-v64-success bg-v64-success/10 border-v64-success/30' : 'text-v64-danger bg-v64-danger/10 border-v64-danger/30';

            return (
              <div
                key={stat.ticker}
                className={`inner-glass p-4 rounded border ${borderClass}`}
              >
                {/* Header: 종목명 + Total Return */}
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-base font-display tracking-widest ${textClass}`}>
                    {stat.ticker}
                  </span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 border rounded ${totalReturnColor}`}>
                    {stat.totalReturn >= 0 ? '+' : ''}${stat.totalReturn.toFixed(2)}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="space-y-1 text-[10px] mb-3">
                  {/* Row 1: QTY | DIVIDEND */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center">
                      <span className="opacity-40 tracking-wider">QTY</span>
                      <span className="text-celestial-cyan font-medium">{stat.qty}주</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-40 tracking-wider">DIVIDEND</span>
                      <span className="text-v64-success">${stat.totalDividend.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Row 2: PRINCIPAL | VALUATION */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center">
                      <span className="opacity-40 tracking-wider">PRINCIPAL</span>
                      <span className="text-white/80">${stat.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-40 tracking-wider">VALUATION</span>
                      <span className="text-white/80">${stat.valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Row 3: TRADE R. */}
                  <div className="flex justify-between items-center">
                    <span className="opacity-40 tracking-wider">TRADE R.</span>
                    <span
                      className={`cursor-pointer hover:opacity-80 ${stat.tradeReturn >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}
                      onClick={() => handleEditTradeReturn(stat.ticker, stat.tradeReturn)}
                      title="클릭하여 수정"
                    >
                      {stat.tradeReturn >= 0 ? '+' : ''}${stat.tradeReturn.toFixed(2)}
                      <i className="fas fa-pen text-[7px] ml-1 opacity-40" />
                    </span>
                  </div>
                </div>

                {/* Recovery Progress */}
                <div className={`border-t pt-2 ${isGold ? 'border-celestial-gold/20' : 'border-white/10'}`}>
                  <div className="flex justify-between mb-1 text-[9px] tracking-widest">
                    <span className={isGold ? 'text-celestial-gold/50' : 'opacity-40'}>RECOVERY</span>
                    <span className={stat.recoveryPct >= 100 ? 'text-v64-success' : (isGold ? 'text-celestial-gold/70' : 'opacity-70')}>
                      {stat.recoveryPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${barBg}`}>
                    <div
                      className={`h-full transition-all ${stat.recoveryPct >= 100 ? 'bg-v64-success' : barFill}`}
                      style={{ width: `${Math.min(100, stat.recoveryPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Summary */}
        <div className="grid grid-cols-2 gap-3">
          {/* Est. Weekly */}
          <div className="inner-glass p-3 text-center rounded border border-celestial-purple/20">
            <div className="text-[9px] text-celestial-purple tracking-[0.2em] mb-0.5 font-light">
              EST. WEEKLY
            </div>
            <div className="text-[7px] opacity-40 mb-1">(현재 수량 × 최근 6회 DPS)</div>
            <div className="text-lg font-display font-light text-white">
              ${weeklySummary.weeklyAvg.toFixed(2)}
            </div>
            <div className="flex justify-between mt-1 text-[9px] font-light opacity-60">
              <span>MIN: <span className="text-v64-danger">${weeklySummary.weeklyMin.toFixed(2)}</span></span>
              <span>MAX: <span className="text-v64-success">${weeklySummary.weeklyMax.toFixed(2)}</span></span>
            </div>
          </div>

          {/* Recent Logs */}
          <div className="inner-glass p-3 rounded flex flex-col">
            <div className="flex justify-between items-center mb-1 text-[9px] opacity-60 tracking-widest font-light">
              <span>RECENT LOGS</span>
              <i className="fas fa-history text-[8px]" />
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-grow max-h-[80px] space-y-1">
              {recentLogs.length > 0 ? recentLogs.map((d, i) => {
                // YYYY-MM-DD → YY/MM/DD
                const dateParts = d.date.split('-');
                const formattedDate = `${dateParts[0].slice(2)}/${dateParts[1]}/${dateParts[2]}`;
                return (
                  <div key={i} className="flex justify-between text-[9px] font-light">
                    <span className="opacity-50">{formattedDate}</span>
                    <span className={d.ticker === incomeStats[0]?.ticker ? 'text-white/80' : 'text-celestial-gold'}>
                      {d.ticker}
                    </span>
                    <span>${(d.qty * d.dps * 0.85).toFixed(2)}</span>
                  </div>
                );
              }) : (
                <div className="text-[9px] opacity-40 text-center py-2">기록 없음</div>
              )}
            </div>
          </div>
        </div>

        {/* Predicted Dividend */}
        <PredictedDividend />
      </div>

      {/* Right Section: Analytics (3/5 when showAnalytics) */}
      {showAnalytics && (
        <div className="xl:col-span-3 grid grid-cols-2 gap-4">
          {/* DPS Trend */}
          <div className="inner-glass p-4 rounded">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] tracking-widest text-celestial-cyan">DPS TREND</span>
              <div className="flex items-center gap-2 text-[8px] font-light">
                {incomeAssets.slice(0, 3).map((asset, i) => (
                  <span key={asset.ticker} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TICKER_COLORS[i] }} />
                    <span className="opacity-60">{asset.ticker}</span>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ height: 150 }}>
              <canvas ref={dpsChartRef} />
            </div>

            {/* Average DPS Cards */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {avgDpsData.slice(0, 2).map((item, i) => {
                const isGold = i % 2 === 1;
                return (
                  <div key={item.ticker} className={`inner-glass p-2 rounded text-center ${isGold ? 'border border-celestial-gold/20' : ''}`}>
                    <div className={`text-[8px] tracking-widest mb-0.5 ${isGold ? 'text-celestial-gold/50' : 'opacity-50'}`}>
                      {item.ticker} AVG
                    </div>
                    <div className={`text-[11px] font-display ${isGold ? 'text-celestial-gold' : 'text-white'}`}>
                      ${item.avgDps.toFixed(4)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Learning */}
          <div className="inner-glass p-4 rounded">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] tracking-widest text-celestial-purple">LEARNING</span>
              <span className="text-[8px] opacity-40">Monthly Pattern</span>
            </div>

            <div style={{ height: 150 }}>
              <canvas ref={learningChartRef} />
            </div>

            {/* Learning Stats */}
            <div className="grid grid-cols-3 gap-1.5 mt-3">
              <div className="inner-glass p-2 rounded text-center">
                <div className="text-[7px] tracking-widest mb-0.5 opacity-50">RECORDS</div>
                <div className="text-[10px] font-display text-white">{dividends.length}</div>
              </div>
              <div className="inner-glass p-2 rounded text-center border border-celestial-purple/20">
                <div className="text-[7px] tracking-widest mb-0.5 text-celestial-purple/50">ACCURACY</div>
                <div className="text-[10px] font-display text-celestial-purple">{predictionAccuracy.accuracy.toFixed(0)}%</div>
              </div>
              <div className="inner-glass p-2 rounded text-center">
                <div className="text-[7px] tracking-widest mb-0.5 opacity-50">AVG/MO</div>
                <div className="text-[10px] font-display text-v64-success">
                  ${monthlyPattern.length > 0
                    ? (monthlyPattern.reduce((s, [, v]) => s + v, 0) / monthlyPattern.length).toFixed(0)
                    : '0'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
