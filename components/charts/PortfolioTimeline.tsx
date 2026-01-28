'use client';

import { useRef, useEffect, useState } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { useNexus } from '@/lib/context';
import { usePortfolioTimeline } from '@/lib/hooks/usePortfolioTimeline';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend
);

type Period = '1m' | '3m' | '6m' | '1y' | 'all';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '1m', label: '1개월' },
  { value: '3m', label: '3개월' },
  { value: '6m', label: '6개월' },
  { value: '1y', label: '1년' },
  { value: 'all', label: '전체' },
];

export default function PortfolioTimeline() {
  const { state } = useNexus();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [period, setPeriod] = useState<Period>('3m');

  const { dataPoints, milestones, stats } = usePortfolioTimeline(
    state.timeline || [],
    state.tradeLogs || [],
    state.dividends || [],
    period
  );

  useEffect(() => {
    if (!chartRef.current || dataPoints.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(96, 165, 250, 0.3)');
    gradient.addColorStop(1, 'rgba(96, 165, 250, 0)');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: dataPoints.map((d) => {
          const date = new Date(d.date);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        datasets: [
          {
            label: '포트폴리오 가치',
            data: dataPoints.map((d) => d.value),
            borderColor: 'rgba(96, 165, 250, 1)',
            backgroundColor: gradient,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: 'rgba(96, 165, 250, 1)',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
          },
          {
            label: '원금',
            data: dataPoints.map((d) => d.cost),
            borderColor: 'rgba(255, 255, 255, 0.3)',
            borderDash: [5, 5],
            borderWidth: 1,
            tension: 0.4,
            fill: false,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(10, 15, 41, 0.9)',
            titleColor: 'rgba(255, 255, 255, 0.9)',
            bodyColor: 'rgba(255, 255, 255, 0.7)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y ?? 0;
                return `${context.dataset.label}: $${value.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.5)',
              font: { size: 10 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
            },
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.5)',
              font: { size: 10 },
              callback: (value) => `$${Number(value).toLocaleString()}`,
            },
          },
        },
      },
    });

    return () => {
      chartInstance.current?.destroy();
    };
  }, [dataPoints]);

  return (
    <div className="inner-glass p-4 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display tracking-widest text-white flex items-center gap-2">
          <i className="fas fa-chart-area text-celestial-cyan text-xs" aria-hidden="true" />
          포트폴리오 타임라인
        </h3>

        {/* Period Selector */}
        <div className="flex gap-1" role="tablist" aria-label="기간 선택">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={period === opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 text-[10px] rounded transition-all focus-visible-ring ${
                period === opt.value
                  ? 'bg-celestial-cyan/20 text-celestial-cyan border border-celestial-cyan/30'
                  : 'text-white/70 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {dataPoints.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center">
            <div className="text-[10px] text-white/70 mb-1">시작 가치</div>
            <div className="text-sm font-mono text-white">
              ${stats.startValue.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-white/70 mb-1">현재 가치</div>
            <div className="text-sm font-mono text-white">
              ${stats.endValue.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-white/70 mb-1">총 수익률</div>
            <div
              className={`text-sm font-mono ${
                stats.totalReturn >= 0 ? 'text-v64-success' : 'text-v64-danger'
              }`}
            >
              {stats.totalReturn >= 0 ? '+' : ''}
              {stats.totalReturn.toFixed(2)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-white/70 mb-1">최고 가치</div>
            <div className="text-sm font-mono text-celestial-gold">
              ${stats.maxValue.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-64 relative">
        {dataPoints.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
            <div className="text-center">
              <i className="fas fa-chart-line text-3xl mb-2 opacity-30" aria-hidden="true" />
              <div>데이터가 충분하지 않습니다</div>
            </div>
          </div>
        ) : (
          <canvas ref={chartRef} />
        )}
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-[10px] text-white/70 mb-2 tracking-wider">최근 이벤트</div>
          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {milestones.slice(-5).reverse().map((milestone, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-xs"
              >
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full ${
                    milestone.type === 'buy'
                      ? 'bg-v64-success/20 text-v64-success'
                      : milestone.type === 'sell'
                      ? 'bg-v64-danger/20 text-v64-danger'
                      : 'bg-celestial-gold/20 text-celestial-gold'
                  }`}
                >
                  <i
                    className={`fas ${
                      milestone.type === 'buy'
                        ? 'fa-arrow-up'
                        : milestone.type === 'sell'
                        ? 'fa-arrow-down'
                        : 'fa-coins'
                    } text-[10px]`}
                    aria-hidden="true"
                  />
                </span>
                <span className="text-white/70 flex-1">{milestone.description}</span>
                <span className="text-white/60">{milestone.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
