'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useNexus } from '@/lib/context';
import { SECTORS, CHART_COLORS } from '@/lib/config';
import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip);

interface SidebarProps {
  horizontal?: boolean;
}

export default function Sidebar({ horizontal = false }: SidebarProps) {
  const { state } = useNexus();
  const { assets } = state;
  const sectorChartRef = useRef<HTMLCanvasElement>(null);
  const sectorChartInstance = useRef<Chart | null>(null);

  // 계산된 값들 - assets만 의존
  const calculations = useMemo(() => {
    // 총 가치
    const totalValue = assets.reduce((sum, a) => sum + (a.qty * a.price), 0);

    // Weight별 정렬
    const assetWeights = assets
      .map(a => ({
        ticker: a.ticker,
        value: a.qty * a.price,
        weight: totalValue > 0 ? (a.qty * a.price / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.weight - a.weight);

    // 섹터별 집계
    const sectorData: { [key: string]: { value: number, return: number } } = {};
    assets.forEach(a => {
      const sector = a.sector || 'Other';
      const value = a.qty * a.price;
      const cost = a.qty * a.avg;
      const ret = cost > 0 ? ((value - cost) / cost) * 100 : 0;

      if (!sectorData[sector]) {
        sectorData[sector] = { value: 0, return: 0 };
      }
      sectorData[sector].value += value;
      sectorData[sector].return = ret;
    });

    const sectors = Object.entries(sectorData)
      .map(([name, data]) => ({
        name,
        value: data.value,
        weight: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
        return: data.return,
        emoji: SECTORS[name]?.emoji || '📦',
      }))
      .sort((a, b) => b.weight - a.weight);

    // Type 분포 (CORE vs INCOME)
    const coreValue = assets.filter(a => a.type !== 'INCOME').reduce((s, a) => s + a.qty * a.price, 0);
    const incomeValue = assets.filter(a => a.type === 'INCOME').reduce((s, a) => s + a.qty * a.price, 0);

    // Top 3 / Bottom 3
    const sorted = assets
      .map(a => {
        const value = a.qty * a.price;
        const cost = a.qty * a.avg;
        const returnPct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
        return { ticker: a.ticker, returnPct };
      })
      .sort((a, b) => b.returnPct - a.returnPct);

    const top3 = sorted.slice(0, 3);
    const bottom3 = sorted.slice(-3).reverse();

    return {
      totalValue,
      assetWeights,
      sectors,
      coreValue,
      incomeValue,
      corePct: totalValue > 0 ? (coreValue / totalValue) * 100 : 0,
      incomePct: totalValue > 0 ? (incomeValue / totalValue) * 100 : 0,
      top3,
      bottom3,
      assetCount: assets.length,
      sectorCount: Object.keys(sectorData).length,
    };
  }, [assets]);

  // Sector 데이터만 별도 메모이제이션
  const sectorChartData = useMemo(() => ({
    labels: calculations.sectors.map(s => s.name),
    values: calculations.sectors.map(s => s.value),
    total: calculations.totalValue,
  }), [calculations.sectors, calculations.totalValue]);

  // Sector Chart - 데이터 업데이트만
  useEffect(() => {
    if (!sectorChartRef.current) return;

    // 차트가 없으면 생성
    if (!sectorChartInstance.current) {
      sectorChartInstance.current = new Chart(sectorChartRef.current, {
        type: 'doughnut',
        data: {
          labels: sectorChartData.labels,
          datasets: [{
            data: sectorChartData.values,
            backgroundColor: CHART_COLORS.slice(0, sectorChartData.labels.length),
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          animation: false, // 애니메이션 비활성화로 깜빡임 방지
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(10, 15, 41, 0.9)',
              callbacks: {
                label: (ctx) => {
                  const total = sectorChartData.total || 1;
                  return `${ctx.label}: ${ctx.parsed.toFixed(0)} (${((ctx.parsed / total) * 100).toFixed(1)}%)`;
                },
              },
            },
          },
        },
      });
    } else {
      // 기존 차트 데이터만 업데이트
      sectorChartInstance.current.data.labels = sectorChartData.labels;
      sectorChartInstance.current.data.datasets[0].data = sectorChartData.values;
      sectorChartInstance.current.data.datasets[0].backgroundColor = CHART_COLORS.slice(0, sectorChartData.labels.length);
      sectorChartInstance.current.update('none'); // 애니메이션 없이 업데이트
    }

    return () => {
      // 컴포넌트 언마운트 시에만 destroy
    };
  }, [sectorChartData]);

  // 컴포넌트 언마운트 시 차트 정리
  useEffect(() => {
    return () => {
      if (sectorChartInstance.current) {
        sectorChartInstance.current.destroy();
        sectorChartInstance.current = null;
      }
    };
  }, []);

  // 가로 레이아웃
  if (horizontal) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* WEIGHT BARS */}
        <div className="inner-glass p-3 rounded">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] tracking-widest opacity-60">PORTFOLIO WEIGHT</span>
            <span className="text-[9px] opacity-40">{calculations.assetCount} ASSETS</span>
          </div>
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
            {calculations.assetWeights.map((item, i) => (
              <div key={item.ticker} className="flex items-center gap-2">
                <span className="text-[10px] w-12 truncate">{item.ticker}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${item.weight}%`,
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                </div>
                <span className="text-[9px] w-10 text-right opacity-60">
                  {item.weight.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTOR ANALYSIS */}
        <div className="inner-glass p-3 rounded">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] tracking-widest opacity-60 flex items-center gap-1">
              <i className="fas fa-chart-pie text-celestial-purple text-[8px]" /> SECTOR
            </span>
            <span className="text-[9px] opacity-40">{calculations.sectorCount} SECTORS</span>
          </div>
          <div className="flex gap-3">
            <div style={{ width: 80, height: 80 }}>
              <canvas ref={sectorChartRef} />
            </div>
            <div className="flex-1 space-y-1 max-h-[80px] overflow-y-auto custom-scrollbar text-[9px]">
              {calculations.sectors.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="opacity-70">{s.emoji} {s.name}</span>
                  </div>
                  <span className="opacity-50">{s.weight.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TYPE + RANKINGS Combined */}
        <div className="inner-glass p-3 rounded">
          <div className="text-[9px] tracking-widest opacity-60 mb-2">TYPE DISTRIBUTION</div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="inner-glass p-2 text-center rounded border border-white/5">
              <div className="text-[8px] opacity-40 tracking-widest">CORE</div>
              <div className="text-sm font-display">
                ${calculations.coreValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[9px] opacity-50">{calculations.corePct.toFixed(1)}%</div>
            </div>
            <div className="inner-glass p-2 text-center rounded border border-celestial-gold/20">
              <div className="text-[8px] text-celestial-gold/60 tracking-widest">INCOME</div>
              <div className="text-sm font-display text-celestial-gold">
                ${calculations.incomeValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[9px] text-celestial-gold">{calculations.incomePct.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* TOP/BOTTOM 3 RANKINGS */}
        <div className="inner-glass p-3 rounded">
          <div className="flex gap-3">
            <div className="ranking-section flex-1">
              <div className="ranking-title text-[9px]">
                <i className="fas fa-trophy text-celestial-gold" /> TOP 3
              </div>
              <div className="space-y-1">
                {calculations.top3.length > 0 ? (
                  calculations.top3.map((item) => (
                    <div key={item.ticker} className="ranking-item flex justify-between text-[9px]">
                      <span>{item.ticker}</span>
                      <span className="text-v64-success">+{item.returnPct.toFixed(1)}%</span>
                    </div>
                  ))
                ) : (
                  <div className="ranking-item text-white/30 text-[9px]">--</div>
                )}
              </div>
            </div>
            <div className="ranking-section flex-1">
              <div className="ranking-title text-[9px]">
                <i className="fas fa-exclamation-triangle text-v64-danger" /> BOTTOM 3
              </div>
              <div className="space-y-1">
                {calculations.bottom3.length > 0 ? (
                  calculations.bottom3.map((item) => (
                    <div key={item.ticker} className="ranking-item flex justify-between text-[9px]">
                      <span>{item.ticker}</span>
                      <span className={item.returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger'}>
                        {item.returnPct >= 0 ? '+' : ''}{item.returnPct.toFixed(1)}%
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="ranking-item text-white/30 text-[9px]">--</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 세로 레이아웃 (기존)
  return (
    <div className="space-y-4">
      {/* WEIGHT BARS */}
      <div className="inner-glass p-3 rounded">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] tracking-widest opacity-60">PORTFOLIO WEIGHT</span>
          <span className="text-[9px] opacity-40">{calculations.assetCount} ASSETS</span>
        </div>
        <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar">
          {calculations.assetWeights.map((item, i) => (
            <div key={item.ticker} className="flex items-center gap-2">
              <span className="text-[10px] w-12 truncate">{item.ticker}</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${item.weight}%`,
                    backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                  }}
                />
              </div>
              <span className="text-[9px] w-10 text-right opacity-60">
                {item.weight.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTOR ANALYSIS */}
      <div className="inner-glass p-3 rounded">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] tracking-widest opacity-60 flex items-center gap-1">
            <i className="fas fa-chart-pie text-celestial-purple text-[8px]" /> SECTOR
          </span>
          <span className="text-[9px] opacity-40">{calculations.sectorCount} SECTORS</span>
        </div>
        <div className="flex gap-3">
          <div style={{ width: 100, height: 100 }}>
            <canvas ref={sectorChartRef} />
          </div>
          <div className="flex-1 space-y-1 max-h-[100px] overflow-y-auto custom-scrollbar text-[10px]">
            {calculations.sectors.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="opacity-70">{s.emoji} {s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="opacity-50">{s.weight.toFixed(0)}%</span>
                  <span className={s.return >= 0 ? 'text-v64-success' : 'text-v64-danger'}>
                    {s.return >= 0 ? '+' : ''}{s.return.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TYPE DISTRIBUTION */}
      <div className="grid grid-cols-2 gap-2">
        <div className="inner-glass p-2 text-center rounded border border-white/5">
          <div className="text-[8px] opacity-40 tracking-widest">CORE</div>
          <div className="text-sm font-display">
            ${calculations.coreValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[9px] opacity-50">{calculations.corePct.toFixed(1)}%</div>
        </div>
        <div className="inner-glass p-2 text-center rounded border border-celestial-gold/20">
          <div className="text-[8px] text-celestial-gold/60 tracking-widest">INCOME</div>
          <div className="text-sm font-display text-celestial-gold">
            ${calculations.incomeValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[9px] text-celestial-gold">{calculations.incomePct.toFixed(1)}%</div>
        </div>
      </div>

      {/* TOP/BOTTOM 3 RANKINGS */}
      <div className="flex gap-3">
        <div className="ranking-section flex-1">
          <div className="ranking-title">
            <i className="fas fa-trophy text-celestial-gold" /> TOP 3
          </div>
          <div className="space-y-1">
            {calculations.top3.length > 0 ? (
              calculations.top3.map((item) => (
                <div key={item.ticker} className="ranking-item flex justify-between">
                  <span>{item.ticker}</span>
                  <span className="text-v64-success">+{item.returnPct.toFixed(1)}%</span>
                </div>
              ))
            ) : (
              <div className="ranking-item text-white/30">--</div>
            )}
          </div>
        </div>
        <div className="ranking-section flex-1">
          <div className="ranking-title">
            <i className="fas fa-exclamation-triangle text-v64-danger" /> BOTTOM 3
          </div>
          <div className="space-y-1">
            {calculations.bottom3.length > 0 ? (
              calculations.bottom3.map((item) => (
                <div key={item.ticker} className="ranking-item flex justify-between">
                  <span>{item.ticker}</span>
                  <span className={item.returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger'}>
                    {item.returnPct >= 0 ? '+' : ''}{item.returnPct.toFixed(1)}%
                  </span>
                </div>
              ))
            ) : (
              <div className="ranking-item text-white/30">--</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
