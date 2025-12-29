'use client';

import { useNexus } from '@/lib/context';
import { useEffect, useRef } from 'react';
import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip);

const COLORS = [
  '#90CAF9', '#FFD700', '#B39DDB', '#81C784', '#F48FB1',
  '#FFB74D', '#80DEEA', '#A5D6A7', '#90A4AE', '#CE93D8',
];

export default function StarCore() {
  const { state } = useNexus();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Calculate totals
  let totalValue = 0, totalCost = 0;
  state.assets.forEach(a => {
    totalValue += a.qty * a.price;
    totalCost += a.qty * a.avg;
  });
  
  const returnVal = totalValue - totalCost;
  const returnPct = totalCost > 0 ? ((returnVal / totalCost) * 100) : 0;
  const colorClass = returnVal >= 0 ? 'text-celestial-success glow-success' : 'text-celestial-danger glow-danger';
  const sign = returnVal >= 0 ? '+' : '';

  const formatUSD = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
          backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
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
        <div className="text-[9px] tracking-[0.2em] text-white/50 font-light mb-2">TOTAL VALUE</div>
        <div className="text-3xl font-display font-light tracking-tight text-white">
          {formatUSD(totalValue)}
        </div>
        <div className={`text-base font-light mt-1 ${colorClass}`}>
          {sign}{returnPct.toFixed(2)}%
        </div>
        
        {/* Chart overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{ width: 200, height: 200 }}>
            <canvas ref={chartRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
