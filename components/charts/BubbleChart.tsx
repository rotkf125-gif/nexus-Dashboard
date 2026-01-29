'use client';

import { useRef, useEffect } from 'react';
import {
  Chart,
  BubbleController,
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { useBubbleChartData } from '@/lib/hooks/useBubbleChartData';
import { useNexus } from '@/lib/context';

Chart.register(BubbleController, PointElement, LinearScale, Tooltip, Legend);

// 0% 기준선 플러그인
const zeroLinePlugin = {
  id: 'zeroLine',
  afterDraw: (chart: Chart) => {
    const ctx = chart.ctx;
    const yScale = chart.scales.y;
    const xScale = chart.scales.x;

    if (!yScale || !xScale) return;

    const yZero = yScale.getPixelForValue(0);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xScale.left, yZero);
    ctx.lineTo(xScale.right, yZero);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();

    // 0% 레이블
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText('0%', xScale.left + 4, yZero - 4);
    ctx.restore();
  },
};

// 버블 내부 티커 레이블 플러그인
const bubbleLabelPlugin = {
  id: 'bubbleLabel',
  afterDatasetsDraw: (chart: Chart) => {
    const ctx = chart.ctx;
    const meta = chart.getDatasetMeta(0);

    if (!meta || !meta.data) return;

    ctx.save();
    meta.data.forEach((element: any, index: number) => {
      const dataPoint = chart.data.datasets[0].data[index] as any;
      if (!dataPoint?.ticker) return;

      const { x, y } = element;
      const r = dataPoint.r || 10;

      // 버블 크기에 따라 폰트 크기 조절 (최소 7px, 최대 11px)
      const fontSize = Math.max(7, Math.min(11, r * 0.45));

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = `bold ${fontSize}px JetBrains Mono`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 그림자 효과
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;

      ctx.fillText(dataPoint.ticker, x, y);
    });
    ctx.restore();
  },
};

interface BubbleChartProps {
  onBubbleClick?: (ticker: string) => void;
}

export default function BubbleChart({ onBubbleClick }: BubbleChartProps) {
  const { state } = useNexus();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // 항상 성과별(performance) 모드 사용
  const bubbleData = useBubbleChartData(state.assets, 'performance');

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
            return 'rgba(255, 255, 255, 0.3)';
          }),
          borderWidth: bubbleData.map(d => d.type === 'INCOME' ? 2 : 1),
          hoverBackgroundColor: bubbleData.map(d =>
            d.color.replace(/[\d.]+\)$/, '0.9)')
          ),
          hoverBorderColor: '#fff',
          hoverBorderWidth: 2,
        }],
      },
      plugins: [zeroLinePlugin, bubbleLabelPlugin],
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
            grid: {
              color: (context) => {
                // 0% 라인은 기준선 플러그인이 그리므로 기본 그리드에서 제외
                if (context.tick.value === 0) {
                  return 'transparent';
                }
                return 'rgba(255, 255, 255, 0.05)';
              },
            },
            ticks: {
              color: (context) => {
                // 0% 라인은 강조 색상
                if (context.tick.value === 0) {
                  return 'rgba(255, 255, 255, 0.7)';
                }
                return 'rgba(255, 255, 255, 0.5)';
              },
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
        <div className="h-[300px] flex items-center justify-center text-white/70 text-sm">
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

      {/* Legend - 성과별 (항상 표시) */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-white/70">
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
        <span className="flex items-center gap-1 ml-2 pl-2 border-l border-white/20">
          <span className="w-[1px] h-3 border-t border-dashed border-white/50" style={{ width: '12px' }} />
          0% 기준선
        </span>
      </div>
    </div>
  );
}
