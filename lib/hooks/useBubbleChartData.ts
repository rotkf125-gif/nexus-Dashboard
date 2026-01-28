'use client';

import { useMemo } from 'react';
import { Asset, AssetType, BubbleDataPoint, BubbleColorMode } from '@/lib/types';
import { SECTORS, TYPE_COLORS } from '@/lib/config';

/**
 * 버블 차트 데이터 변환 훅
 * 자산 배열을 버블 차트 데이터 포인트로 변환
 */
export function useBubbleChartData(
  assets: Asset[],
  colorMode: BubbleColorMode
): BubbleDataPoint[] {
  return useMemo(() => {
    if (!assets || assets.length === 0) return [];

    // 같은 티커를 하나로 병합
    const merged: Record<string, {
      asset: Asset;
      totalValue: number;
      totalCost: number;
      totalQty: number;
    }> = {};

    assets.forEach(asset => {
      const value = asset.qty * asset.price;
      const cost = asset.qty * asset.avg;

      if (!merged[asset.ticker]) {
        merged[asset.ticker] = {
          asset: { ...asset },
          totalValue: value,
          totalCost: cost,
          totalQty: asset.qty,
        };
      } else {
        merged[asset.ticker].totalValue += value;
        merged[asset.ticker].totalCost += cost;
        merged[asset.ticker].totalQty += asset.qty;
      }
    });

    const mergedAssets = Object.values(merged);
    const totalValue = mergedAssets.reduce((sum, m) => sum + m.totalValue, 0);
    if (totalValue === 0) return [];

    const maxValue = Math.max(...mergedAssets.map(m => m.totalValue));
    const minRadius = 8;
    const maxRadius = 30;

    return mergedAssets.map((m) => {
      const { asset, totalValue: value, totalCost: cost } = m;
      const weight = (value / totalValue) * 100;
      const returnPct = cost > 0 ? ((value - cost) / cost) * 100 : 0;

      // 버블 크기: 투자금액에 비례
      const scaledRadius = minRadius + (value / maxValue) * (maxRadius - minRadius);

      // 색상 모드별 색상 결정
      let color: string;
      switch (colorMode) {
        case 'sector':
          color = SECTORS[asset.sector]?.color || '#90A4AE';
          break;
        case 'type':
          color = TYPE_COLORS[asset.type] || '#90A4AE';
          break;
        case 'performance':
          // 성과 기반 색상: 손실(-50%)은 빨강, 수익(+50%)은 초록
          const normalized = Math.max(-50, Math.min(50, returnPct));
          if (normalized >= 0) {
            const ratio = normalized / 50;
            // 초록색 계열 (투명도 + 채도 조절)
            const alpha = 0.4 + ratio * 0.6;
            color = `rgba(129, 199, 132, ${alpha})`;
          } else {
            const ratio = Math.abs(normalized) / 50;
            // 빨간색 계열
            const alpha = 0.4 + ratio * 0.6;
            color = `rgba(229, 115, 115, ${alpha})`;
          }
          break;
        default:
          color = '#90A4AE';
      }

      return {
        x: weight,
        y: returnPct,
        r: scaledRadius,
        ticker: asset.ticker,
        sector: asset.sector,
        type: asset.type,
        value,
        cost,
        returnPct,
        color,
      };
    });
  }, [assets, colorMode]);
}

/**
 * 성과 기반 색상 반환 (외부 사용)
 */
export function getPerformanceColor(returnPct: number): string {
  if (returnPct >= 20) return '#4CAF50';
  if (returnPct >= 10) return '#81C784';
  if (returnPct >= 0) return '#A5D6A7';
  if (returnPct >= -10) return '#FFCDD2';
  if (returnPct >= -20) return '#EF9A9A';
  return '#E57373';
}

export default useBubbleChartData;
