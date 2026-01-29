'use client';

import { useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { SECTORS } from '@/lib/config';
import { ETF_SECTOR_DATA } from '@/lib/market-data';

interface HealthAlert {
  type: 'concentration' | 'sector' | 'vix';
  severity: 'warning' | 'danger';
  title: string;
  message: string;
  value: number;
  threshold: number;
}

export default function PortfolioHealthAlert() {
  const { state } = useNexus();
  const { assets, market } = state;

  const alerts = useMemo((): HealthAlert[] => {
    if (assets.length === 0) return [];

    const alertList: HealthAlert[] = [];
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    if (totalValue === 0) return [];

    // 1. 단일 자산 집중도 체크 (30% 이상)
    assets.forEach(asset => {
      const weight = (asset.qty * asset.price) / totalValue;
      if (weight >= 0.30) {
        alertList.push({
          type: 'concentration',
          severity: weight >= 0.40 ? 'danger' : 'warning',
          title: '집중 위험',
          message: `${asset.ticker}이(가) 포트폴리오의 ${(weight * 100).toFixed(1)}%를 차지합니다`,
          value: weight * 100,
          threshold: 30,
        });
      }
    });

    // 2. 섹터 편중 체크 (60% 이상)
    const sectorWeights: Record<string, number> = {};
    assets.forEach(asset => {
      const assetWeight = (asset.qty * asset.price) / totalValue;
      const etfSectors = ETF_SECTOR_DATA[asset.ticker];

      if (etfSectors) {
        Object.entries(etfSectors).forEach(([sector, weight]) => {
          sectorWeights[sector] = (sectorWeights[sector] || 0) + assetWeight * weight;
        });
      } else {
        const sector = asset.sector || 'Other';
        sectorWeights[sector] = (sectorWeights[sector] || 0) + assetWeight;
      }
    });

    Object.entries(sectorWeights).forEach(([sector, weight]) => {
      if (weight >= 0.60) {
        const sectorInfo = SECTORS[sector] || SECTORS.Other;
        alertList.push({
          type: 'sector',
          severity: weight >= 0.70 ? 'danger' : 'warning',
          title: '섹터 편중',
          message: `${sectorInfo.emoji} ${sectorInfo.label} 섹터가 ${(weight * 100).toFixed(1)}%입니다. 분산 투자를 고려하세요`,
          value: weight * 100,
          threshold: 60,
        });
      }
    });

    // 3. VIX 경고 (25 이상)
    if (market.vix && market.vix > 25) {
      alertList.push({
        type: 'vix',
        severity: market.vix >= 35 ? 'danger' : 'warning',
        title: 'VIX 경고',
        message: `VIX ${market.vix.toFixed(1)} - 시장 변동성이 높습니다. ${market.vix >= 35 ? '방어 모드를 고려하세요' : '현금 확보를 고려하세요'}`,
        value: market.vix,
        threshold: 25,
      });
    }

    return alertList;
  }, [assets, market.vix]);

  if (alerts.length === 0) return null;

  return (
    <div className="h-full flex flex-col justify-between gap-1.5 overflow-y-auto custom-scrollbar">
        {alerts.map((alert, index) => (
          <div
            key={`${alert.type}-${index}`}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border backdrop-blur-md transition-all ${
              alert.severity === 'danger'
                ? 'bg-v64-danger/10 border-v64-danger/40 text-v64-danger'
                : 'bg-v64-warning/10 border-v64-warning/40 text-v64-warning'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              alert.severity === 'danger' ? 'bg-v64-danger/20' : 'bg-v64-warning/20'
            }`}>
              <i className={`fas ${
                alert.type === 'concentration' ? 'fa-exclamation-triangle' :
                alert.type === 'sector' ? 'fa-chart-pie' :
                'fa-chart-line'
              } text-[10px]`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-[11px] tracking-wide">{alert.title}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                  alert.severity === 'danger' ? 'bg-v64-danger/20' : 'bg-v64-warning/20'
                }`}>
                  {alert.value.toFixed(1)}%
                </span>
              </div>
              <p className="text-[9px] opacity-80 truncate">{alert.message}</p>
            </div>
          </div>
        ))}
    </div>
  );
}
