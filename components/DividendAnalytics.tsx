'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useNexus } from '@/lib/context';
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

type TabType = 'dps' | 'learning';

export default function DividendAnalytics() {
  const { state } = useNexus();
  const { assets, dividends } = state;
  const [activeTab, setActiveTab] = useState<TabType>('dps');
  
  // Chart refs
  const dpsChartRef = useRef<HTMLCanvasElement>(null);
  const dpsChartInstance = useRef<Chart | null>(null);
  const learningChartRef = useRef<HTMLCanvasElement>(null);
  const learningChartInstance = useRef<Chart | null>(null);

  // INCOME 자산만 필터
  const incomeAssets = useMemo(() => {
    return assets.filter(a => a.type === 'INCOME');
  }, [assets]);

  // DPS 데이터
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

  // 평균 DPS
  const avgDpsData = useMemo(() => {
    return incomeAssets.map(asset => {
      const data = dpsData[asset.ticker] || [];
      const avg = data.length > 0 ? data.reduce((sum, d) => sum + d.dps, 0) / data.length : 0;
      return { ticker: asset.ticker, avgDps: avg, count: data.length };
    });
  }, [incomeAssets, dpsData]);

  // Learning 데이터: 월별 배당 패턴
  const monthlyPattern = useMemo(() => {
    const months: { [key: string]: number } = {};
    dividends.forEach(d => {
      const month = d.date.slice(0, 7); // YYYY-MM
      const amount = d.qty * d.dps * 0.85;
      months[month] = (months[month] || 0) + amount;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12); // 최근 12개월
  }, [dividends]);

  // 예측 정확도 계산
  const predictionAccuracy = useMemo(() => {
    if (avgDpsData.length === 0) return { accuracy: 0, totalPredicted: 0, totalActual: 0 };
    
    let totalPredicted = 0;
    let totalActual = 0;
    
    incomeAssets.forEach(asset => {
      const data = dpsData[asset.ticker] || [];
      if (data.length >= 2) {
        // 마지막 DPS를 예측값으로, 평균 DPS를 기준으로
        const avgDps = data.reduce((sum, d) => sum + d.dps, 0) / data.length;
        const lastDps = data[data.length - 1].dps;
        totalPredicted += avgDps * asset.qty;
        totalActual += lastDps * asset.qty;
      }
    });
    
    const accuracy = totalPredicted > 0 ? Math.min(100, (totalActual / totalPredicted) * 100) : 0;
    return { accuracy, totalPredicted, totalActual };
  }, [incomeAssets, dpsData]);

  // DPS Trend 차트
  useEffect(() => {
    if (!dpsChartRef.current || activeTab !== 'dps') return;

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
            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 9 }, maxTicksLimit: 8 },
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
  }, [dpsData, incomeAssets, activeTab]);

  // Learning 차트 (월별 배당)
  useEffect(() => {
    if (!learningChartRef.current || activeTab !== 'learning') return;

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
            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 9 } },
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
  }, [monthlyPattern, activeTab]);

  if (incomeAssets.length === 0) {
    return (
      <div className="text-center py-8 opacity-50">
        <i className="fas fa-chart-line text-3xl mb-3 opacity-30" />
        <div className="text-sm">INCOME 타입 자산이 없습니다</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Tab Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('dps')}
            className={`px-3 py-1.5 text-[10px] tracking-widest rounded transition ${
              activeTab === 'dps' 
                ? 'bg-celestial-cyan/20 text-celestial-cyan border border-celestial-cyan/30' 
                : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
            }`}
          >
            DPS TREND
          </button>
          <button
            onClick={() => setActiveTab('learning')}
            className={`px-3 py-1.5 text-[10px] tracking-widest rounded transition ${
              activeTab === 'learning' 
                ? 'bg-celestial-purple/20 text-celestial-purple border border-celestial-purple/30' 
                : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
            }`}
          >
            LEARNING
          </button>
        </div>
        
        {/* Legend */}
        {activeTab === 'dps' && (
          <div className="flex items-center gap-3 text-[9px] font-light">
            {incomeAssets.slice(0, 4).map((asset, i) => (
              <span key={asset.ticker} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TICKER_COLORS[i] }} />
                <span className="opacity-60">{asset.ticker}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* DPS Trend Tab */}
      {activeTab === 'dps' && (
        <>
          <div style={{ height: 180 }}>
            <canvas ref={dpsChartRef} />
          </div>
          
          {/* Average DPS Cards */}
          <div className="grid grid-cols-2 gap-2">
            {avgDpsData.slice(0, 4).map((item, i) => {
              const isGold = i % 2 === 1;
              return (
                <div key={item.ticker} className={`inner-glass p-2.5 rounded text-center ${isGold ? 'border border-celestial-gold/20' : ''}`}>
                  <div className={`text-[9px] tracking-widest mb-0.5 ${isGold ? 'text-celestial-gold/50' : 'opacity-50'}`}>
                    {item.ticker} AVG DPS
                  </div>
                  <div className={`text-sm font-display ${isGold ? 'text-celestial-gold' : 'text-white'}`}>
                    ${item.avgDps.toFixed(4)}
                  </div>
                  <div className="text-[8px] opacity-40">{item.count}회</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Learning Tab */}
      {activeTab === 'learning' && (
        <>
          <div style={{ height: 180 }}>
            <canvas ref={learningChartRef} />
          </div>
          
          {/* Learning Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="inner-glass p-2.5 rounded text-center">
              <div className="text-[9px] tracking-widest mb-0.5 opacity-50">TOTAL RECORDS</div>
              <div className="text-sm font-display text-white">{dividends.length}</div>
            </div>
            <div className="inner-glass p-2.5 rounded text-center border border-celestial-purple/20">
              <div className="text-[9px] tracking-widest mb-0.5 text-celestial-purple/50">PREDICTION</div>
              <div className="text-sm font-display text-celestial-purple">{predictionAccuracy.accuracy.toFixed(1)}%</div>
            </div>
            <div className="inner-glass p-2.5 rounded text-center">
              <div className="text-[9px] tracking-widest mb-0.5 opacity-50">AVG MONTHLY</div>
              <div className="text-sm font-display text-v64-success">
                ${monthlyPattern.length > 0 
                  ? (monthlyPattern.reduce((s, [, v]) => s + v, 0) / monthlyPattern.length).toFixed(2) 
                  : '0.00'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
