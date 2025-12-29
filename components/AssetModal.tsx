'use client';

import { useState, useEffect } from 'react';
import { Asset } from '@/lib/types';
import { SECTORS } from '@/lib/config';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Asset) => void;
  editingAsset?: Asset | null;
  editingIndex?: number | null;
  exchangeRate: number;
}

const TYPE_OPTIONS = [
  { value: 'CORE', label: 'CORE (장기 성장)' },
  { value: 'INCOME', label: 'INCOME (배당)' },
  { value: 'GROWTH', label: 'GROWTH (고성장)' },
  { value: 'VALUE', label: 'VALUE (가치주)' },
  { value: 'SPECULATIVE', label: 'SPECULATIVE (투기)' },
];

const SECTOR_OPTIONS = Object.entries(SECTORS).map(([key, info]) => ({
  value: key,
  label: `${info.emoji} ${key}`,
}));

export default function AssetModal({
  isOpen,
  onClose,
  onSave,
  editingAsset,
  editingIndex,
  exchangeRate,
}: AssetModalProps) {
  const [ticker, setTicker] = useState('');
  const [qty, setQty] = useState(0);
  const [avg, setAvg] = useState(0);
  const [buyRate, setBuyRate] = useState(exchangeRate);
  const [type, setType] = useState<Asset['type']>('CORE');
  const [sector, setSector] = useState('Technology');

  const isEditMode = editingAsset !== null && editingAsset !== undefined;

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      if (editingAsset) {
        // 수정 모드
        setTicker(editingAsset.ticker);
        setQty(editingAsset.qty);
        setAvg(editingAsset.avg);
        setBuyRate(editingAsset.buyRate || exchangeRate);
        setType(editingAsset.type);
        setSector(editingAsset.sector);
      } else {
        // 추가 모드 - 초기화
        setTicker('');
        setQty(0);
        setAvg(0);
        setBuyRate(exchangeRate);
        setType('CORE');
        setSector('Technology');
      }
    }
  }, [isOpen, editingAsset, exchangeRate]);

  const handleSave = () => {
    if (!ticker.trim()) {
      alert('티커를 입력하세요');
      return;
    }
    if (qty <= 0) {
      alert('수량을 입력하세요');
      return;
    }

    const asset: Asset = {
      ticker: ticker.toUpperCase().trim(),
      qty,
      avg,
      price: editingAsset?.price || 0,
      type,
      sector,
      buyRate: buyRate || exchangeRate,
    };

    onSave(asset);
    onClose();
  };

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
            {isEditMode ? `EDIT ${editingAsset?.ticker}` : 'ADD ASSET'}
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
          {/* Ticker - 수정 모드에서는 비활성화 */}
          <div>
            <label className="text-[10px] text-white/50 block mb-1 tracking-widest font-medium">
              TICKER
            </label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              disabled={isEditMode}
              className={`glass-input py-2.5 w-full uppercase font-semibold rounded-lg ${
                isEditMode ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              placeholder="e.g. AAPL"
            />
          </div>

          {/* Qty, Avg, BuyRate */}
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
              />
            </div>
            <div>
              <label className="text-[10px] text-white/50 block mb-1 tracking-widest font-medium">
                AVG COST
              </label>
              <input
                type="number"
                step="0.01"
                value={avg || ''}
                onChange={(e) => setAvg(Number(e.target.value))}
                className="glass-input py-2.5 w-full rounded-lg"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/50 block mb-1 tracking-widest font-medium">
                매입환율
              </label>
              <input
                type="number"
                value={buyRate || ''}
                onChange={(e) => setBuyRate(Number(e.target.value))}
                className="glass-input py-2.5 w-full rounded-lg"
                placeholder="1450"
              />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="text-[10px] text-white/50 block mb-1 tracking-widest font-medium">
              TYPE
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Asset['type'])}
              className="glass-input py-2.5 w-full bg-transparent font-medium rounded-lg"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0a0f29]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sector */}
          <div>
            <label className="text-[10px] text-white/50 block mb-1 tracking-widest font-medium">
              SECTOR
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="glass-input py-2.5 w-full bg-transparent font-medium rounded-lg"
            >
              {SECTOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0a0f29]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
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
