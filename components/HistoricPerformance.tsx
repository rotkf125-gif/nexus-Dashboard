'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { loadSnapshots } from '@/lib/storage';
import { HistoricPeriod, PortfolioSnapshot } from '@/lib/types';
import { useNexus } from '@/lib/context';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  defaultPeriod?: HistoricPeriod;
}

export default function HistoricPerformance({ defaultPeriod = '24h' }: Props) {
  const { state } = useNexus();
  const [period, setPeriod] = useState<HistoricPeriod>(defaultPeriod);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // 기간별 limit 계산
  const getPeriodLimit = (p: HistoricPeriod): number => {
    switch (p) {
      case '24h': return 48;    // 30분 * 48 = 24시간
      case '1w': return 336;    // 30분 * 336 = 7일
      case '1m': return 1440;   // 30분 * 1440 = 30일
      default: return 48;
    }
  };

  // 스냅샷 로드
  useEffect(() => {
    const fetchSnapshots = async () => {
      setIsLoading(true);
      const limit = getPeriodLimit(period);
      const data = await loadSnapshots(limit);
      setSnapshots(data);
      setIsLoading(false);
    };

    fetchSnapshots();
  }, [period]);

  // 기간에 맞는 스냅샷 필터링
  const filteredSnapshots = useMemo(() => {
    if (snapshots.length === 0) return [];

    const now = new Date();
    const cutoffMs = {
      '24h': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1m': 30 * 24 * 60 * 60 * 1000,
    }[period];

    const cutoff = new Date(now.getTime() - cutoffMs);

    return snapshots
      .filter(s => new Date(s.timestamp) >= cutoff)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [snapshots, period]);

  // 변화량 계산
  const performanceStats = useMemo(() => {
    if (filteredSnapshots.length < 2) {
      return {
        valueChange: 0,
        valueChangePct: 0,
        returnChange: 0,
        startValue: 0,
        endValue: 0,
      };
    }

    const first = filteredSnapshots[0];
    const last = filteredSnapshots[filteredSnapshots.length - 1];

    const valueChange = last.total_value - first.total_value;
    const valueChangePct = first.total_value > 0
      ? (valueChange / first.total_value) * 100
      : 0;
    const returnChange = last.return_pct - first.return_pct;

    return {
      valueChange,
      valueChangePct,
      returnChange,
      startValue: first.total_value,
      endValue: last.total_value,
    };
  }, [filteredSnapshots]);

  // 차트 그리기
  useEffect(() => {
    if (!chartRef.current || filteredSnapshots.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // 기존 차트 제거
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // 라벨 포맷팅
    const formatLabel = (timestamp: string) => {
      const date = new Date(timestamp);
      if (period === '24h') {
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      } else if (period === '1w') {
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit' });
      } else {
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      }
    };

    const labels = filteredSnapshots.map(s => formatLabel(s.timestamp));
    const valueData = filteredSnapshots.map(s => s.total_value);
    const returnData = filteredSnapshots.map(s => s.return_pct);

    // 그라데이션 생성
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(96, 165, 250, 0.3)');
    gradient.addColorStop(1, 'rgba(96, 165, 250, 0.0)');

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Value',
            data: valueData,
            borderColor: 'rgba(96, 165, 250, 1)',
            backgroundColor: gradient,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: 'rgba(96, 165, 250, 1)',
            tension: 0.3,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'Return %',
            data: returnData,
            borderColor: 'rgba(255, 215, 0, 0.8)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: 'rgba(255, 215, 0, 1)',
            tension: 0.3,
            fill: false,
            yAxisID: 'y1',
            borderDash: [5, 5],
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
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.5)',
              font: { size: 9 },
              maxTicksLimit: period === '24h' ? 8 : period === '1w' ? 7 : 10,
              maxRotation: 0,
            },
          },
          y: {
            position: 'left',
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: 'rgba(96, 165, 250, 0.8)',
              font: { size: 9 },
              callback: (value) => `$${Number(value).toLocaleString()}`,
            },
          },
          y1: {
            position: 'right',
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              color: 'rgba(255, 215, 0, 0.8)',
              font: { size: 9 },
              callback: (value) => `${Number(value).toFixed(1)}%`,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(10, 15, 41, 0.95)',
            titleColor: 'rgba(255, 255, 255, 0.9)',
            bodyColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: (ctx) => {
                const value = ctx.parsed.y ?? 0;
                if (ctx.dataset.label === 'Total Value') {
                  return `Value: $${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
                return `Return: ${value.toFixed(2)}%`;
              },
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
  }, [filteredSnapshots, period]);

  const periodTabs: { id: HistoricPeriod; label: string }[] = [
    { id: '24h', label: '24H' },
    { id: '1w', label: '1W' },
    { id: '1m', label: '1M' },
  ];

  // 현재 포트폴리오 값 (실시간)
  const currentStats = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    state.assets.forEach(a => {
      totalValue += a.qty * a.price;
      totalCost += a.qty * a.avg;
    });
    const returnPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
    return { totalValue, totalCost, returnPct };
  }, [state.assets]);

  return (
    <div className="glass-card p-5 flex flex-col" style={{ height: '420px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <i className="fas fa-chart-area text-celestial-cyan" />
          <h3 className="font-display text-sm tracking-widest text-white/90">HISTORIC PERFORMANCE</h3>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-1">
          {periodTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-3 py-1 text-[9px] tracking-widest rounded transition-all ${
                period === tab.id
                  ? 'bg-celestial-cyan/20 text-celestial-cyan border border-celestial-cyan/30'
                  : 'text-white/40 hover:text-white/70 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3 mb-3 flex-shrink-0">
        <div className="inner-glass p-2.5 rounded-lg text-center">
          <div className="text-[8px] opacity-40 tracking-widest mb-0.5">CURRENT VALUE</div>
          <div className="text-sm font-display text-celestial-cyan">
            ${currentStats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="inner-glass p-2.5 rounded-lg text-center">
          <div className="text-[8px] opacity-40 tracking-widest mb-0.5">CURRENT RETURN</div>
          <div className={`text-sm font-display ${
            currentStats.returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger'
          }`}>
            {currentStats.returnPct >= 0 ? '+' : ''}{currentStats.returnPct.toFixed(2)}%
          </div>
        </div>
        <div className="inner-glass p-2.5 rounded-lg text-center">
          <div className="text-[8px] opacity-40 tracking-widest mb-0.5">{period.toUpperCase()} CHANGE</div>
          <div className={`text-sm font-display ${
            performanceStats.valueChange >= 0 ? 'text-v64-success' : 'text-v64-danger'
          }`}>
            {performanceStats.valueChange >= 0 ? '+' : ''}${Math.abs(performanceStats.valueChange).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="inner-glass p-2.5 rounded-lg text-center">
          <div className="text-[8px] opacity-40 tracking-widest mb-0.5">{period.toUpperCase()} %</div>
          <div className={`text-sm font-display ${
            performanceStats.valueChangePct >= 0 ? 'text-v64-success' : 'text-v64-danger'
          }`}>
            {performanceStats.valueChangePct >= 0 ? '+' : ''}{performanceStats.valueChangePct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative flex-1 min-h-0 mb-3">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white/40 text-sm">
              <i className="fas fa-spinner fa-spin mr-2" />
              Loading...
            </div>
          </div>
        ) : filteredSnapshots.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/40">
              <i className="fas fa-database text-2xl mb-2 opacity-30" />
              <div className="text-[10px]">스냅샷 데이터가 없습니다</div>
              <div className="text-[9px] opacity-50 mt-1">30분마다 자동으로 저장됩니다</div>
            </div>
          </div>
        ) : (
          <canvas ref={chartRef} />
        )}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 pt-2 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-0.5 bg-blue-400 rounded" />
          <span className="text-[8px] text-white/50">Total Value (USD)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-0.5 bg-celestial-gold rounded border-dashed" style={{ borderStyle: 'dashed' }} />
          <span className="text-[8px] text-white/50">Return %</span>
        </div>
      </div>
    </div>
  );
}
