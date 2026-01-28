'use client';

import { useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { useNexus } from '@/lib/context';
import { CHART_COLORS } from '@/lib/config';

interface HeatmapItem {
  name: string;
  ticker: string;
  size: number;
  value: number;
  cost: number;
  returnPct: number;
  weight: number;
  fill: string;
}

// 수익률 기반 색상 계산
const getReturnColor = (returnPct: number = 0): string => {
  if (returnPct >= 30) return '#15803d';  // 진한 녹색
  if (returnPct >= 20) return '#16a34a';
  if (returnPct >= 10) return '#22c55e';
  if (returnPct >= 5) return '#4ade80';
  if (returnPct >= 0) return '#86efac';
  if (returnPct >= -5) return '#fca5a5';
  if (returnPct >= -10) return '#f87171';
  if (returnPct >= -20) return '#ef4444';
  return '#dc2626';  // 진한 빨강
};

// 커스텀 TreeMap 콘텐츠
const CustomContent = (props: any) => {
  const { x, y, width, height, name, ticker, returnPct, weight } = props;
  const safeReturnPct = typeof returnPct === 'number' ? returnPct : 0;
  const safeWeight = typeof weight === 'number' ? weight : 0;

  if (width < 40 || height < 30) {
    // 너무 작은 셀은 티커만 표시
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={getReturnColor(safeReturnPct)}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={1}
          rx={2}
        />
        {width > 25 && height > 15 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize={Math.min(10, width / 4)}
            fontWeight="bold"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
          >
            {ticker}
          </text>
        )}
      </g>
    );
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={getReturnColor(safeReturnPct)}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={1}
        rx={4}
        style={{ transition: 'all 0.3s ease' }}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize={Math.min(14, width / 5)}
        fontWeight="bold"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
      >
        {ticker}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.95)"
        fontSize={Math.min(11, width / 6)}
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
      >
        {safeReturnPct >= 0 ? '+' : ''}{safeReturnPct.toFixed(1)}%
      </text>
      {height > 50 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 22}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.8)"
          fontSize={Math.min(9, width / 7)}
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
        >
          {safeWeight.toFixed(1)}%
        </text>
      )}
    </g>
  );
};

// 커스텀 툴팁
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  // 데이터 안전성 확보
  const returnPct = typeof data.returnPct === 'number' ? data.returnPct : 0;
  const weight = typeof data.weight === 'number' ? data.weight : 0;
  const value = typeof data.value === 'number' ? data.value : 0;
  const cost = typeof data.cost === 'number' ? data.cost : 0;
  const profit = value - cost;

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm p-3 rounded-lg border border-white/20 shadow-2xl z-50">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
        <span className="font-bold text-lg text-white drop-shadow-md">{data.ticker}</span>
        <span className={`text-sm font-bold px-1.5 py-0.5 rounded ${returnPct >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
        </span>
      </div>
      <div className="space-y-1.5 text-xs font-medium">
        <div className="flex justify-between gap-6 items-center">
          <span className="text-gray-400">비중</span>
          <span className="text-white font-bold">{weight.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between gap-6 items-center">
          <span className="text-gray-400">평가금</span>
          <span className="text-white text-sm">${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between gap-6 items-center">
          <span className="text-gray-400">손익</span>
          <span className={`text-sm ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {profit >= 0 ? '+' : ''}${Math.abs(profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function PortfolioHeatmap() {
  const { state } = useNexus();
  const { assets } = state;

  const heatmapData = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    if (totalValue === 0) return [];

    return assets
      .map(asset => {
        const value = asset.qty * asset.price;
        const cost = asset.qty * asset.avg;
        const returnPct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
        const weight = (value / totalValue) * 100;

        return {
          name: asset.ticker,
          ticker: asset.ticker,
          size: value,
          value,
          cost,
          returnPct,
          weight,
          fill: getReturnColor(returnPct),
        };
      })
      .filter(item => item.size > 0)
      .sort((a, b) => b.size - a.size);
  }, [assets]);

  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-white/70">
        <div className="text-center">
          <i className="fas fa-th-large text-4xl mb-3 opacity-30" />
          <div className="text-sm">자산을 추가하면 히트맵이 표시됩니다</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 text-[10px]">
        <span className="text-white/60">수익률:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#dc2626' }} />
          <span className="text-white/60">-20%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#f87171' }} />
          <span className="text-white/60">-10%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#fca5a5' }} />
          <span className="text-white/60">-5%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#86efac' }} />
          <span className="text-white/60">0%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#22c55e' }} />
          <span className="text-white/60">+10%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#15803d' }} />
          <span className="text-white/60">+30%</span>
        </div>
      </div>

      {/* 히트맵 */}
      <div className="h-[500px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={heatmapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="rgba(0,0,0,0.2)"
            content={<CustomContent />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {heatmapData.slice(0, 4).map((item, i) => (
          <div key={item.ticker} className="inner-glass p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="text-sm font-medium text-white">{item.ticker}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/60">{item.weight.toFixed(1)}%</span>
              <span className={item.returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger'}>
                {item.returnPct >= 0 ? '+' : ''}{item.returnPct.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}