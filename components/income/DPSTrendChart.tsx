'use client';

// ═══════════════════════════════════════════════════════════════
// DPS Trend Chart - DPS 추세 차트 컴포넌트
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import { Asset } from '@/lib/types';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const TICKER_COLORS = [
  'rgba(255, 255, 255, 0.7)',
  'rgba(255, 215, 0, 0.9)',
  'rgba(129, 199, 132, 0.8)',
  'rgba(179, 157, 219, 0.8)',
  'rgba(96, 165, 250, 0.8)',
  'rgba(244, 143, 177, 0.8)',
];

interface DPSTrendChartProps {
  incomeAssets: Asset[];
  dpsData: Record<string, { date: string; dps: number }[]>;
  avgDpsData: { ticker: string; avgDps: number; count: number }[];
}

export default function DPSTrendChart({ incomeAssets, dpsData, avgDpsData }: DPSTrendChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) chartInstance.current.destroy();

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

    chartInstance.current = new Chart(chartRef.current, {
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

    return () => { chartInstance.current?.destroy(); };
  }, [dpsData, incomeAssets]);

  return (
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
        <canvas ref={chartRef} />
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
  );
}
