'use client';

import { useState, useMemo, useCallback } from 'react';
import { useNexus } from '@/lib/context';
import ReactMarkdown from 'react-markdown';
import { AnalysisMode } from '@/lib/types';
import { FREEDOM_CONFIG, VIX_THRESHOLDS } from '@/lib/config';

// ═══════════════════════════════════════════════════════════════
// FREEDOM v31.0 - Freedom Modal Component
// 최적화: useMemo/useCallback으로 불필요한 재계산 방지
// ═══════════════════════════════════════════════════════════════

interface FreedomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AnalysisMetadata {
  version: string;
  mode: AnalysisMode;
  activeAgents: string[];
  vixLevel: number;
  isHighVix: boolean;
  timestamp: string;
}

export default function FreedomModal({ isOpen, onClose }: FreedomModalProps) {
  const { state, toast } = useNexus();
  const [analysis, setAnalysis] = useState<string>('');
  const [metadata, setMetadata] = useState<AnalysisMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>('standard');

  // 메모이제이션: 기초 데이터 계산
  const { totalValue, totalCost } = useMemo(() => ({
    totalValue: state.assets.reduce((sum, a) => sum + (a.price * a.qty), 0),
    totalCost: state.assets.reduce((sum, a) => sum + (a.avg * a.qty), 0),
  }), [state.assets]);

  // 메모이제이션: 그룹별 통계
  const { sectorStats, typeStats } = useMemo(() => {
    const groupBy = (key: 'sector' | 'type') => {
      const groups: Record<string, { value: number; cost: number; count: number }> = {};
      state.assets.forEach(a => {
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
      })).sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));
    };

    return {
      sectorStats: groupBy('sector'),
      typeStats: groupBy('type'),
    };
  }, [state.assets, totalValue]);

  // 메모이제이션: 배당 데이터
  const dividendData = useMemo(() => {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    const recentDividends = state.dividends.filter(d => new Date(d.date) >= oneYearAgo);
    const totalAnnualDividend = recentDividends.reduce((sum, d) => sum + (d.qty * d.dps), 0);
    
    const monthlyDividends: Record<string, number> = {};
    recentDividends.forEach(d => {
      const monthKey = d.date.substring(0, 7);
      monthlyDividends[monthKey] = (monthlyDividends[monthKey] || 0) + (d.qty * d.dps);
    });

    return {
      totalAnnualDividend,
      monthlyDividends,
      payingAssetsCount: new Set(recentDividends.map(d => d.ticker)).size,
    };
  }, [state.dividends]);

  // 콜백: 분석 실행 (메모이제이션된 값 사용)
  const handleAnalyze = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setAnalysis('');
    setMetadata(null);

    try {
      // 데이터 패키징 (메모이제이션된 값 사용)
      const portfolioData = {
        timestamp: new Date().toISOString(),
        userProfile: {
          strategy: state.strategy || 'Unspecified',
          riskTolerance: 'Dynamic',
        },
        summary: {
          totalValue,
          totalCost,
          totalReturn: totalValue - totalCost,
          totalReturnPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(2) : 0,
          cashHoldings: 0,
        },
        groups: {
          bySector: sectorStats,
          byType: typeStats,
        },
        income: {
          annualTotal: dividendData.totalAnnualDividend.toFixed(2),
          monthlyTrend: Object.entries(dividendData.monthlyDividends).slice(-6).map(([m, v]) => `${m}: $${v.toFixed(0)}`).join(', '),
          payingAssetsCount: dividendData.payingAssetsCount,
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
        body: JSON.stringify({ 
          portfolioData,
          mode: selectedMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API 요청 실패');
      }

      setAnalysis(data.analysis);
      setMetadata(data.metadata);
      toast('AI 분석 완료', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '분석 중 오류 발생';
      setError(errorMessage);
      toast(errorMessage, 'danger');
    } finally {
      setIsLoading(false);
    }
  }, [state, totalValue, totalCost, sectorStats, typeStats, dividendData, selectedMode, toast]);

  // 메모이제이션: VIX 관련 값
  const vixLevel = state.market.vix || 15;
  const isHighVix = vixLevel > VIX_THRESHOLDS.HIGH;
  const modeConfig = FREEDOM_CONFIG.ANALYSIS_MODES[selectedMode];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="glass-card w-[800px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-white text-base tracking-widest font-display">
              <i className="fas fa-robot mr-2 text-v64-accent" />
              FREEDOM AI v31.0
            </h3>
            <span className="text-[9px] px-2 py-0.5 rounded bg-celestial-purple/20 text-celestial-purple border border-celestial-purple/30">
              Agent Mesh Edition
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Mode Selector */}
          <div className="inner-glass p-4 rounded-xl mb-4">
            <div className="text-[10px] text-white/50 tracking-widest font-medium mb-3">
              ANALYSIS MODE
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(FREEDOM_CONFIG.ANALYSIS_MODES) as AnalysisMode[]).map((mode) => {
                const config = FREEDOM_CONFIG.ANALYSIS_MODES[mode];
                const isSelected = selectedMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    disabled={isLoading}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'bg-v64-accent/20 border-v64-accent/50 text-v64-accent'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                    }`}
                  >
                    <div className="text-[11px] font-medium mb-1">{config.label}</div>
                    <div className="text-[9px] opacity-70">{config.description}</div>
                    <div className="text-[8px] opacity-50 mt-1">
                      {config.estimatedTime} | {config.confidenceRange}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VIX Warning */}
          {isHighVix && (
            <div className="inner-glass p-3 rounded-xl mb-4 border border-orange-500/30 bg-orange-500/10">
              <div className="flex items-center gap-2 text-orange-400">
                <i className="fas fa-exclamation-triangle" />
                <span className="text-[11px] font-medium">
                  VIX {vixLevel.toFixed(1)} - 높은 변동성 감지
                </span>
              </div>
              <div className="text-[10px] text-orange-400/70 mt-1">
                GeopoliticalRiskAgent가 자동 활성화됩니다. Deep 모드 분석을 권장합니다.
              </div>
            </div>
          )}

          {/* Analyze Button Section */}
          <div className="inner-glass p-4 rounded-xl mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-white/50 tracking-widest font-medium mb-1">
                  {modeConfig.label.toUpperCase()} MODE ANALYSIS
                </div>
                <div className="text-[11px] text-white/70">
                  {modeConfig.description} - 예상 시간: {modeConfig.estimatedTime}
                </div>
                <div className="text-[9px] text-white/50 mt-1">
                  활성화 헤드: {modeConfig.heads.map(h => h.charAt(0).toUpperCase() + h.slice(1) + 'Head').join(', ')}
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
                    ANALYZING...
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

          {/* Metadata Display */}
          {metadata && (
            <div className="inner-glass p-4 rounded-xl mb-4 border border-celestial-cyan/20">
              <div className="text-[10px] text-celestial-cyan tracking-widest font-medium mb-2">
                <i className="fas fa-info-circle mr-2" />
                ANALYSIS METADATA
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[9px]">
                <div>
                  <span className="text-white/50">Version</span>
                  <div className="text-white">{metadata.version}</div>
                </div>
                <div>
                  <span className="text-white/50">Mode</span>
                  <div className="text-white uppercase">{metadata.mode}</div>
                </div>
                <div>
                  <span className="text-white/50">VIX Level</span>
                  <div className={metadata.isHighVix ? 'text-orange-400' : 'text-v64-success'}>
                    {metadata.vixLevel.toFixed(1)}
                  </div>
                </div>
                <div>
                  <span className="text-white/50">Agents</span>
                  <div className="text-white">{metadata.activeAgents.length}개 활성화</div>
                </div>
              </div>
              {/* Active Agents List */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-[9px] text-white/50 mb-1">활성화된 에이전트:</div>
                <div className="flex flex-wrap gap-1">
                  {metadata.activeAgents.map((agent, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[8px] rounded bg-white/10 text-white/70"
                    >
                      {agent}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analysis Result */}
          {analysis && (
            <div className="inner-glass p-6 rounded-xl animate-fade-in">
              <div className="text-[10px] text-v64-accent tracking-widest font-bold mb-4 flex items-center border-b border-white/5 pb-2">
                <i className="fas fa-file-medical-alt mr-2" />
                FREEDOM v31.0 ANALYSIS REPORT
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-white/80 text-[13px] leading-relaxed freedom-markdown">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold text-white mb-4 mt-6 border-l-4 border-v64-accent pl-3">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-semibold text-white/90 mb-3 mt-5 flex items-center">
                        <span className="text-v64-accent mr-2">#</span>
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-bold text-white/90 mb-2 mt-4 uppercase tracking-wider">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-sm font-semibold text-celestial-cyan mb-2 mt-3">
                        {children}
                      </h4>
                    ),
                    p: ({ children }) => (
                      <p className="mb-3 text-white/70">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-3 space-y-1 bg-white/5 p-3 rounded-lg">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-3 space-y-1 bg-white/5 p-3 rounded-lg">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-white/80 text-[12px]">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-v64-accent font-semibold">{children}</strong>
                    ),
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
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-3">
                        <table className="w-full text-[11px] border-collapse">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-white/10">{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th className="px-3 py-2 text-left text-white/80 font-medium border-b border-white/20">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 text-white/70 border-b border-white/10">
                        {children}
                      </td>
                    ),
                    hr: () => (
                      <hr className="my-4 border-white/10" />
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
              <div className="text-sm mb-2">Freedom v31.0 Agent Mesh Edition</div>
              <div className="text-xs">분석 모드를 선택하고 ANALYZE 버튼을 클릭하세요</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="text-[9px] text-white/40">
              Freedom v31.0 | Hydra-Lite v2 | Truth Guardian | 32 Hardlock Rules
            </div>
            <button onClick={onClose} className="celestial-btn">
              CLOSE REPORT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
