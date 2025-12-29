'use client';

import { useNexus } from '@/lib/context';

export default function Header() {
  const { state, refreshPrices } = useNexus();
  
  // Calculate totals
  let totalCost = 0, totalValue = 0, totalCostKrw = 0, totalValueKrw = 0;
  state.assets.forEach(a => {
    const cost = a.qty * a.avg;
    const value = a.qty * a.price;
    const buyRate = a.buyRate || state.exchangeRate;
    totalCost += cost;
    totalValue += value;
    totalCostKrw += Math.round(cost * buyRate);
    totalValueKrw += Math.round(value * state.exchangeRate);
  });

  const returnVal = totalValue - totalCost;
  const returnKrw = totalValueKrw - totalCostKrw;
  const sign = returnVal >= 0 ? '+' : '';
  const signKrw = returnKrw >= 0 ? '+' : '';
  const colorClass = returnVal >= 0 ? 'text-celestial-success glow-success' : 'text-celestial-danger glow-danger';
  const colorClassKrw = returnKrw >= 0 ? 'text-celestial-success glow-success' : 'text-celestial-danger glow-danger';

  const formatUSD = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <header className="glass-card p-5">
      <div className="flex flex-wrap justify-between items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-md shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <i className="fas fa-infinity text-xl text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-[0.2em] font-display text-white text-glow">CELESTIAL</h1>
            <div className="text-[10px] tracking-[0.3em] opacity-60 mt-1">NEXUS INTELLIGENCE V64.2</div>
          </div>
        </div>

        {/* Total Assets */}
        <div className="flex items-center gap-6 px-6 border-l border-white/10">
          <div className="text-center">
            <div className="text-[8px] uppercase tracking-widest mb-1 opacity-50">Total Assets($)</div>
            <div className="text-2xl font-light tracking-tight text-gradient-cyan">{formatUSD(totalCost)}</div>
            <div className={`text-[10px] mt-0.5 ${colorClass}`}>({sign}{formatUSD(Math.abs(returnVal))})</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] uppercase tracking-widest mb-1 opacity-50">Total Assets(₩)</div>
            <div className="text-2xl font-light tracking-tight text-gradient-gold">₩{totalCostKrw.toLocaleString()}</div>
            <div className={`text-[10px] mt-0.5 ${colorClassKrw}`}>({signKrw}₩{Math.abs(returnKrw).toLocaleString()})</div>
          </div>
        </div>

        {/* Market Indices */}
        <div className="flex gap-6 px-6 border-l border-r border-white/15">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4 min-w-[140px]">
              <span className="text-[10px] tracking-widest text-blue-400/80">NASDAQ</span>
              <span className="text-base font-display text-blue-400">
                {state.market.nasdaq ? state.market.nasdaq.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '---'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] tracking-widest text-green-400/80">S&P 500</span>
              <span className="text-base font-display text-green-400">
                {state.market.sp500 ? state.market.sp500.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '---'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] tracking-widest text-celestial-gold/80">US 10Y</span>
              <span className="text-base font-display text-celestial-gold">
                {state.market.tnx ? state.market.tnx.toFixed(2) + '%' : '---'}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4 min-w-[120px]">
              <span className="text-[10px] tracking-widest text-red-400/80">VIX</span>
              <span className="text-base font-display text-red-400">
                {state.market.vix ? state.market.vix.toFixed(2) : '---'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] tracking-widest text-white/60">USD/KRW</span>
              <span className="text-base font-display text-white/80">
                ₩{state.exchangeRate.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[9px] tracking-widest opacity-60">
            <div className={`status-dot ${state.isFetching ? 'loading' : state.lastSync ? 'connected' : ''}`} />
            <span>{state.isFetching ? 'SYNC...' : state.lastSync ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          
          <button
            onClick={refreshPrices}
            disabled={state.isFetching}
            className="celestial-btn flex items-center gap-2"
          >
            <i className={`fas fa-sync-alt ${state.isFetching ? 'spinner' : ''}`} />
            <span>SYNC</span>
          </button>
        </div>
      </div>
    </header>
  );
}
