'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useNexus } from '@/lib/context';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const TICKER_COLORS = [
  'rgba(255, 255, 255, 0.6)',   // 첫번째: 흰색
  'rgba(255, 215, 0, 1)',       // 두번째: 골드
  'rgba(129, 199, 132, 1)',     // 세번째: 녹색
  'rgba(179, 157, 219, 1)',     // 네번째: 보라
  'rgba(144, 202, 249, 1)',     // 다섯번째: 파랑
  'rgba(244, 143, 177, 1)',     // 여섯번째: 핑크
];

export default function DPSTrend() {
  const { state } = useNexus();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // INCOME 타입 자산만 필터링
  const incomeAssets = useMemo(() => 
    state.assets.filter(a => a.type === 'INCOME'),
    [state.assets]
  );

  // 티커별 DPS 데이터 준비
  const chartData = useMemo(() => {
    const tickerData: { [ticker: string]: { dates: string[], values: number[] } } = {};
    
    incomeAssets.forEach(asset => {
      const tickerDividends = state.dividends
        .filter(d => d.ticker === asset.ticker)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      tickerData[asset.ticker] = {
        dates: tickerDividends.map(d => d.date),
        values: tickerDividends.map(d => d.dps),
      };
    });

    return tickerData;
  }, [incomeAssets, state.dividends]);

  // 모든 날짜 통합 (X축)
  const allDates = useMemo(() => {
    const dates = new Set<string>();
    Object.values(chartData).forEach(data => {
      data.dates.forEach(d => dates.add(d));
    });
    return Array.from(dates).sort();
  }, [chartData]);

  // 티커별 평균 DPS
  const avgDpsByTicker = useMemo(() => {
    const result: { [ticker: string]: number } = {};
    Object.entries(chartData).forEach(([ticker, data]) => {
      if (data.values.length > 0) {
        result[ticker] = data.values.reduce((a, b) => a + b, 0) / data.values.length;
      } else {
        result[ticker] = 0;
      }
    });
    return result;
  }, [chartData]);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const datasets = Object.entries(chartData).map(([ticker, data], index) => {
      // 날짜별 DPS 매핑
      const mappedValues = allDates.map(date => {
        const idx = data.dates.indexOf(date);
        return idx >= 0 ? data.values[idx] : null;
      });

      return {
        label: ticker,
        data: mappedValues,
        borderColor: TICKER_COLORS[index % TICKER_COLORS.length],
        backgroundColor: TICKER_COLORS[index % TICKER_COLORS.length],
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
        labels: allDates.map(d => {
          const date = new Date(d);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10, 15, 41, 0.9)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleColor: 'rgba(255, 255, 255, 0.8)',
            bodyColor: 'rgba(255, 255, 255, 0.6)',
            callbacks: {
              label: (context) => `${context.dataset.label}: $${context.parsed.y?.toFixed(4) || 0}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { 
              color: 'rgba(255, 255, 255, 0.4)',
              font: { size: 9 },
              maxRotation: 45,
            },
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { 
              color: 'rgba(255, 255, 255, 0.4)',
              font: { size: 9 },
              callback: (value) => `$${Number(value).toFixed(2)}`,
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
  }, [chartData, allDates]);

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 text-[9px] font-light mb-4 flex-wrap">
        {incomeAssets.map((asset, index) => (
          <span key={asset.ticker} className="flex items-center gap-1">
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: TICKER_COLORS[index % TICKER_COLORS.length] }}
            />
            <span className="opacity-60">{asset.ticker}</span>
          </span>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height: 200 }}>
        {incomeAssets.length > 0 && state.dividends.length > 0 ? (
          <canvas ref={chartRef} />
        ) : (
          <div className="h-full flex items-center justify-center opacity-40">
            <div className="text-center">
              <i className="fas fa-chart-line text-2xl mb-2" />
              <div className="text-[11px]">
                {incomeAssets.length === 0 
                  ? 'INCOME 타입 자산이 없습니다' 
                  : '배당 기록이 없습니다'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Average DPS per Ticker */}
      <div className={`grid gap-3 mt-3 ${
        incomeAssets.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'
      }`}>
        {incomeAssets.slice(0, 6).map((asset, index) => (
          <div 
            key={asset.ticker}
            className={`inner-glass p-3 rounded text-center ${
              index % 2 === 1 ? 'border border-celestial-gold/20' : ''
            }`}
          >
            <div className={`text-[9px] tracking-widest mb-1 font-light ${
              index % 2 === 1 ? 'text-celestial-gold/50' : 'opacity-50'
            }`}>
              {asset.ticker} AVG DPS
            </div>
            <div className={`text-base font-display font-light ${
              index % 2 === 1 ? 'text-celestial-gold' : 'text-white'
            }`}>
              ${(avgDpsByTicker[asset.ticker] || 0).toFixed(4)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
