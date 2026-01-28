'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { TAX_CONFIG } from '@/lib/config';
import { Dividend } from '@/lib/types';

interface DividendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DividendModal({ isOpen, onClose }: DividendModalProps) {
  const { state, addDividend, toast } = useNexus();
  
  // INCOME 타입 자산만 필터링
  const incomeAssets = useMemo(() => 
    state.assets.filter(a => a.type === 'INCOME'),
    [state.assets]
  );

  const [date, setDate] = useState('');
  const [ticker, setTicker] = useState('');
  const [qty, setQty] = useState(0);
  const [dps, setDps] = useState(0);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setTicker(incomeAssets[0]?.ticker || '');
      setQty(incomeAssets[0]?.qty || 0);
      setDps(0);
      setIsDuplicate(false);
    }
  }, [isOpen, incomeAssets]);

  // 티커 변경 시 수량 자동 업데이트
  useEffect(() => {
    const asset = state.assets.find(a => a.ticker === ticker);
    if (asset) {
      setQty(asset.qty);
    }
  }, [ticker, state.assets]);

  // 중복 체크
  useEffect(() => {
    if (date && ticker && dps > 0) {
      const duplicate = state.dividends.some(
        d => d.date === date && d.ticker === ticker && Math.abs(d.dps - dps) < 0.0001
      );
      setIsDuplicate(duplicate);
    } else {
      setIsDuplicate(false);
    }
  }, [date, ticker, dps, state.dividends]);

  // 세후 배당금 계산 (15% 세금)
  const afterTax = useMemo(() => {
    const gross = qty * dps;
    return gross * TAX_CONFIG.AFTER_TAX_RATE;
  }, [qty, dps]);

  const handleSave = () => {
    if (!date || !ticker || qty <= 0 || dps <= 0) {
      toast('모든 필드를 입력하세요', 'warning');
      return;
    }

    if (isDuplicate) {
      if (!confirm('중복된 배당 기록이 있습니다. 그래도 추가하시겠습니까?')) {
        return;
      }
    }

    const dividend: Dividend = {
      date,
      ticker,
      qty,
      dps,
    };

    addDividend(dividend);
    toast('배당 기록 추가됨', 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card w-[380px] p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-5 border-b border-celestial-gold/20 pb-3">
          <h3 className="font-semibold text-celestial-gold text-base tracking-widest font-display">
            DIVIDEND
          </h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Duplicate Warning */}
        {isDuplicate && (
          <div className="bg-v64-danger/10 border border-v64-danger/30 p-2 rounded-lg mb-3">
            <div className="text-[11px] text-v64-danger font-mono font-medium">
              <i className="fas fa-exclamation-triangle mr-1" /> 중복 배당 감지됨!
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-3">
          {/* Date */}
          <div>
            <label className="text-[10px] text-celestial-gold/60 block mb-1 tracking-widest font-medium">
              DATE
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass-input py-2.5 w-full rounded-lg"
            />
          </div>

          {/* Ticker */}
          <div>
            <label className="text-[10px] text-celestial-gold/60 block mb-1 tracking-widest font-medium">
              TICKER
            </label>
            <select
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="glass-input py-2.5 w-full bg-transparent font-medium rounded-lg"
            >
              {incomeAssets.length > 0 ? (
                incomeAssets.map((asset) => (
                  <option key={asset.ticker} value={asset.ticker} className="bg-[#0a0f29]">
                    {asset.ticker}
                  </option>
                ))
              ) : (
                <option value="" className="bg-[#0a0f29]">INCOME 자산 없음</option>
              )}
            </select>
          </div>

          {/* Qty & DPS */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-celestial-gold/60 block mb-1 tracking-widest font-medium">
                QTY
              </label>
              <input
                type="number"
                value={qty || ''}
                onChange={(e) => setQty(Number(e.target.value))}
                className="glass-input py-2.5 w-full text-right rounded-lg"
              />
            </div>
            <div>
              <label className="text-[10px] text-celestial-gold/60 block mb-1 tracking-widest font-medium">
                DPS
              </label>
              <input
                type="number"
                step="0.0001"
                value={dps || ''}
                onChange={(e) => setDps(Number(e.target.value))}
                className="glass-input py-2.5 w-full text-right rounded-lg"
                placeholder="0.0000"
              />
            </div>
          </div>

          {/* After Tax Preview */}
          <div className="inner-glass p-4 text-center rounded-xl border border-celestial-gold/20">
            <div className="text-[10px] text-celestial-gold/60 mb-1 tracking-widest font-medium">
              AFTER TAX (15%)
            </div>
            <div className="text-xl font-semibold text-white font-display">
              ${afterTax.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            onClick={onClose}
            className="celestial-btn border-white/20 text-white/70"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={incomeAssets.length === 0}
            className="celestial-btn celestial-btn-gold disabled:opacity-70"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}
