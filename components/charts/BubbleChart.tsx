'use client';

import { useRef, useEffect, useState } from 'react';
import {
  Chart,
  BubbleController,
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { BubbleDataPoint, BubbleColorMode } from '@/lib/types';
import { useBubbleChartData } from '@/lib/hooks/useBubbleChartData';
import { useNexus } from '@/lib/context';

Chart.register(BubbleController, PointElement, LinearScale, Tooltip, Legend);

const COLOR_MODE_OPTIONS: { value: BubbleColorMode; label: string }[] = [
  { value: 'sector', label: '섹터별' },
  { value: 'type', label: '유형별' },
  { value: 'performance', label: '성과별' },
];

interface BubbleChartProps {
  onBubbleClick?: (ticker: string) => void;
}

export default function BubbleChart({ onBubbleClick }: BubbleChartProps) {
  const { state } = useNexus();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [colorMode, setColorMode] = useState<BubbleColorMode>('sector');

  const bubbleData = useBubbleChartData(state.assets, colorMode);

  useEffect(() => {
    if (!chartRef.current || bubbleData.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bubble',
      data: {
        datasets: [{
          label: '자산 분포',
          data: bubbleData.map(d => ({
            x: d.x,
            y: d.y,
            r: d.r,
            // 커스텀 데이터 저장
            ticker: d.ticker,
            sector: d.sector,
            type: d.type,
            value: d.value,
            returnPct: d.returnPct,
          })) as any,
          backgroundColor: bubbleData.map(d => d.color),
          borderColor: bubbleData.map(d => {
            // INCOME 타입은 테두리만
            if (d.type === 'INCOME') {
              return d.color.replace(/[\d.]+\)$/, '1)');
            }
            return 'transparent';
          }),
          borderWidth: bubbleData.map(d => d.type === 'INCOME' ? 2 : 0),
          hoverBackgroundColor: bubbleData.map(d =>
            d.color.replace(/[\d.]+\)$/, '0.9)')
          ),
          hoverBorderColor: '#fff',
          hoverBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          intersect: true,
        },
        onClick: (event, elements) => {
          if (elements.length > 0 && onBubbleClick) {
            const dataIndex = elements[0].index;
            const ticker = bubbleData[dataIndex]?.ticker;
            if (ticker) onBubbleClick(ticker);
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10, 15, 41, 0.95)',
            titleFont: { family: 'Montserrat', size: 13, weight: 'bold' as const },
            bodyFont: { family: 'JetBrains Mono', size: 11 },
            titleColor: 'rgba(255, 255, 255, 0.95)',
            bodyColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
            padding: 14,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (ctx) => {
                const raw = ctx[0].raw as any;
                return raw.ticker || '';
              },
              label: (ctx) => {
                const raw = ctx.raw as any;
                return [
                  `섹터: ${raw.sector}`,
                  `비중: ${raw.x?.toFixed(1)}%`,
                  `수익률: ${raw.y >= 0 ? '+' : ''}${raw.y?.toFixed(1)}%`,
                  `금액: $${raw.value?.toLocaleString()}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: '비중 (%)',
              color: 'rgba(255, 255, 255, 0.5)',
              font: { size: 10 },
            },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: 'rgba(255, 255, 255, 0.5)',
              font: { size: 10 },
              callback: (value) => `${value}%`,
            },
            min: 0,
          },
          y: {
            title: {
              display: true,
              text: '수익률 (%)',
              color: 'rgba(255, 255, 255, 0.5)',
              font: { size: 10 },
            },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: 'rgba(255, 255, 255, 0.5)',
              font: { size: 10 },
              callback: (value) => `${Number(value) >= 0 ? '+' : ''}${value}%`,
            },
          },
        },
      },
    });

    return () => {
      chartInstance.current?.destroy();
      chartInstance.current = null;
    };
  }, [bubbleData, onBubbleClick]);

  if (state.assets.length === 0) {
    return (
      <div className="inner-glass p-4 rounded-lg">
        <div className="h-[300px] flex items-center justify-center text-white/50 text-sm">
          <div className="text-center">
            <i className="fas fa-chart-scatter text-3xl mb-2 opacity-30" aria-hidden="true" />
            <div>자산을 추가하세요</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inner-glass p-4 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display tracking-widest text-white flex items-center gap-2">
          <i className="fas fa-chart-scatter text-celestial-cyan text-xs" aria-hidden="true" />
          자산 분포
        </h3>
      </div>

      {/* Chart */}
      <div className="bubble-chart-container">
        <canvas ref={chartRef} />
      </div>

      {/* Color Mode Tabs */}
      <div className="bubble-chart-tabs mt-3">
        {COLOR_MODE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setColorMode(option.value)}
            className={`bubble-chart-tab ${colorMode === option.value ? 'active' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      {colorMode === 'performance' && (
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-white/50">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-v64-success/60" />
            수익
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-v64-danger/60" />
            손실
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full border border-white/30" />
            INCOME
          </span>
        </div>
      )}
    </div>
  );
}
