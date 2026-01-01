'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNexus } from '@/lib/context';

export default function StrategyBar() {
  const { state, setStrategy } = useNexus();
  const [localStrategy, setLocalStrategy] = useState('');
  const [saved, setSaved] = useState(false);

  // Context에서 strategy 로드
  useEffect(() => {
    setLocalStrategy(state.strategy || '');
  }, [state.strategy]);

  // Debounced 저장
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalStrategy(value);
    setStrategy(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [setStrategy]);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3">
        <i className="fas fa-compass text-celestial-purple text-sm" />
        <span className="text-[10px] tracking-[0.2em] font-display text-celestial-purple">
          STRATEGY & PLAN
        </span>
        <textarea
          value={localStrategy}
          onChange={handleChange}
          className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-[11px] text-white/80 font-light resize-none focus:outline-none focus:border-celestial-purple/40 placeholder-white/30 h-[36px]"
          placeholder="현재 투자 전략, 계획, 메모를 입력하세요... (예: PLTY/HOOY 배당 재투자, VIX 30 이상시 현금 비중 확대)"
        />
        <span className={`text-[8px] text-v64-success transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}>
          저장됨
        </span>
      </div>
    </div>
  );
}
