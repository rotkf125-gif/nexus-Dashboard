'use client';

import { useState, useEffect } from 'react';
import { TradeLog, TradeType } from '@/lib/types';
import { useNexus } from '@/lib/context';
import { v4 as uuidv4 } from 'uuid';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: TradeLog) => void;
  editingTrade: TradeLog | null;
}

export default function TradeModal({
  isOpen,
  onClose,
  onSave,
  editingTrade,
}: TradeModalProps) {
  const { state } = useNexus();

  const [date, setDate] = useState('');
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<TradeType>('BUY');
  const [qty, setQty] = useState(0);
  const [price, setPrice] = useState(0);
  const [fee, setFee] = useState(0);
  const [showTickerSuggestions, setShowTickerSuggestions] = useState(false);

  const isEditMode = editingTrade !== null && editingTrade !== undefined;

  // 티커 자동완성용 필터링
  const allTickers = Array.from(new Set(state.assets.map(a => a.ticker)));
  const filteredTickers = ticker.length >= 1
    ? allTickers.filter(t => t.toLowerCase().includes(ticker.toLowerCase()))
    : [];

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      if (editingTrade) {
        // 수정 모드
        setDate(editingTrade.date);
        setTicker(editingTrade.ticker);
        setType(editingTrade.type);
        setQty(editingTrade.qty);
        setPrice(editingTrade.price);
        setFee(editingTrade.fee);
      } else {
        // 추가 모드 - 초기화
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
        setTicker('');
        setType('BUY');
        setQty(0);
        setPrice(0);
        setFee(0);
      }
    }
  }, [isOpen, editingTrade]);

  const handleSave = () => {
    if (!ticker.trim()) {
      alert('티커를 입력하세요');
      return;
    }
    if (!date) {
      alert('날짜를 선택하세요');
      return;
    }
    if (qty <= 0) {
      alert('수량을 입력하세요');
      return;
    }
    if (price <= 0) {
      alert('가격을 입력하세요');
      return;
    }

    const trade: TradeLog = {
      id: editingTrade?.id || uuidv4(),
      date,
      ticker: ticker.toUpperCase().trim(),
      type,
      qty,
      price,
      fee,
    };

    onSave(trade);
    onClose();
  };

  // 총 금액 계산
  const totalAmount = type === 'BUY'
    ? qty * price + fee
    : qty * price - fee;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card w-[420px] p-6">
        {/* Header */}
        <div className={`flex justify-between items-center mb-5 border-b pb-3 ${
          isEditMode ? 'border-celestial-purple/20' : 'border-white/10'
        }`}>
          <h3 className={`font-semibold text-base tracking-widest font-display ${
            isEditMode ? 'text-celestial-purple' : 'text-white'
          }`}>
            {isEditMode ? 'EDIT TRADE' : 'ADD TRADE'}
          </h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3">
          {/* Date */}
          <div>
            <label className="text-[10px] text-white/50 block mb-1 tracking-widest font-medium">
              DATE
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass-input py-2.5 w-full rounded-lg"
            />
          </div>

          {/* Ticker with Autocomplete */}
          <div className="relative">
            <label className="text-[10px] text-white/50 block mb-1 tracking-widest font-medium">
              TICKER
            </label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => {
                setTicker(e.target.value.toUpperCase());
                setShowTickerSuggestions(true);
              }}
              onFocus={() => setShowTickerSuggestions(true)}
              onBlur={() => setTimeout(() => setShowTickerSuggestions(false), 200)}
              className="glass-input py-2.5 w-full uppercase font-semibold rounded-lg"
              placeholder="e.g. AAPL"
            />
            {showTickerSuggestions && filteredTickers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 glass-card max-h-40 overflow-y-auto z-10">
                {filteredTickers.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTicker(t);
                      setShowTickerSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm font-semibold text-white/80 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* BUY/SELL Toggle */}
          <div>
            <label className="text-[10px] text-white/50 block mb-1 tracking-widest font-medium">
              TYPE
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setType('BUY')}
                className={`py-2.5 rounded-lg font-semibold text-sm tracking-wider transition-all ${
                  type === 'BUY'
                    ? 'bg-celestial-cyan/20 border border-celestial-cyan/40 text-celestial-cyan'
                    : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => setType('SELL')}
                className={`py-2.5 rounded-lg font-semibold text-sm tracking-wider transition-all ${
                  type === 'SELL'
                    ? 'bg-danger/20 border border-danger/40 text-danger'
                    : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
                }`}
              >
                SELL
              </button>
            </div>
          </div>

          {/* Qty, Price, Fee */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-white/50 block mb-1 tracking-widest font-medium">
                QTY
              </label>
              <input
                type="number"
                value={qty || ''}
                onChange={(e) => setQty(Number(e.target.value))}
                className="glass-input py-2.5 w-full rounded-lg"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/50 block mb-1 tracking-widest font-medium">
                PRICE
              </label>
              <input
                type="number"
                step="0.01"
                value={price || ''}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="glass-input py-2.5 w-full rounded-lg"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/50 block mb-1 tracking-widest font-medium">
                FEE
              </label>
              <input
                type="number"
                step="0.01"
                value={fee || ''}
                onChange={(e) => setFee(Number(e.target.value))}
                className="glass-input py-2.5 w-full rounded-lg"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Amount Preview */}
          {qty > 0 && price > 0 && (
            <div className="glass-card p-3 bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/50 tracking-widest font-medium">
                  TOTAL AMOUNT
                </span>
                <span className={`font-semibold text-sm ${
                  type === 'BUY' ? 'text-celestial-cyan' : 'text-danger'
                }`}>
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="text-[9px] text-white/30 mt-1">
                {type === 'BUY'
                  ? `${qty} × $${price.toFixed(2)} + $${fee.toFixed(2)} fee`
                  : `${qty} × $${price.toFixed(2)} - $${fee.toFixed(2)} fee`
                }
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            onClick={onClose}
            className="celestial-btn border-white/20 text-white/50"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className={`celestial-btn ${
              isEditMode
                ? 'border-celestial-purple/40 text-celestial-purple'
                : ''
            }`}
          >
            {isEditMode ? 'SAVE' : 'CONFIRM'}
          </button>
        </div>
      </div>
    </div>
  );
}
