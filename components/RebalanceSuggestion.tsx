'use client';

import { useState, useMemo, useEffect } from 'react';
import { useNexus } from '@/lib/context';
import { CHART_COLORS, TYPE_COLORS } from '@/lib/config';
import { formatUSD } from '@/lib/utils';

interface TargetWeight {
  ticker: string;
  targetPct: number;
}

interface RebalanceAction {
  ticker: string;
  type: string;
  currentPct: number;
  targetPct: number;
  diffPct: number;
  currentValue: number;
  targetValue: number;
  diffValue: number;
  action: 'buy' | 'sell' | 'hold';
  shares: number;
  price: number;
}

const STORAGE_KEY = 'nexus_target_weights';

export default function RebalanceSuggestion() {
  const { state, toast } = useNexus();
  const { assets, exchangeRate } = state;

  // 목표 비중 상태
  const [targetWeights, setTargetWeights] = useState<TargetWeight[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [tempWeights, setTempWeights] = useState<Record<string, number>>({});

  // localStorage에서 목표 비중 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTargetWeights(JSON.parse(saved));
      } catch {
        // 기본값 유지
      }
    }
  }, []);

  // 자산 변경 시 목표 비중 업데이트 (새 자산 추가/제거)
  useEffect(() => {
    setTargetWeights(prev => {
      // 같은 티커를 하나로 통합한 티커 목록
      const uniqueTickers = Array.from(new Set(assets.map(a => a.ticker)));
      const existingTickers = new Set(prev.map(t => t.ticker));
      const currentTickers = new Set(uniqueTickers);

      // 삭제된 자산 제거
      const filtered = prev.filter(t => currentTickers.has(t.ticker));

      // 새 자산 추가 (균등 배분)
      const newTickers = uniqueTickers.filter(ticker => !existingTickers.has(ticker));
      if (newTickers.length > 0) {
        const equalWeight = 100 / uniqueTickers.length;
        newTickers.forEach(ticker => {
          filtered.push({ ticker, targetPct: equalWeight });
        });
      }

      return filtered;
    });
  }, [assets]);

  // 같은 티커를 하나로 통합
  const mergedAssets = useMemo(() => {
    const merged: Record<string, { ticker: string; type: string; qty: number; price: number; totalValue: number }> = {};

    assets.forEach(asset => {
      if (!merged[asset.ticker]) {
        merged[asset.ticker] = {
          ticker: asset.ticker,
          type: asset.type,
          qty: asset.qty,
          price: asset.price,
          totalValue: asset.qty * asset.price,
        };
      } else {
        // 같은 티커가 있으면 수량과 총 가치를 합산
        merged[asset.ticker].qty += asset.qty;
        merged[asset.ticker].totalValue += asset.qty * asset.price;
        // 평균 가격 재계산
        merged[asset.ticker].price = merged[asset.ticker].totalValue / merged[asset.ticker].qty;
      }
    });

    return Object.values(merged);
  }, [assets]);

  // 현재 포트폴리오 분석
  const portfolioAnalysis = useMemo(() => {
    const totalValue = mergedAssets.reduce((sum, a) => sum + a.totalValue, 0);

    return mergedAssets.map(asset => {
      const value = asset.totalValue;
      const currentPct = totalValue > 0 ? (value / totalValue) * 100 : 0;
      const target = targetWeights.find(t => t.ticker === asset.ticker);
      const targetPct = target?.targetPct || 0;
      const diffPct = targetPct - currentPct;
      const targetValue = (targetPct / 100) * totalValue;
      const diffValue = targetValue - value;

      let action: 'buy' | 'sell' | 'hold' = 'hold';
      if (diffPct > 1) action = 'buy';
      else if (diffPct < -1) action = 'sell';

      const shares = asset.price > 0 ? Math.abs(Math.round(diffValue / asset.price)) : 0;

      return {
        ticker: asset.ticker,
        type: asset.type,
        currentPct,
        targetPct,
        diffPct,
        currentValue: value,
        targetValue,
        diffValue,
        action,
        shares,
        price: asset.price,
      };
    });
  }, [mergedAssets, targetWeights]);

  // 전체 통계
  const totalTargetPct = useMemo(() =>
    targetWeights.reduce((sum, t) => sum + t.targetPct, 0),
    [targetWeights]
  );

  const totalValue = useMemo(() =>
    mergedAssets.reduce((sum, a) => sum + a.totalValue, 0),
    [mergedAssets]
  );

  // 편집 모드 시작
  const startEdit = () => {
    const weights: Record<string, number> = {};
    targetWeights.forEach(t => {
      weights[t.ticker] = t.targetPct;
    });
    // 목표 비중이 없는 자산은 현재 비중으로 초기화
    mergedAssets.forEach(a => {
      if (weights[a.ticker] === undefined) {
        const currentPct = portfolioAnalysis.find(p => p.ticker === a.ticker)?.currentPct || 0;
        weights[a.ticker] = Math.round(currentPct * 10) / 10;
      }
    });
    setTempWeights(weights);
    setEditMode(true);
  };

  // 편집 저장
  const saveEdit = () => {
    const newWeights = mergedAssets.map(a => ({
      ticker: a.ticker,
      targetPct: tempWeights[a.ticker] || 0,
    }));
    setTargetWeights(newWeights);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newWeights));
    setEditMode(false);
    toast('목표 비중이 저장되었습니다', 'success');
  };

  // 균등 배분
  const distributeEvenly = () => {
    const equalWeight = Math.round((100 / mergedAssets.length) * 10) / 10;
    const weights: Record<string, number> = {};
    mergedAssets.forEach(a => {
      weights[a.ticker] = equalWeight;
    });
    setTempWeights(weights);
  };

  // 현재 비중으로 설정
  const setToCurrent = () => {
    const weights: Record<string, number> = {};
    portfolioAnalysis.forEach(p => {
      weights[p.ticker] = Math.round(p.currentPct * 10) / 10;
    });
    setTempWeights(weights);
  };

  if (assets.length === 0) {
    return null;
  }

  const needsRebalance = portfolioAnalysis.some(p => Math.abs(p.diffPct) > 1);
  const buyActions = portfolioAnalysis.filter(p => p.action === 'buy');
  const sellActions = portfolioAnalysis.filter(p => p.action === 'sell');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] tracking-widest text-celestial-cyan font-medium uppercase flex items-center gap-2">
          <i className="fas fa-balance-scale" />
          REBALANCE SUGGESTION
        </h3>
        <div className="flex items-center gap-2">
          {!editMode ? (
            <button
              onClick={startEdit}
              className="celestial-btn text-[9px]"
            >
              <i className="fas fa-edit mr-1" />
              목표 설정
            </button>
          ) : (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="celestial-btn text-[9px] text-white/60"
              >
                취소
              </button>
              <button
                onClick={saveEdit}
                className="celestial-btn text-[9px]"
                style={{ borderColor: 'rgba(105,240,174,0.4)', color: '#69F0AE' }}
              >
                저장
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit Mode */}
      {editMode && (
        <div className="inner-glass p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/60">목표 비중 설정</span>
            <div className="flex gap-2">
              <button
                onClick={distributeEvenly}
                className="text-[9px] text-celestial-cyan hover:underline"
              >
                균등 배분
              </button>
              <button
                onClick={setToCurrent}
                className="text-[9px] text-white/60 hover:underline"
              >
                현재 비중
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {assets.map((asset, i) => {
              const current = portfolioAnalysis.find(p => p.ticker === asset.ticker);
              return (
                <div key={asset.ticker} className="flex items-center gap-3">
                  <span
                    className="w-16 text-[11px] font-medium"
                    style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                  >
                    {asset.ticker}
                  </span>
                  <span className="text-[9px] text-white/50 w-16">
                    현재: {current?.currentPct.toFixed(1)}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.5"
                    value={tempWeights[asset.ticker] || 0}
                    onChange={(e) => setTempWeights(prev => ({
                      ...prev,
                      [asset.ticker]: parseFloat(e.target.value),
                    }))}
                    className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-celestial-cyan"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={tempWeights[asset.ticker] || 0}
                    onChange={(e) => setTempWeights(prev => ({
                      ...prev,
                      [asset.ticker]: parseFloat(e.target.value) || 0,
                    }))}
                    className="w-16 px-2 py-1 text-[10px] text-center bg-white/5 border border-white/20 rounded"
                  />
                  <span className="text-[10px] text-white/40">%</span>
                </div>
              );
            })}
          </div>

          {/* Total Indicator */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-[9px] text-white/60">합계</span>
            <span className={`text-[11px] font-medium ${
              Math.abs(Object.values(tempWeights).reduce((a, b) => a + b, 0) - 100) < 0.1
                ? 'text-v64-success'
                : 'text-v64-danger'
            }`}>
              {Object.values(tempWeights).reduce((a, b) => a + b, 0).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Current vs Target Comparison */}
      {!editMode && targetWeights.length > 0 && (
        <>
          {/* Visual Comparison */}
          <div className="inner-glass p-3 rounded-lg">
            <div className="text-[9px] text-white/60 uppercase mb-2">현재 vs 목표</div>
            <div className="space-y-2">
              {portfolioAnalysis.map((item, i) => (
                <div key={item.ticker} className="flex items-center gap-2">
                  <span
                    className="w-14 text-[10px] font-medium"
                    style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                  >
                    {item.ticker}
                  </span>
                  <div className="flex-1 relative h-4">
                    {/* Background */}
                    <div className="absolute inset-0 bg-white/5 rounded" />
                    {/* Current */}
                    <div
                      className="absolute top-0 left-0 h-full bg-white/30 rounded-l"
                      style={{ width: `${Math.min(item.currentPct, 100)}%` }}
                    />
                    {/* Target Marker */}
                    <div
                      className="absolute top-0 w-0.5 h-full bg-celestial-gold"
                      style={{ left: `${Math.min(item.targetPct, 100)}%` }}
                    />
                  </div>
                  <span className={`w-16 text-[9px] text-right ${
                    item.diffPct > 1 ? 'text-v64-success' :
                    item.diffPct < -1 ? 'text-v64-danger' : 'text-white/60'
                  }`}>
                    {item.diffPct >= 0 ? '+' : ''}{item.diffPct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-[8px] text-white/50">
              <span className="flex items-center gap-1">
                <span className="w-3 h-2 bg-white/30 rounded" /> 현재
              </span>
              <span className="flex items-center gap-1">
                <span className="w-0.5 h-3 bg-celestial-gold" /> 목표
              </span>
            </div>
          </div>

          {/* Rebalance Actions */}
          {needsRebalance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Buy Suggestions */}
              {buyActions.length > 0 && (
                <div className="inner-glass p-3 rounded-lg border-l-2 border-l-v64-success">
                  <div className="text-[10px] text-v64-success font-medium mb-2 flex items-center gap-2">
                    <i className="fas fa-arrow-up" />
                    매수 제안
                  </div>
                  <div className="space-y-2">
                    {buyActions.map(item => (
                      <div key={item.ticker} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white font-medium">{item.ticker}</span>
                          <span className="text-[9px] text-white/50">
                            +{item.shares}주
                          </span>
                        </div>
                        <span className="text-[10px] text-v64-success">
                          +{formatUSD(item.diffValue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sell Suggestions */}
              {sellActions.length > 0 && (
                <div className="inner-glass p-3 rounded-lg border-l-2 border-l-v64-danger">
                  <div className="text-[10px] text-v64-danger font-medium mb-2 flex items-center gap-2">
                    <i className="fas fa-arrow-down" />
                    매도 제안
                  </div>
                  <div className="space-y-2">
                    {sellActions.map(item => (
                      <div key={item.ticker} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white font-medium">{item.ticker}</span>
                          <span className="text-[9px] text-white/50">
                            -{item.shares}주
                          </span>
                        </div>
                        <span className="text-[10px] text-v64-danger">
                          {formatUSD(item.diffValue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Balanced State */}
          {!needsRebalance && (
            <div className="inner-glass p-4 rounded-lg text-center">
              <i className="fas fa-check-circle text-v64-success text-xl mb-2" />
              <div className="text-[11px] text-white/70">
                포트폴리오가 목표 비중에 맞춰 균형을 이루고 있습니다.
              </div>
            </div>
          )}
        </>
      )}

      {/* No Target Weights Set */}
      {!editMode && targetWeights.length === 0 && (
        <div className="inner-glass p-4 rounded-lg text-center">
          <i className="fas fa-sliders-h text-celestial-gold/50 text-2xl mb-2" />
          <div className="text-[11px] text-white/60 mb-2">
            목표 비중이 설정되지 않았습니다.
          </div>
          <button
            onClick={startEdit}
            className="text-[10px] text-celestial-cyan hover:underline"
          >
            목표 비중 설정하기
          </button>
        </div>
      )}
    </div>
  );
}
