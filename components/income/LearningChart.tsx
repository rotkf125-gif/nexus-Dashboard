'use client';

// ═══════════════════════════════════════════════════════════════
// Learning Chart - 월별 배당 패턴 차트 컴포넌트
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { Chart, BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend);

interface LearningChartProps {
  monthlyPattern: [string, number][];
  dividendCount: number;
  predictionAccuracy: { accuracy: number; totalPredicted: number; totalActual: number };
}

export default function LearningChart({ monthlyPattern, dividendCount, predictionAccuracy }: LearningChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new Chart(chartRef.current, {
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

    return () => { chartInstance.current?.destroy(); };
  }, [monthlyPattern]);

  const avgMonthly = monthlyPattern.length > 0
    ? (monthlyPattern.reduce((s, [, v]) => s + v, 0) / monthlyPattern.length).toFixed(0)
    : '0';

  return (
    <div className="inner-glass p-4 rounded" style={{ minHeight: '280px' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] tracking-widest text-celestial-purple font-medium uppercase">LEARNING</span>
        <span className="text-[9px] text-white/60 font-medium">Monthly Pattern</span>
      </div>
      <div style={{ height: 140 }}>
        <canvas ref={chartRef} />
      </div>
      <div className="grid grid-cols-3 gap-2.5 mt-3">
        <div className="inner-glass p-2 rounded text-center">
          <div className="text-[8px] tracking-widest mb-0.5 text-white/60 font-medium uppercase">RECORDS</div>
          <div className="text-[12px] font-display font-medium text-white">{dividendCount}</div>
        </div>
        <div className="inner-glass p-2 rounded text-center border border-celestial-purple/30">
          <div className="text-[8px] tracking-widest mb-0.5 text-celestial-purple/70 font-medium uppercase">ACCURACY</div>
          <div className="text-[12px] font-display font-medium text-celestial-purple">{predictionAccuracy.accuracy.toFixed(0)}%</div>
        </div>
        <div className="inner-glass p-2 rounded text-center">
          <div className="text-[8px] tracking-widest mb-0.5 text-white/60 font-medium uppercase">AVG/MO</div>
          <div className="text-[12px] font-display font-medium text-v64-success">${avgMonthly}</div>
        </div>
      </div>
    </div>
  );
}
