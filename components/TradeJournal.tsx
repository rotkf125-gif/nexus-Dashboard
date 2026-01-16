'use client';

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { TradeLog, TradeType } from '@/lib/types';
import { formatUSD } from '@/lib/utils';

type SortBy = 'date' | 'ticker';
type SortOrder = 'asc' | 'desc';

export default function TradeJournal() {
  const { state, removeTradeLog, openEditTradeModal } = useNexus();
  const { tradeLogs, tradeSums } = state;

  const [filterTicker, setFilterTicker] = useState<string>('');
  const [filterType, setFilterType] = useState<TradeType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 필터링 & 정렬
  const filteredAndSortedLogs = useMemo(() => {
    let logs = [...tradeLogs];

    // 필터링
    if (filterTicker) {
      logs = logs.filter(log => log.ticker.toLowerCase().includes(filterTicker.toLowerCase()));
    }
    if (filterType !== 'ALL') {
      logs = logs.filter(log => log.type === filterType);
    }

    // 정렬
    logs.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'ticker') {
        comparison = a.ticker.localeCompare(b.ticker);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return logs;
  }, [tradeLogs, filterTicker, filterType, sortBy, sortOrder]);

  // 요약 통계
  const stats = useMemo(() => {
    const buyCount = tradeLogs.filter(t => t.type === 'BUY').length;
    const sellCount = tradeLogs.filter(t => t.type === 'SELL').length;
    
    // 디버깅: tradeLogs와 tradeSums 상태 확인
    if (tradeLogs.length > 0) {
      console.log('[TradeJournal] tradeLogs:', tradeLogs);
      console.log('[TradeJournal] tradeSums:', tradeSums);
      console.log('[TradeJournal] BUY 거래:', tradeLogs.filter(t => t.type === 'BUY'));
      console.log('[TradeJournal] SELL 거래:', tradeLogs.filter(t => t.type === 'SELL'));
    }
    
    // tradeSums가 비어있거나 값이 없을 경우를 대비해 안전하게 합산
    const totalRealized = tradeSums && typeof tradeSums === 'object' 
      ? Object.values(tradeSums).reduce((sum, val) => {
          const numVal = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
          return sum + numVal;
        }, 0)
      : 0;

    console.log('[TradeJournal] 계산된 totalRealized:', totalRealized);

    return {
      totalTrades: tradeLogs.length,
      buyCount,
      sellCount,
      totalRealized,
    };
  }, [tradeLogs, tradeSums]);

  // 티커별 실현 손익 상위 5개
  const topTradeSums = useMemo(() => {
    return Object.entries(tradeSums)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [tradeSums]);

  const handleDelete = (id: string) => {
    if (confirm('이 거래를 삭제하시겠습니까?')) {
      removeTradeLog(id);
    }
  };

  const toggleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
        <i className="fas fa-receipt text-celestial-gold text-lg"></i>
        <h2 className="text-xl font-bold text-white tracking-wider">TRADE JOURNAL</h2>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-3 text-center">
          <div className="text-[10px] text-white/50 mb-1 tracking-widest">TOTAL TRADES</div>
          <div className="text-lg font-bold text-white">{stats.totalTrades}</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-[10px] text-white/50 mb-1 tracking-widest">BUY / SELL</div>
          <div className="text-lg font-bold">
            <span className="text-celestial-cyan">{stats.buyCount}</span>
            <span className="text-white/40 mx-1">/</span>
            <span className="text-danger">{stats.sellCount}</span>
          </div>
        </div>
        <div className="glass-card p-3 text-center md:col-span-2">
          <div className="text-[10px] text-white/50 mb-1 tracking-widest">TOTAL REALIZED P&L</div>
          <div className={`text-lg font-bold ${stats.totalRealized >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
            {stats.totalRealized >= 0 ? '+' : ''}{formatUSD(stats.totalRealized)}
          </div>
        </div>
      </div>

      {/* Top 5 Trade Returns */}
      {topTradeSums.length > 0 && (
        <div className="glass-card p-4">
          <div className="text-[10px] text-white/50 mb-3 tracking-widest">TOP 5 REALIZED P&L BY TICKER</div>
          <div className="space-y-2">
            {topTradeSums.map(([ticker, pnl]) => (
              <div key={ticker} className="flex items-center justify-between">
                <span className="font-semibold text-sm text-white/90">{ticker}</span>
                <span className={`font-bold ${pnl >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
                  {pnl >= 0 ? '+' : ''}{formatUSD(pnl)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Sort */}
      <div className="flex flex-wrap gap-3">
        {/* Ticker Filter */}
        <input
          type="text"
          placeholder="Filter by ticker..."
          value={filterTicker}
          onChange={(e) => setFilterTicker(e.target.value)}
          className="glass-input py-2 px-3 text-sm w-40 rounded-lg"
        />

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TradeType | 'ALL')}
          className="glass-input py-2 px-3 text-sm bg-transparent rounded-lg"
        >
          <option value="ALL" className="bg-[#0a0f29]">All Types</option>
          <option value="BUY" className="bg-[#0a0f29]">BUY</option>
          <option value="SELL" className="bg-[#0a0f29]">SELL</option>
        </select>

        {/* Sort Controls */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => toggleSort('date')}
            className={`celestial-btn text-[9px] ${sortBy === 'date' ? 'border-celestial-cyan/40 text-celestial-cyan' : ''}`}
          >
            <i className={`fas fa-calendar mr-1`} />
            DATE
            {sortBy === 'date' && (
              <i className={`fas fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ml-1 text-[8px]`} />
            )}
          </button>
          <button
            onClick={() => toggleSort('ticker')}
            className={`celestial-btn text-[9px] ${sortBy === 'ticker' ? 'border-celestial-cyan/40 text-celestial-cyan' : ''}`}
          >
            <i className={`fas fa-font mr-1`} />
            TICKER
            {sortBy === 'ticker' && (
              <i className={`fas fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ml-1 text-[8px]`} />
            )}
          </button>
        </div>
      </div>

      {/* Trade List */}
      {filteredAndSortedLogs.length === 0 ? (
        <div className="empty-state py-16">
          <i className="fas fa-receipt text-4xl mb-4 opacity-30" />
          <div className="text-center text-sm opacity-80">
            {tradeLogs.length === 0 ? (
              <>
                아직 추가된 거래가 없습니다<br />
                <span className="text-celestial-gold">&quot;TRADE LOG&quot;</span> 버튼으로<br />
                첫 거래를 기록하세요
              </>
            ) : (
              '필터 조건에 맞는 거래가 없습니다'
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAndSortedLogs.map((trade) => {
            const amount = trade.type === 'BUY'
              ? trade.qty * trade.price + trade.fee
              : trade.qty * trade.price - trade.fee;

            return (
              <div
                key={trade.id}
                className={`glass-card p-4 hover:bg-white/5 transition-all border-l-2 ${
                  trade.type === 'BUY' ? 'border-l-celestial-cyan/50' : 'border-l-danger/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Left: Date, Type, Ticker */}
                  <div className="flex items-center gap-4">
                    <div className="text-[10px] text-white/50 w-20">
                      {new Date(trade.date).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded ${
                      trade.type === 'BUY'
                        ? 'bg-celestial-cyan/20 text-celestial-cyan'
                        : 'bg-danger/20 text-danger'
                    }`}>
                      {trade.type}
                    </div>
                    <div className="font-display font-bold text-sm text-white">
                      {trade.ticker}
                    </div>
                  </div>

                  {/* Center: Details */}
                  <div className="hidden md:flex items-center gap-4 text-[11px] text-white/70">
                    <div>
                      <span className="text-white/50">Qty:</span> {trade.qty}
                    </div>
                    <div>
                      <span className="text-white/50">Price:</span> ${trade.price.toFixed(2)}
                    </div>
                    <div>
                      <span className="text-white/50">Fee:</span> ${trade.fee.toFixed(2)}
                    </div>
                  </div>

                  {/* Right: Realized P&L & Actions */}
                  <div className="flex items-center gap-3">
                    {trade.type === 'SELL' ? (
                      // SELL 거래: BUY 포지션이 있으면 실현 손익 표시, 없으면 거래 금액 표시
                      // tradeSums[ticker]가 있고 값이 BUY 기반 계산값인지 확인하기 위해
                      // 같은 티커의 BUY 거래가 있는지 확인
                      (() => {
                        const hasBuyForTicker = tradeLogs.some(
                          t => t.ticker === trade.ticker && 
                          t.type === 'BUY' && 
                          new Date(t.date).getTime() <= new Date(trade.date).getTime()
                        );
                        
                        // BUY가 있으면 실현 손익 표시, 없으면 거래 금액 표시
                        if (hasBuyForTicker && tradeSums[trade.ticker] !== undefined) {
                          return (
                            <div className="text-[11px] text-white/70">
                              <span className="text-white/50">Realized P&L:</span>{' '}
                              <span className={`font-bold ${tradeSums[trade.ticker] >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
                                {tradeSums[trade.ticker] >= 0 ? '+' : ''}{formatUSD(tradeSums[trade.ticker])}
                              </span>
                            </div>
                          );
                        } else {
                          // BUY가 없거나 tradeSums에 값이 없으면 거래 금액 표시
                          return (
                            <div className="text-[11px] text-white/70">
                              <span className="text-white/50">Trade Amount:</span>{' '}
                              <span className="font-bold text-danger">
                                +{formatUSD(amount)}
                              </span>
                            </div>
                          );
                        }
                      })()
                    ) : (
                      // BUY 거래는 거래 금액 표시
                      <div className={`font-bold text-sm text-celestial-cyan`}>
                        -{formatUSD(amount)}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditTradeModal(trade)}
                        className="w-7 h-7 flex items-center justify-center text-[10px] text-white/50 hover:text-celestial-cyan rounded-lg hover:bg-white/10"
                        title="Edit"
                      >
                        <i className="fas fa-pen" />
                      </button>
                      <button
                        onClick={() => handleDelete(trade.id)}
                        className="w-7 h-7 flex items-center justify-center text-[10px] text-white/50 hover:text-v64-danger rounded-lg hover:bg-white/10"
                        title="Delete"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Details */}
                <div className="md:hidden mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <div className="text-white/50 mb-1">Qty</div>
                    <div className="text-white/90">{trade.qty}</div>
                  </div>
                  <div>
                    <div className="text-white/50 mb-1">Price</div>
                    <div className="text-white/90">${trade.price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-white/50 mb-1">Fee</div>
                    <div className="text-white/90">${trade.fee.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
