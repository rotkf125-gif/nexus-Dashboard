'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const TICKER_COLORS = [
  'rgba(255, 255, 255, 0.7)',  // White
  'rgba(255, 215, 0, 0.9)',    // Gold
  'rgba(129, 199, 132, 0.8)',  // Green
  'rgba(179, 157, 219, 0.8)',  // Purple
  'rgba(96, 165, 250, 0.8)',   // Blue
  'rgba(244, 143, 177, 0.8)',  // Pink
];

export default function DPSTrend() {
  const { state } = useNexus();
  const { assets, dividends } = state;
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // INCOME 자산만 필터
  const incomeAssets = useMemo(() => {
    return assets.filter(a => a.type === 'INCOME');
  }, [assets]);

  // 각 자산별 DPS 데이터
  const dpsData = useMemo(() => {
    const result: { [ticker: string]: { date: string; dps: number }[] } = {};
    
    incomeAssets.forEach(asset => {
      const tickerDividends = dividends
        .filter(d => d.ticker === asset.ticker)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      result[asset.ticker] = tickerDividends.map(d => ({
        date: d.date,
        dps: d.dps,
      }));
    });

    return result;
  }, [incomeAssets, dividends]);

  // 평균 DPS 계산
  const avgDpsData = useMemo(() => {
    return incomeAssets.map(asset => {
      const data = dpsData[asset.ticker] || [];
      const avg = data.length > 0 
        ? data.reduce((sum, d) => sum + d.dps, 0) / data.length 
        : 0;
      return { ticker: asset.ticker, avgDps: avg };
    });
  }, [incomeAssets, dpsData]);

  // 차트 생성
  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // 모든 날짜 수집 및 정렬
    const allDates = new Set<string>();
    Object.values(dpsData).forEach(data => {
      data.forEach(d => allDates.add(d.date));
    });
    const sortedDates = Array.from(allDates).sort();

    // 데이터셋 생성
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

    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: sortedDates.map(d => {
          // YYYY-MM-DD → YY/MM/DD
          const parts = d.split('-');
          return `${parts[0].slice(2)}/${parts[1]}/${parts[2]}`;
        }),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { 
              color: 'rgba(255, 255, 255, 0.5)',
              font: { size: 9 },
              maxTicksLimit: 10,
            },
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { 
              color: 'rgba(255, 255, 255, 0.5)',
              font: { size: 9 },
              callback: (value) => `$${Number(value).toFixed(2)}`,
            },
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
            padding: 10,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y?.toFixed(4) || '0'}`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [dpsData, incomeAssets]);

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
      {/* Legend */}
      <div className="flex items-center gap-4 text-[9px] font-light justify-end">
        {incomeAssets.slice(0, 6).map((asset, i) => (
          <span key={asset.ticker} className="flex items-center gap-1">
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: TICKER_COLORS[i % TICKER_COLORS.length] }}
            />
            <span className="opacity-60">{asset.ticker}</span>
          </span>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height: 200 }}>
        <canvas ref={chartRef} />
      </div>

      {/* Average DPS Cards */}
      <div className={`grid gap-3 ${avgDpsData.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {avgDpsData.slice(0, 6).map((item, i) => {
          const isGold = i % 2 === 1;
          return (
            <div 
              key={item.ticker}
              className={`inner-glass p-3 rounded text-center ${isGold ? 'border border-celestial-gold/20' : ''}`}
            >
              <div className={`text-[9px] tracking-widest mb-1 font-light ${isGold ? 'text-celestial-gold/50' : 'opacity-50'}`}>
                {item.ticker} AVG DPS
              </div>
              <div className={`text-base font-display font-light ${isGold ? 'text-celestial-gold' : 'text-white'}`}>
                ${item.avgDps.toFixed(4)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
