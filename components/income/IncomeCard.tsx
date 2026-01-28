'use client';

export interface IncomeStatData {
  ticker: string;
  qty: number;
  avgDps: number;
  principal: number;
  totalDividend: number;
  valuation: number;
  tradeReturn: number;
  totalReturn: number;
  recoveryPct: number;
  dividendCount: number;
}

interface IncomeCardProps {
  stat: IncomeStatData;
  index: number;
  compact?: boolean;
  onEditTradeReturn: (ticker: string, currentValue: number) => void;
}

export default function IncomeCard({ stat, index, compact = false, onEditTradeReturn }: IncomeCardProps) {
  const isGold = index % 2 === 1;
  const borderClass = isGold ? 'border-celestial-gold/30' : 'border-white/10';
  const textClass = isGold ? 'text-celestial-gold' : 'text-white';
  const barBg = isGold ? 'bg-celestial-gold/10' : 'bg-white/5';
  const barFill = isGold
    ? 'bg-gradient-to-r from-celestial-gold/50 to-celestial-gold'
    : 'bg-gradient-to-r from-v64-success/50 to-v64-success';

  const totalReturnColor = stat.totalReturn >= 0
    ? 'text-v64-success bg-v64-success/10 border-v64-success/30'
    : 'text-v64-danger bg-v64-danger/10 border-v64-danger/30';

  if (compact) {
    // Non-Analytics Mode: 2열 레이아웃
    return (
      <div className={`inner-glass p-4 rounded-lg border ${borderClass}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <span className={`text-base font-display tracking-widest ${textClass}`}>
            {stat.ticker}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 border rounded ${totalReturnColor}`}>
            {stat.totalReturn >= 0 ? '+' : ''}${stat.totalReturn.toFixed(2)}
          </span>
        </div>

        {/* Stats Grid - 2열 */}
        <div className="space-y-1.5 mb-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-white/70 tracking-wider uppercase">QTY</span>
              <span className="text-celestial-cyan font-semibold text-[13px]">{stat.qty}주</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-white/70 tracking-wider uppercase">DIVIDEND</span>
              <span className="text-v64-success font-semibold text-[13px]">${stat.totalDividend.toFixed(2)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-white/70 tracking-wider uppercase">PRINCIPAL</span>
              <span className="text-white/90 font-medium text-[12px]">
                ${stat.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-white/70 tracking-wider uppercase">VALUATION</span>
              <span className="text-white/90 font-medium text-[12px]">
                ${stat.valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] text-white/70 tracking-wider uppercase">TRADE R.</span>
            <span
              className={`cursor-pointer hover:opacity-80 font-semibold text-[13px] ${stat.tradeReturn >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}
              onClick={() => onEditTradeReturn(stat.ticker, stat.tradeReturn)}
              title="클릭하여 수정"
            >
              {stat.tradeReturn >= 0 ? '+' : ''}${stat.tradeReturn.toFixed(2)}
              <i className="fas fa-pen text-[8px] ml-1 text-white/60" />
            </span>
          </div>
        </div>

        {/* Recovery Progress */}
        <div className={`border-t pt-2.5 ${isGold ? 'border-celestial-gold/20' : 'border-white/10'}`}>
          <div className="flex justify-between mb-1.5 text-[10px] tracking-widest">
            <span className={isGold ? 'text-celestial-gold/70' : 'text-white/70'}>RECOVERY</span>
            <span className={`font-semibold text-[11px] ${stat.recoveryPct >= 100 ? 'text-v64-success' : (isGold ? 'text-celestial-gold' : 'text-white')}`}>
              {stat.recoveryPct.toFixed(1)}%
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${barBg}`}>
            <div
              className={`h-full transition-all ${stat.recoveryPct >= 100 ? 'bg-v64-success' : barFill}`}
              style={{ width: `${Math.min(100, stat.recoveryPct)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Analytics Mode: 1열 레이아웃, 더 큰 카드
  return (
    <div
      className={`inner-glass p-4 rounded-lg border ${borderClass} flex flex-col`}
      style={{ minHeight: '280px' }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className={`text-lg font-display tracking-widest ${textClass}`}>
          {stat.ticker}
        </span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 border rounded ${totalReturnColor}`}>
          {stat.totalReturn >= 0 ? '+' : ''}${stat.totalReturn.toFixed(2)}
        </span>
      </div>

      {/* Stats Grid - 1열 */}
      <div className="space-y-2.5 mb-3 flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-white/70 tracking-wider uppercase font-medium">QTY</span>
          <span className="text-celestial-cyan font-semibold text-[13px]">{stat.qty}주</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-white/70 tracking-wider uppercase font-medium">DIVIDEND</span>
          <span className="text-v64-success font-semibold text-[13px]">${stat.totalDividend.toFixed(2)}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-white/70 tracking-wider uppercase font-medium">PRINCIPAL</span>
          <span className="text-white/90 font-medium text-[12px]">
            ${stat.principal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-white/70 tracking-wider uppercase font-medium">VALUATION</span>
          <span className="text-white/90 font-medium text-[12px]">
            ${stat.valuation.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-white/70 tracking-wider uppercase font-medium">TRADE R.</span>
          <span
            className={`cursor-pointer hover:opacity-80 font-semibold text-[13px] ${stat.tradeReturn >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}
            onClick={() => onEditTradeReturn(stat.ticker, stat.tradeReturn)}
            title="클릭하여 수정"
          >
            {stat.tradeReturn >= 0 ? '+' : ''}${stat.tradeReturn.toFixed(2)}
            <i className="fas fa-pen text-[8px] ml-1 text-white/60" />
          </span>
        </div>
      </div>

      {/* Recovery Progress */}
      <div className={`border-t pt-2.5 ${isGold ? 'border-celestial-gold/20' : 'border-white/10'}`}>
        <div className="flex justify-between mb-2 text-[10px] tracking-widest">
          <span className={`font-medium ${isGold ? 'text-celestial-gold/70' : 'text-white/70'}`}>RECOVERY</span>
          <span className={`font-semibold text-[11px] ${stat.recoveryPct >= 100 ? 'text-v64-success' : (isGold ? 'text-celestial-gold' : 'text-white')}`}>
            {stat.recoveryPct.toFixed(1)}%
          </span>
        </div>
        <div className={`w-full h-2.5 rounded-full overflow-hidden ${barBg}`}>
          <div
            className={`h-full transition-all ${stat.recoveryPct >= 100 ? 'bg-v64-success' : barFill}`}
            style={{ width: `${Math.min(100, stat.recoveryPct)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
