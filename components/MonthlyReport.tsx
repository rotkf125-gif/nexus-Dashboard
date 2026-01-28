'use client';

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { formatUSD } from '@/lib/utils';
import { CHART_COLORS, TYPE_INFO, TAX_CONFIG } from '@/lib/config';

interface MonthlyData {
  month: string;
  totalValue: number;
  totalCost: number;
  profit: number;
  returnPct: number;
  dividends: number;
  trades: number;
}

const { AFTER_TAX_RATE } = TAX_CONFIG;

export default function MonthlyReport() {
  const { state, toast } = useNexus();
  const { assets, dividends, tradeSums, exchangeRate } = state;

  const [selectedPeriod, setSelectedPeriod] = useState<'3m' | '6m' | '12m'>('3m');
  const [showExport, setShowExport] = useState(false);

  // 현재 포트폴리오 요약
  const portfolioSummary = useMemo(() => {
    let totalCost = 0;
    let totalValue = 0;
    let totalCostKrw = 0;
    let totalValueKrw = 0;

    assets.forEach(a => {
      const cost = a.qty * a.avg;
      const value = a.qty * a.price;
      const buyRate = a.buyRate || exchangeRate;
      totalCost += cost;
      totalValue += value;
      totalCostKrw += Math.round(cost * buyRate);
      totalValueKrw += Math.round(value * exchangeRate);
    });

    const profit = totalValue - totalCost;
    const profitKrw = totalValueKrw - totalCostKrw;
    const returnPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    return {
      totalCost,
      totalValue,
      profit,
      returnPct,
      totalCostKrw,
      totalValueKrw,
      profitKrw,
      assetCount: assets.length,
    };
  }, [assets, exchangeRate]);

  // 월별 배당금 집계
  const monthlyDividends = useMemo(() => {
    const monthly: Record<string, number> = {};
    dividends.forEach(d => {
      const month = d.date.slice(0, 7);
      monthly[month] = (monthly[month] || 0) + d.qty * d.dps * AFTER_TAX_RATE;
    });
    return monthly;
  }, [dividends]);

  // 총 배당금
  const totalDividends = useMemo(() =>
    dividends.reduce((sum, d) => sum + d.qty * d.dps * AFTER_TAX_RATE, 0),
    [dividends]
  );

  // 총 거래 수익
  const totalTradeReturn = useMemo(() =>
    Object.values(tradeSums).reduce((sum, v) => sum + (v || 0), 0),
    [tradeSums]
  );

  // 자산 유형별 분포
  const typeDistribution = useMemo(() => {
    const distribution: Record<string, { count: number; value: number }> = {};
    assets.forEach(a => {
      if (!distribution[a.type]) {
        distribution[a.type] = { count: 0, value: 0 };
      }
      distribution[a.type].count++;
      distribution[a.type].value += a.qty * a.price;
    });
    return distribution;
  }, [assets]);

  // 상위 종목 (같은 티커 통합)
  const topAssets = useMemo(() => {
    // 같은 티커를 하나로 통합
    const merged: Record<string, { ticker: string; type: string; value: number; cost: number }> = {};

    assets.forEach(a => {
      const value = a.qty * a.price;
      const cost = a.qty * a.avg;

      if (!merged[a.ticker]) {
        merged[a.ticker] = {
          ticker: a.ticker,
          type: a.type,
          value,
          cost,
        };
      } else {
        merged[a.ticker].value += value;
        merged[a.ticker].cost += cost;
      }
    });

    return Object.values(merged)
      .map(m => ({
        ticker: m.ticker,
        type: m.type,
        value: m.value,
        profit: m.value - m.cost,
        returnPct: m.cost > 0 ? ((m.value - m.cost) / m.cost) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [assets]);

  // 거래 수익 상위 5개 (ticker별)
  const topTradeReturns = useMemo(() => {
    return Object.entries(tradeSums)
      .map(([ticker, pnl]) => ({ ticker, pnl }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 5);
  }, [tradeSums]);

  // 최근 N개월 배당금 합계
  const recentDividends = useMemo(() => {
    const months = selectedPeriod === '3m' ? 3 : selectedPeriod === '6m' ? 6 : 12;
    const now = new Date();
    let sum = 0;
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      sum += monthlyDividends[monthKey] || 0;
    }
    return sum;
  }, [monthlyDividends, selectedPeriod]);

  // 보고서 텍스트 생성
  const generateReportText = () => {
    const now = new Date();
    const reportDate = now.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const lines = [
      '═══════════════════════════════════════════',
      '       NEXUS PORTFOLIO MONTHLY REPORT      ',
      '═══════════════════════════════════════════',
      '',
      `Report Date: ${reportDate}`,
      '',
      '[ PORTFOLIO SUMMARY ]',
      `Total Assets: ${portfolioSummary.assetCount} holdings`,
      `Total Value: ${formatUSD(portfolioSummary.totalValue)} (₩${portfolioSummary.totalValueKrw.toLocaleString()})`,
      `Total Cost: ${formatUSD(portfolioSummary.totalCost)} (₩${portfolioSummary.totalCostKrw.toLocaleString()})`,
      `Profit/Loss: ${portfolioSummary.profit >= 0 ? '+' : ''}${formatUSD(portfolioSummary.profit)} (${portfolioSummary.returnPct >= 0 ? '+' : ''}${portfolioSummary.returnPct.toFixed(2)}%)`,
      '',
      '[ INCOME SUMMARY ]',
      `Total Dividends (After Tax): ${formatUSD(totalDividends)}`,
      `Recent ${selectedPeriod.toUpperCase()} Dividends: ${formatUSD(recentDividends)}`,
      `Trade Returns: ${totalTradeReturn >= 0 ? '+' : ''}${formatUSD(totalTradeReturn)}`,
      '',
      '[ TOP 5 HOLDINGS ]',
      ...topAssets.map((a, i) =>
        `${i + 1}. ${a.ticker} - ${formatUSD(a.value)} (${a.returnPct >= 0 ? '+' : ''}${a.returnPct.toFixed(1)}%)`
      ),
      '',
      '[ TOP 5 TRADE RETURNS ]',
      ...(topTradeReturns.length > 0
        ? topTradeReturns.map((t, i) =>
            `${i + 1}. ${t.ticker} - ${t.pnl >= 0 ? '+' : ''}${formatUSD(t.pnl)}`
          )
        : ['No trade data available']),
      '',
      '[ TYPE DISTRIBUTION ]',
      ...Object.entries(typeDistribution).map(([type, data]) => {
        const pct = portfolioSummary.totalValue > 0
          ? ((data.value / portfolioSummary.totalValue) * 100).toFixed(1)
          : '0.0';
        return `${TYPE_INFO[type as keyof typeof TYPE_INFO]?.label || type}: ${data.count} assets (${pct}%)`;
      }),
      '',
      '═══════════════════════════════════════════',
      '         Generated by NEXUS Dashboard      ',
      '═══════════════════════════════════════════',
    ];

    return lines.join('\n');
  };

  // 클립보드에 복사
  const copyToClipboard = async () => {
    const text = generateReportText();
    try {
      await navigator.clipboard.writeText(text);
      toast('보고서가 클립보드에 복사되었습니다', 'success');
      setShowExport(false);
    } catch {
      toast('복사에 실패했습니다', 'danger');
    }
  };

  // 파일로 다운로드
  const downloadReport = () => {
    const text = generateReportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('보고서가 다운로드되었습니다', 'success');
    setShowExport(false);
  };

  if (assets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] tracking-widest text-celestial-purple font-medium uppercase flex items-center gap-2">
          <i className="fas fa-file-alt" />
          MONTHLY REPORT
        </h3>
        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex gap-1 inner-glass rounded p-0.5">
            {(['3m', '6m', '12m'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-2 py-1 text-[9px] rounded transition-all ${
                  selectedPeriod === period
                    ? 'bg-celestial-purple/20 text-celestial-purple'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {period.toUpperCase()}
              </button>
            ))}
          </div>
          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="celestial-btn text-[9px]"
            >
              <i className="fas fa-download mr-1" />
              내보내기
            </button>
            {showExport && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExport(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50 inner-glass p-2 rounded-lg min-w-[140px] shadow-lg border border-white/20">
                  <button
                    onClick={copyToClipboard}
                    className="w-full px-3 py-2 text-left text-[10px] hover:bg-white/10 rounded flex items-center gap-2"
                  >
                    <i className="fas fa-copy w-4" />
                    클립보드 복사
                  </button>
                  <button
                    onClick={downloadReport}
                    className="w-full px-3 py-2 text-left text-[10px] hover:bg-white/10 rounded flex items-center gap-2"
                  >
                    <i className="fas fa-file-download w-4" />
                    파일 다운로드
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Summary Stats */}
        <div className="space-y-3">
          <div className="inner-glass p-4 rounded-lg">
            <div className="text-[8px] text-white/70 uppercase mb-1">총 평가금</div>
            <div className="text-base text-celestial-cyan font-semibold">
              {formatUSD(portfolioSummary.totalValue)}
            </div>
            <div className="text-[10px] text-white/60 mt-1">
              ₩{portfolioSummary.totalValueKrw.toLocaleString()}
            </div>
          </div>

          <div className="inner-glass p-4 rounded-lg">
            <div className="text-[8px] text-white/70 uppercase mb-1">총 손익</div>
            <div className={`text-base font-semibold ${portfolioSummary.profit >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
              {portfolioSummary.profit >= 0 ? '+' : ''}{formatUSD(portfolioSummary.profit)}
            </div>
            <div className={`text-[10px] mt-1 ${portfolioSummary.profit >= 0 ? 'text-v64-success/70' : 'text-v64-danger/70'}`}>
              {portfolioSummary.returnPct >= 0 ? '+' : ''}{portfolioSummary.returnPct.toFixed(2)}%
            </div>
          </div>

          <div className="inner-glass p-4 rounded-lg">
            <div className="text-[8px] text-white/70 uppercase mb-1">배당금 ({selectedPeriod})</div>
            <div className="text-base text-celestial-gold font-semibold">
              {formatUSD(recentDividends)}
            </div>
            <div className="text-[10px] text-white/60 mt-1">
              총 {formatUSD(totalDividends)}
            </div>
          </div>

          <div className="inner-glass p-4 rounded-lg">
            <div className="text-[8px] text-white/70 uppercase mb-1">거래 수익</div>
            <div className={`text-base font-semibold ${totalTradeReturn >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
              {totalTradeReturn >= 0 ? '+' : ''}{formatUSD(totalTradeReturn)}
            </div>
            <div className="text-[10px] text-white/60 mt-1">
              누적
            </div>
          </div>
        </div>

        {/* Middle Column: Rankings */}
        <div className="space-y-3">
          {/* Top Holdings */}
          <div className="inner-glass p-4 rounded-lg">
            <div className="text-[9px] text-white/60 uppercase mb-3 flex items-center gap-2">
              <i className="fas fa-trophy text-celestial-gold" />
              상위 5개 종목
            </div>
            <div className="space-y-2.5">
              {topAssets.map((asset, i) => (
                <div key={asset.ticker} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-[10px] text-white/60 text-center">{i + 1}</span>
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                    >
                      {asset.ticker}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/80">
                      {formatUSD(asset.value)}
                    </span>
                    <span className={`text-[10px] w-14 text-right font-medium ${asset.returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
                      {asset.returnPct >= 0 ? '+' : ''}{asset.returnPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Type Distribution */}
          <div className="inner-glass p-4 rounded-lg">
            <div className="text-[9px] text-white/60 uppercase mb-3 flex items-center gap-2">
              <i className="fas fa-chart-pie text-celestial-purple" />
              유형별 분포
            </div>
            <div className="space-y-3">
              {Object.entries(typeDistribution).map(([type, data]) => {
                const pct = portfolioSummary.totalValue > 0
                  ? (data.value / portfolioSummary.totalValue) * 100
                  : 0;
                const typeInfo = TYPE_INFO[type as keyof typeof TYPE_INFO];
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-white/80">
                        {typeInfo?.label || type}
                      </span>
                      <span className="text-[10px] text-white/60">
                        {data.count}종목 ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-celestial-cyan"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Trade Returns */}
          {topTradeReturns.length > 0 && (
            <div className="inner-glass p-4 rounded-lg">
              <div className="text-[9px] text-white/60 uppercase mb-3 flex items-center gap-2">
                <i className="fas fa-exchange-alt text-v64-success" />
                거래 수익 TOP 5
              </div>
              <div className="space-y-2.5">
                {topTradeReturns.map((trade, i) => (
                  <div key={trade.ticker} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-[10px] text-white/60 text-center">{i + 1}</span>
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                      >
                        {trade.ticker}
                      </span>
                    </div>
                    <span className={`text-[11px] font-semibold ${trade.pnl >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
                      {trade.pnl >= 0 ? '+' : ''}{formatUSD(trade.pnl)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Report Preview */}
        <div className="inner-glass p-4 rounded-lg flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[9px] text-white/60 uppercase flex items-center gap-2">
              <i className="fas fa-file-alt text-celestial-cyan" />
              보고서 미리보기
            </div>
            <span className="text-[8px] text-white/60">
              {new Date().toLocaleDateString('ko-KR')} 기준
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <pre className="text-[9px] text-white/70 font-mono whitespace-pre-wrap bg-black/20 p-3 rounded h-full overflow-y-auto custom-scrollbar">
              {generateReportText()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
