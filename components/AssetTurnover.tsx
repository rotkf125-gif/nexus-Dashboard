'use client';

import { useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { CHART_COLORS, TYPE_COLORS } from '@/lib/config';

interface TurnoverData {
  ticker: string;
  type: string;
  holdingDays: number;
  turnoverRate: number;
  avgHoldingPeriod: string;
  status: 'long-term' | 'mid-term' | 'short-term' | 'active';
  tradeReturn: number;
  totalValue: number;
}

export default function AssetTurnover() {
  const { state } = useNexus();
  const { assets, tradeSums, dividends } = state;

  // 자산별 회전율 분석
  const turnoverAnalysis = useMemo((): TurnoverData[] => {
    const now = new Date();

    return assets.map((asset, index) => {
      // 배당 기록에서 가장 오래된 날짜를 보유 시작일로 추정
      const assetDividends = dividends.filter(d => d.ticker === asset.ticker);
      let firstDate = now;

      if (assetDividends.length > 0) {
        const dates = assetDividends.map(d => new Date(d.date));
        firstDate = new Date(Math.min(...dates.map(d => d.getTime())));
      }

      const holdingDays = Math.floor((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      const tradeReturn = tradeSums[asset.ticker] || 0;
      const totalValue = asset.qty * asset.price;

      // 회전율 계산: (Trade Return / Total Value) * (365 / Holding Days)
      let turnoverRate = 0;
      if (totalValue > 0 && holdingDays > 0) {
        turnoverRate = Math.abs(tradeReturn / totalValue) * (365 / holdingDays) * 100;
      }

      // 보유 기간 상태 결정
      let status: TurnoverData['status'] = 'active';
      if (holdingDays >= 365) status = 'long-term';
      else if (holdingDays >= 180) status = 'mid-term';
      else if (holdingDays >= 30) status = 'short-term';

      // 평균 보유 기간 문자열
      let avgHoldingPeriod = '';
      if (holdingDays >= 365) {
        avgHoldingPeriod = `${Math.floor(holdingDays / 365)}년 ${Math.floor((holdingDays % 365) / 30)}개월`;
      } else if (holdingDays >= 30) {
        avgHoldingPeriod = `${Math.floor(holdingDays / 30)}개월 ${holdingDays % 30}일`;
      } else {
        avgHoldingPeriod = `${holdingDays}일`;
      }

      return {
        ticker: asset.ticker,
        type: asset.type,
        holdingDays,
        turnoverRate,
        avgHoldingPeriod,
        status,
        tradeReturn,
        totalValue,
      };
    });
  }, [assets, tradeSums, dividends]);

  // 전체 포트폴리오 통계
  const portfolioStats = useMemo(() => {
    if (turnoverAnalysis.length === 0) {
      return {
        avgHoldingDays: 0,
        avgTurnoverRate: 0,
        longTermPct: 0,
        totalTradeReturn: 0,
      };
    }

    const totalDays = turnoverAnalysis.reduce((sum, a) => sum + a.holdingDays, 0);
    const totalTurnover = turnoverAnalysis.reduce((sum, a) => sum + a.turnoverRate, 0);
    const longTermCount = turnoverAnalysis.filter(a => a.status === 'long-term').length;
    const totalTradeReturn = turnoverAnalysis.reduce((sum, a) => sum + a.tradeReturn, 0);

    return {
      avgHoldingDays: Math.floor(totalDays / turnoverAnalysis.length),
      avgTurnoverRate: totalTurnover / turnoverAnalysis.length,
      longTermPct: (longTermCount / turnoverAnalysis.length) * 100,
      totalTradeReturn,
    };
  }, [turnoverAnalysis]);

  // 상태별 색상
  const getStatusColor = (status: TurnoverData['status']) => {
    switch (status) {
      case 'long-term': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'mid-term': return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      case 'short-term': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default: return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
  };

  const getStatusLabel = (status: TurnoverData['status']) => {
    switch (status) {
      case 'long-term': return '장기 보유';
      case 'mid-term': return '중기 보유';
      case 'short-term': return '단기 보유';
      default: return '활발한 거래';
    }
  };

  if (assets.length === 0) {
    return null;
  }

  // 보유 기간 순으로 정렬
  const sortedAnalysis = [...turnoverAnalysis].sort((a, b) => b.holdingDays - a.holdingDays);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] tracking-widest text-celestial-purple font-medium uppercase flex items-center gap-2">
          <i className="fas fa-exchange-alt" />
          ASSET TURNOVER
        </h3>
        <span className="text-[9px] text-white/50">
          {assets.length}종목 분석
        </span>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="inner-glass p-2.5 rounded text-center">
          <div className="text-[8px] text-white/50 uppercase mb-1">평균 보유기간</div>
          <div className="text-[13px] text-celestial-cyan font-semibold">
            {portfolioStats.avgHoldingDays >= 365
              ? `${Math.floor(portfolioStats.avgHoldingDays / 365)}년 ${Math.floor((portfolioStats.avgHoldingDays % 365) / 30)}개월`
              : `${Math.floor(portfolioStats.avgHoldingDays / 30)}개월`}
          </div>
        </div>
        <div className="inner-glass p-2.5 rounded text-center">
          <div className="text-[8px] text-white/50 uppercase mb-1">평균 회전율</div>
          <div className="text-[13px] text-celestial-gold font-semibold">
            {portfolioStats.avgTurnoverRate.toFixed(1)}%
          </div>
        </div>
        <div className="inner-glass p-2.5 rounded text-center">
          <div className="text-[8px] text-white/50 uppercase mb-1">장기 보유 비율</div>
          <div className="text-[13px] text-v64-success font-semibold">
            {portfolioStats.longTermPct.toFixed(0)}%
          </div>
        </div>
        <div className="inner-glass p-2.5 rounded text-center">
          <div className="text-[8px] text-white/50 uppercase mb-1">거래 수익</div>
          <div className={`text-[13px] font-semibold ${portfolioStats.totalTradeReturn >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
            {portfolioStats.totalTradeReturn >= 0 ? '+' : ''}${Math.abs(portfolioStats.totalTradeReturn).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Holding Period Distribution */}
      <div className="inner-glass p-3 rounded-lg">
        <div className="text-[9px] text-white/60 uppercase tracking-wider mb-3">보유 기간 분포</div>
        <div className="flex gap-1 h-6 rounded overflow-hidden">
          {['long-term', 'mid-term', 'short-term', 'active'].map(status => {
            const count = turnoverAnalysis.filter(a => a.status === status).length;
            const pct = turnoverAnalysis.length > 0 ? (count / turnoverAnalysis.length) * 100 : 0;

            if (pct === 0) return null;

            const colors: Record<string, string> = {
              'long-term': 'bg-emerald-500',
              'mid-term': 'bg-sky-500',
              'short-term': 'bg-amber-500',
              'active': 'bg-rose-500',
            };

            return (
              <div
                key={status}
                className={`${colors[status]} flex items-center justify-center transition-all`}
                style={{ width: `${pct}%` }}
                title={`${getStatusLabel(status as TurnoverData['status'])}: ${count}종목 (${pct.toFixed(0)}%)`}
              >
                {pct >= 15 && (
                  <span className="text-[8px] text-white font-medium">
                    {pct.toFixed(0)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-[8px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-500" />
            <span className="text-white/60">장기 (1년+)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-sky-500" />
            <span className="text-white/60">중기 (6개월+)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-amber-500" />
            <span className="text-white/60">단기 (1개월+)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-rose-500" />
            <span className="text-white/60">활발</span>
          </span>
        </div>
      </div>

      {/* Asset List */}
      <div className="space-y-1.5">
        {sortedAnalysis.slice(0, 6).map((asset, i) => {
          const typeColor = TYPE_COLORS[asset.type as keyof typeof TYPE_COLORS] || TYPE_COLORS.CORE;

          return (
            <div
              key={asset.ticker}
              className="inner-glass p-2.5 rounded-lg flex items-center justify-between hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <span
                  className="font-display text-[11px] font-medium"
                  style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                >
                  {asset.ticker}
                </span>
                <span
                  className="text-[8px] px-1.5 py-0.5 rounded border"
                  style={{
                    borderColor: `${typeColor}40`,
                    color: typeColor,
                    background: `${typeColor}10`,
                  }}
                >
                  {asset.type}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-white/80">{asset.avgHoldingPeriod}</div>
                  <div className="text-[8px] text-white/50">보유 기간</div>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] ${asset.tradeReturn >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
                    {asset.tradeReturn >= 0 ? '+' : ''}${Math.abs(asset.tradeReturn).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[8px] text-white/50">거래 수익</div>
                </div>
                <span
                  className={`text-[8px] px-2 py-1 rounded border ${getStatusColor(asset.status)}`}
                >
                  {getStatusLabel(asset.status)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Investment Style Summary */}
      <div className="inner-glass p-3 rounded-lg">
        <div className="text-[9px] text-white/60 uppercase tracking-wider mb-2">투자 스타일 분석</div>
        <div className="text-[10px] text-white/80">
          {portfolioStats.longTermPct >= 70 ? (
            <span className="text-emerald-400">
              <i className="fas fa-check-circle mr-1.5" />
              장기 투자 스타일: 대부분의 자산을 1년 이상 보유하고 있습니다.
            </span>
          ) : portfolioStats.avgTurnoverRate > 50 ? (
            <span className="text-rose-400">
              <i className="fas fa-exclamation-triangle mr-1.5" />
              활발한 거래: 높은 회전율로 인해 거래 비용이 증가할 수 있습니다.
            </span>
          ) : (
            <span className="text-sky-400">
              <i className="fas fa-balance-scale mr-1.5" />
              균형잡힌 스타일: 적절한 보유 기간과 회전율을 유지하고 있습니다.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
