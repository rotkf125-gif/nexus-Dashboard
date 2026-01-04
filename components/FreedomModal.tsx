'use client';

import { useState } from 'react';
import { useNexus } from '@/lib/context';
import ReactMarkdown from 'react-markdown';

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
      // NEXUS 포트폴리오 데이터 구성
      const totalValue = state.assets.reduce((sum, a) => sum + (a.price * a.qty), 0);
      const totalCost = state.assets.reduce((sum, a) => sum + (a.avg * a.qty), 0);

      const portfolioData = {
        timestamp: new Date().toISOString(),
        summary: {
          totalValue,
          totalCost,
          assetCount: state.assets.length,
          exchangeRate: state.exchangeRate,
        },
        assets: state.assets.map(asset => {
          const value = asset.price * asset.qty;
          const cost = asset.avg * asset.qty;
          const gain = value - cost;
          const gainPercent = cost > 0 ? (gain / cost * 100) : 0;
          const weight = totalValue > 0 ? (value / totalValue * 100) : 0;

          return {
            ticker: asset.ticker,
            type: asset.type,
            sector: asset.sector,
            qty: asset.qty,
            avgCost: asset.avg,
            currentPrice: asset.price,
            value,
            gain,
            gainPercent: gainPercent.toFixed(2),
            weight: weight.toFixed(2),
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999]">
      <div className="glass-card w-[700px] max-h-[85vh] flex flex-col fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h3 className="font-semibold text-white text-base tracking-widest font-display">
            <i className="fas fa-robot mr-2 text-v64-accent" />FREEDOM AI
          </h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Quick Analyze Button */}
          <div className="inner-glass p-4 rounded-xl mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-white/50 tracking-widest font-medium mb-1">
                  QUICK ANALYZE
                </div>
                <div className="text-[11px] text-white/70">
                  현재 포트폴리오를 AI가 분석합니다
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
            {state.assets.length === 0 && (
              <div className="text-[10px] text-v64-warning mt-2">
                <i className="fas fa-exclamation-triangle mr-1" />
                분석할 자산이 없습니다. 먼저 자산을 추가하세요.
              </div>
            )}
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
            <div className="inner-glass p-4 rounded-xl">
              <div className="text-[10px] text-white/50 tracking-widest font-medium mb-3 flex items-center">
                <i className="fas fa-chart-line mr-2 text-v64-success" />
                ANALYSIS RESULT
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-white/80 text-[12px] leading-relaxed freedom-markdown">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-3 mt-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-semibold text-white/90 mb-2 mt-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-medium text-white/80 mb-2 mt-2">{children}</h3>,
                    p: ({ children }) => <p className="mb-2 text-white/70">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-white/70">{children}</li>,
                    strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="text-v64-accent">{children}</em>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-v64-accent/50 pl-3 my-2 text-white/60 italic">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-white/10 px-1 py-0.5 rounded text-v64-accent text-[11px]">
                        {children}
                      </code>
                    ),
                    hr: () => <hr className="border-white/10 my-4" />,
                  }}
                >
                  {analysis}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Initial State */}
          {!analysis && !error && !isLoading && (
            <div className="inner-glass p-8 rounded-xl text-center">
              <i className="fas fa-brain text-4xl text-white/20 mb-4" />
              <div className="text-[11px] text-white/40">
                ANALYZE 버튼을 클릭하여 AI 포트폴리오 분석을 시작하세요
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button onClick={onClose} className="celestial-btn w-full">
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
