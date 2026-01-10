'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';
import { useNexus } from '@/lib/context';
import { CHART_COLORS } from '@/lib/config';
import { formatUSD, calculatePortfolioStats, getReturnGlowClass } from '@/lib/utils';

Chart.register(DoughnutController, ArcElement, Tooltip);

export default function StarCore() {
  const { state } = useNexus();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Calculate totals using memoized utility
  const stats = useMemo(
    () => calculatePortfolioStats(state.assets, state.exchangeRate),
    [state.assets, state.exchangeRate]
  );

  const colorClass = getReturnGlowClass(stats.returnPct);
  const sign = stats.returnValue >= 0 ? '+' : '';

  useEffect(() => {
    if (!chartRef.current) return;

    const data = state.assets.filter(a => a.qty * a.price > 0);

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: 'doughnut',
      data: {
        labels: data.map(a => a.ticker),
        datasets: [{
          data: data.map(a => a.qty * a.price),
          backgroundColor: data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        animation: { animateRotate: false },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [state.assets]);

  return (
    <div className="star-core-container">
      <div className="star-glow" />
      <div className="star-core-center">
        <div className="text-[10px] tracking-[0.15em] text-white/90 font-light mb-1">TOTAL VALUE</div>
        <div className="text-2xl font-display font-light tracking-tight text-white">
          {formatUSD(stats.totalValue)}
        </div>
        <div className={`text-sm font-light mt-1 ${colorClass}`}>
          {sign}{stats.returnPct.toFixed(2)}%
        </div>

        {/* Chart overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{ width: 155, height: 155 }}>
            <canvas ref={chartRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
