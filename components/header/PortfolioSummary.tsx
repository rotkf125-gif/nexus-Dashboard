'use client';

// ═══════════════════════════════════════════════════════════════
// Portfolio Summary - 포트폴리오 요약 컴포넌트
// ═══════════════════════════════════════════════════════════════

interface PortfolioSummaryProps {
  totalValue: number;
  totalCost: number;
  totalValueKrw: number;
  totalCostKrw: number;
  returnVal: number;
  returnKrw: number;
}

export default function PortfolioSummary({
  totalValue,
  totalCost,
  totalValueKrw,
  totalCostKrw,
  returnVal,
  returnKrw,
}: PortfolioSummaryProps) {
  const sign = returnVal >= 0 ? '+' : '';
  const signKrw = returnKrw >= 0 ? '+' : '';
  const colorClass = returnVal >= 0 ? 'text-v64-success glow-success' : 'text-v64-danger glow-danger';
  const colorClassKrw = returnKrw >= 0 ? 'text-v64-success glow-success' : 'text-v64-danger glow-danger';

  const formatUSD = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="hidden lg:flex items-center gap-6 px-6 border-l border-white/10">
      {/* USD */}
      <div className="text-center">
        <div className="text-[8px] uppercase tracking-widest mb-1 opacity-80">평가금($)</div>
        <div className="text-xl lg:text-2xl font-light tracking-tight text-gradient-cyan">{formatUSD(totalValue)}</div>
        <div className={`text-[10px] mt-0.5 ${colorClass}`}>({sign}{formatUSD(Math.abs(returnVal))})</div>
        <div className="text-[9px] mt-1 opacity-80">원금: {formatUSD(totalCost)}</div>
      </div>
      {/* KRW */}
      <div className="text-center">
        <div className="text-[8px] uppercase tracking-widest mb-1 opacity-80">평가금(₩)</div>
        <div className="text-xl lg:text-2xl font-light tracking-tight text-gradient-gold">₩{totalValueKrw.toLocaleString()}</div>
        <div className={`text-[10px] mt-0.5 ${colorClassKrw}`}>({signKrw}₩{Math.abs(returnKrw).toLocaleString()})</div>
        <div className="text-[9px] mt-1 opacity-80">원금: ₩{totalCostKrw.toLocaleString()}</div>
      </div>
    </div>
  );
}
