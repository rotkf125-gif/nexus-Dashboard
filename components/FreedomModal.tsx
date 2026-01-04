'use client';

import { useState } from 'react';
import { useNexus } from '@/lib/context';
import ReactMarkdown from 'react-markdown';
import { Asset, Dividend } from '@/lib/types'; // 타입 import 확인

interface FreedomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FreedomModal({ isOpen, onClose }: FreedomModalProps) {
  const { state, toast } = useNexus();
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError('');
    setAnalysis('');

    try {
      // ═══════════════════════════════════════════════════════════════
      // 1. 기초 데이터 계산 (Basic Metrics)
      // ═══════════════════════════════════════════════════════════════
      const totalValue = state.assets.reduce((sum, a) => sum + (a.price * a.qty), 0);
      const totalCost = state.assets.reduce((sum, a) => sum + (a.avg * a.qty), 0);

      // ═══════════════════════════════════════════════════════════════
      // 2. 그룹별 추세 및 변동성 데이터 가공 (Group Analysis)
      // ═══════════════════════════════════════════════════════════════
      const groupBy = (assets: Asset[], key: 'sector' | 'type') => {
        const groups: Record<string, { value: number; cost: number; count: number }> = {};
        assets.forEach(a => {
          const groupKey = a[key] || 'Other';
          if (!groups[groupKey]) groups[groupKey] = { value: 0, cost: 0, count: 0 };
          groups[groupKey].value += a.price * a.qty;
          groups[groupKey].cost += a.avg * a.qty;
          groups[groupKey].count += 1;
        });
        return Object.entries(groups).map(([name, data]) => ({
          name,
          weight: totalValue > 0 ? (data.value / totalValue * 100).toFixed(1) + '%' : '0%',
          returnPct: data.cost > 0 ? ((data.value - data.cost) / data.cost * 100).toFixed(2) : 0,
          assetCount: data.count
        })).sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight)); // 비중 순 정렬
      };

      const sectorStats = groupBy(state.assets, 'sector');
      const typeStats = groupBy(state.assets, 'type');

      // ═══════════════════════════════════════════════════════════════
      // 3. 배당 분석 데이터 (Dividend Analytics)
      // ═══════════════════════════════════════════════════════════════
      // 최근 1년간 배당 합계 및 월별 추이
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      
      const recentDividends = state.dividends.filter(d => new Date(d.date) >= oneYearAgo);
      const totalAnnualDividend = recentDividends.reduce((sum, d) => sum + (d.qty * d.dps), 0);
      
      // 월별 배당금 집계 (변동성 확인용)
      const monthlyDividends: Record<string, number> = {};
      recentDividends.forEach(d => {
        const monthKey = d.date.substring(0, 7); // YYYY-MM
        monthlyDividends[monthKey] = (monthlyDividends[monthKey] || 0) + (d.qty * d.dps);
      });

      // ═══════════════════════════════════════════════════════════════
      // 4. 데이터 패키징 (Payload Construction)
      // ═══════════════════════════════════════════════════════════════
      const portfolioData = {
        timestamp: new Date().toISOString(),
        userProfile: {
          strategy: state.strategy || 'Unspecified', // 사용자의 투자 전략
          riskTolerance: 'Dynamic', // 추후 설정 연동 가능
        },
        summary: {
          totalValue,
          totalCost,
          totalReturn: totalValue - totalCost,
          totalReturnPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(2) : 0,
          cashHoldings: 0, // 현금 기능이 추가된다면 여기에 연동
        },
        groups: {
          bySector: sectorStats, // 섹터별 비중 및 수익률
          byType: typeStats,     // 자산 타입별(CORE/INCOME 등) 분석
        },
        income: {
          annualTotal: totalAnnualDividend.toFixed(2),
          monthlyTrend: Object.entries(monthlyDividends).slice(-6).map(([m, v]) => `${m}: $${v.toFixed(0)}`).join(', '),
          payingAssetsCount: new Set(recentDividends.map(d => d.ticker)).size,
        },
        assets: state.assets.map(asset => {
          const value = asset.price * asset.qty;
          const weight = totalValue > 0 ? (value / totalValue * 100) : 0;
          return {
            ticker: asset.ticker,
            qty: asset.qty,
            avg: asset.avg,
            price: asset.price,
            weight: weight.toFixed(2),
            returnPct: asset.avg > 0 ? ((asset.price - asset.avg) / asset.avg * 100).toFixed(2) : 0,
            sector: asset.sector,
            type: asset.type,
          };
        }),
        market: {
          nasdaq: state.market.nasdaq,
          sp500: state.market.sp500,
          vix: state.market.vix,
          tnx: state.market.tnx,
        },
      };

      const response = await fetch('/api/freedom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API 요청 실패');
      }

      setAnalysis(data.analysis);
      toast('AI 분석 완료', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '분석 중 오류 발생';
      setError(errorMessage);
      toast(errorMessage, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="glass-card w-[700px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h3 className="font-semibold text-white text-base tracking-widest font-display">
            <i className="fas fa-robot mr-2 text-v64-accent" />FREEDOM AI V2
          </h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Analyze Button Section */}
          <div className="inner-glass p-4 rounded-xl mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-white/50 tracking-widest font-medium mb-1">
                  DEEP DIVE ANALYSIS
                </div>
                <div className="text-[11px] text-white/70">
                  섹터별 추세, 배당 안전성, 개별 종목 리스크를 포함한 심층 분석
                </div>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isLoading || state.assets.length === 0}
                className="celestial-btn text-[10px] px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2" />
                    THINKING...
                  </>
                ) : (
                  <>
                    <i className="fas fa-bolt mr-2" />
                    ANALYZE
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="inner-glass p-4 rounded-xl mb-4 border border-v64-danger/30">
              <div className="text-[11px] text-v64-danger">
                <i className="fas fa-exclamation-circle mr-2" />
                {error}
              </div>
            </div>
          )}

          {/* Analysis Result */}
          {analysis && (
            <div className="inner-glass p-6 rounded-xl animate-fade-in">
              <div className="text-[10px] text-v64-accent tracking-widest font-bold mb-4 flex items-center border-b border-white/5 pb-2">
                <i className="fas fa-file-medical-alt mr-2" />
                AI DIAGNOSIS REPORT
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-white/80 text-[13px] leading-relaxed freedom-markdown">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-4 mt-6 border-l-4 border-v64-accent pl-3">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold text-white/90 mb-3 mt-5 flex items-center"><span className="text-v64-accent mr-2">#</span>{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold text-white/90 mb-2 mt-4 uppercase tracking-wider">{children}</h3>,
                    p: ({ children }) => <p className="mb-3 text-white/70">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 bg-white/5 p-3 rounded-lg">{children}</ul>,
                    li: ({ children }) => <li className="text-white/80 text-[12px]">{children}</li>,
                    strong: ({ children }) => <strong className="text-v64-accent font-semibold">{children}</strong>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-celestial-purple/50 pl-3 my-3 text-white/60 italic bg-celestial-purple/10 py-2 rounded-r">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-black/30 px-1.5 py-0.5 rounded text-celestial-gold text-[11px] font-mono border border-white/10">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {analysis}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Initial State */}
          {!analysis && !error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 opacity-30">
              <i className="fas fa-microchip text-5xl mb-4" />
              <div className="text-xs">상단 버튼을 눌러 정밀 분석을 시작하세요</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <button onClick={onClose} className="celestial-btn w-full">
            CLOSE REPORT
          </button>
        </div>
      </div>
    </div>
  );
}
