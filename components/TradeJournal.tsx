'use client';

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { formatUSD } from '@/lib/utils';

type SortBy = 'ticker' | 'amount';
type SortOrder = 'asc' | 'desc';

interface TradeJournalProps {
  compact?: boolean;
  externalShowForm?: boolean;
  onFormClose?: () => void;
}

export default function TradeJournal({ compact = false, externalShowForm, onFormClose }: TradeJournalProps) {
  const { state, setTradeSums, removeTradeSum } = useNexus();
  const { tradeSums } = state;

  const [filterTicker, setFilterTicker] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortBy>('ticker');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // 입력 폼 상태 (외부에서 제어 가능)
  const [internalShowForm, setInternalShowForm] = useState(false);
  const showAddForm = externalShowForm !== undefined ? externalShowForm : internalShowForm;
  const setShowAddForm = onFormClose ? (show: boolean) => { if (!show) onFormClose(); } : setInternalShowForm;

  const [newTicker, setNewTicker] = useState('');
  const [newAmount, setNewAmount] = useState('');

  // 티커 목록 가져오기 (assets에서)
  const allTickers = useMemo(() => {
    return Array.from(new Set(state.assets.map(a => a.ticker)));
  }, [state.assets]);

  // 필터링 & 정렬
  const filteredAndSortedTickers = useMemo(() => {
    // tradeSums에 값이 있는 티커만 표시 (0이 아닌 값)
    const tickersWithTrade = Object.keys(tradeSums || {}).filter(
      ticker => tradeSums[ticker] !== undefined && tradeSums[ticker] !== null && tradeSums[ticker] !== 0
    );

    let tickers = [...tickersWithTrade];

    // 필터링
    if (filterTicker) {
      tickers = tickers.filter(t => t.toLowerCase().includes(filterTicker.toLowerCase()));
    }

    // 정렬
    tickers.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'ticker') {
        comparison = a.localeCompare(b);
      } else if (sortBy === 'amount') {
        const aAmount = tradeSums[a] || 0;
        const bAmount = tradeSums[b] || 0;
        comparison = aAmount - bAmount;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return tickers;
  }, [tradeSums, allTickers, filterTicker, sortBy, sortOrder]);

  // 요약 통계
  const stats = useMemo(() => {
    const totalRealized = tradeSums && typeof tradeSums === 'object' 
      ? Object.values(tradeSums).reduce((sum, val) => {
          const numVal = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
          return sum + numVal;
        }, 0)
      : 0;

    return {
      totalTickers: filteredAndSortedTickers.length,
      totalRealized,
    };
  }, [tradeSums, filteredAndSortedTickers.length]);

  const toggleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleEditTradeReturn = (ticker: string) => {
    const currentValue = tradeSums[ticker] || 0;
    const input = prompt(`${ticker} 실현 손익 (양수/음수 입력):`, currentValue.toString());
    if (input !== null) {
      const amount = parseFloat(input);
      if (!isNaN(amount)) {
        setTradeSums(ticker, amount);
      } else if (input.trim() === '') {
        // 빈 값이면 삭제
        setTradeSums(ticker, 0);
      }
    }
  };

  const handleDelete = (ticker: string) => {
    if (confirm(`${ticker}의 거래 기록을 삭제하시겠습니까?`)) {
      removeTradeSum(ticker);
    }
  };

  const handleAddTrade = () => {
    if (!newTicker.trim()) {
      alert('티커를 입력하세요');
      return;
    }
    if (!newAmount || newAmount.trim() === '') {
      alert('금액을 입력하세요');
      return;
    }

    const amount = parseFloat(newAmount);
    if (isNaN(amount)) {
      alert('올바른 금액을 입력하세요');
      return;
    }

    // 기존 값에 누적
    const currentAmount = tradeSums[newTicker.toUpperCase()] || 0;
    setTradeSums(newTicker.toUpperCase(), currentAmount + amount);

    // 폼 초기화
    setNewTicker('');
    setNewAmount('');
    setShowAddForm(false);
  };

  const handleCancelAdd = () => {
    setNewTicker('');
    setNewAmount('');
    setShowAddForm(false);
  };

  // Compact 모드 (InsightsPanel용)
  if (compact) {
    return (
      <div className="relative h-full">
        {/* 팝업 오버레이 폼 */}
        {showAddForm && (
          <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center p-3">
            <div className="w-full max-w-[200px] space-y-3">
              <div className="text-center text-[10px] text-white/80 tracking-widest mb-2">
                ADD TRADE
              </div>
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                className="w-full bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-[11px] text-white placeholder-white/50 focus:outline-none focus:border-celestial-cyan/50"
                placeholder="TICKER (예: AAPL)"
                autoFocus
              />
              <input
                type="number"
                step="0.01"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-[11px] text-white placeholder-white/50 focus:outline-none focus:border-celestial-cyan/50"
                placeholder="금액 (+/-)"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCancelAdd();
                  }}
                  className="flex-1 text-[9px] py-2 rounded-lg border border-white/30 text-white/70 hover:bg-white/10 transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddTrade();
                  }}
                  className="flex-1 text-[9px] py-2 rounded-lg bg-celestial-cyan/30 border border-celestial-cyan/50 text-celestial-cyan hover:bg-celestial-cyan/40 transition-colors"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {/* Summary */}
          <div className="flex items-center justify-between text-[9px] mb-2 pb-2 border-b border-white/10">
            <span className="text-white/60">{stats.totalTickers}개 종목</span>
            <span className={stats.totalRealized >= 0 ? 'text-v64-success' : 'text-v64-danger'}>
              {stats.totalRealized >= 0 ? '+' : ''}{formatUSD(stats.totalRealized)}
            </span>
          </div>

          {/* Compact List */}
          {filteredAndSortedTickers.length === 0 ? (
            <div className="text-[10px] text-white/60 text-center py-4">
              거래 기록이 없습니다
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredAndSortedTickers.slice(0, 8).map((ticker) => {
                const amount = tradeSums[ticker] || 0;
                return (
                  <div
                    key={ticker}
                    className="flex items-center justify-between bg-white/5 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => handleEditTradeReturn(ticker)}
                  >
                    <span className="text-[10px] font-medium text-white">{ticker}</span>
                    <span className={`text-[10px] font-mono ${amount >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
                      {amount >= 0 ? '+' : ''}{formatUSD(amount)}
                    </span>
                  </div>
                );
              })}
              {filteredAndSortedTickers.length > 8 && (
                <div className="text-[9px] text-white/60 text-center pt-1">
                  +{filteredAndSortedTickers.length - 8}개 더보기
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 기본 모드 (Full)
  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <i className="fas fa-receipt text-celestial-gold text-lg"></i>
          <h2 className="text-xl font-bold text-white tracking-wider">TRADE JOURNAL</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="celestial-btn text-[9px]"
        >
          <i className={`fas fa-${showAddForm ? 'times' : 'plus'} mr-1`} />
          {showAddForm ? 'CANCEL' : 'ADD TRADE'}
        </button>
      </div>

      {/* Add Trade Form */}
      {showAddForm && (
        <div className="glass-card p-4 space-y-3 border border-celestial-cyan/20">
          <div className="grid grid-cols-2 gap-3">
            {/* Ticker */}
            <div>
              <label className="text-[10px] text-white/70 block mb-1 tracking-widest font-medium">
                TICKER
              </label>
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                className="glass-input py-2 w-full uppercase font-semibold rounded-lg text-sm"
                placeholder="e.g. AAPL"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-[10px] text-white/70 block mb-1 tracking-widest font-medium">
                AMOUNT (+/-)
              </label>
              <input
                type="number"
                step="0.01"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="glass-input py-2 w-full rounded-lg text-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCancelAdd}
              className="celestial-btn border-white/20 text-white/70 text-[9px]"
            >
              CANCEL
            </button>
            <button
              onClick={handleAddTrade}
              className="celestial-btn text-[9px]"
            >
              CONFIRM
            </button>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3 text-center">
          <div className="text-[10px] text-white/70 mb-1 tracking-widest">TOTAL TICKERS</div>
          <div className="text-lg font-bold text-white">{stats.totalTickers}</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-[10px] text-white/70 mb-1 tracking-widest">TOTAL REALIZED P&L</div>
          <div className={`text-lg font-bold ${stats.totalRealized >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
            {stats.totalRealized >= 0 ? '+' : ''}{formatUSD(stats.totalRealized)}
          </div>
        </div>
      </div>

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

        {/* Sort Controls */}
        <div className="flex gap-2 ml-auto">
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
          <button
            onClick={() => toggleSort('amount')}
            className={`celestial-btn text-[9px] ${sortBy === 'amount' ? 'border-celestial-cyan/40 text-celestial-cyan' : ''}`}
          >
            <i className={`fas fa-dollar-sign mr-1`} />
            AMOUNT
            {sortBy === 'amount' && (
              <i className={`fas fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ml-1 text-[8px]`} />
            )}
          </button>
        </div>
      </div>

      {/* Trade List */}
      {filteredAndSortedTickers.length === 0 ? (
        <div className="empty-state py-16">
          <i className="fas fa-receipt text-4xl mb-4 opacity-30" />
          <div className="text-center text-sm opacity-80">
            {Object.keys(tradeSums || {}).length === 0 ? (
              <>
                아직 거래 기록이 없습니다<br />
                티커를 클릭하여 실현 손익을 입력하세요
              </>
            ) : (
              '필터 조건에 맞는 티커가 없습니다'
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAndSortedTickers.map((ticker) => {
            const amount = tradeSums[ticker] || 0;

            return (
              <div
                key={ticker}
                className="glass-card p-4 hover:bg-white/5 transition-all border-l-2 border-l-celestial-cyan/50"
              >
                <div className="flex items-center justify-between">
                  {/* Left: Ticker */}
                  <div className="flex items-center gap-4">
                    <div className="font-display font-bold text-sm text-white">
                      {ticker}
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => handleEditTradeReturn(ticker)}
                      className={`cursor-pointer font-bold text-sm px-3 py-1 rounded transition-all hover:opacity-80 ${
                        amount >= 0 ? 'text-v64-success bg-v64-success/10' : 'text-v64-danger bg-v64-danger/10'
                      }`}
                    >
                      {amount >= 0 ? '+' : ''}{formatUSD(amount)}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditTradeReturn(ticker)}
                        className="w-7 h-7 flex items-center justify-center text-[10px] text-white/70 hover:text-celestial-cyan rounded-lg hover:bg-white/10"
                        title="Edit"
                      >
                        <i className="fas fa-pen" />
                      </button>
                      <button
                        onClick={() => handleDelete(ticker)}
                        className="w-7 h-7 flex items-center justify-center text-[10px] text-white/70 hover:text-v64-danger rounded-lg hover:bg-white/10"
                        title="Delete"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </div>
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