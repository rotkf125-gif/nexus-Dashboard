'use client';

import { useState, useEffect } from 'react';

export default function StrategyBar() {
  const [strategy, setStrategy] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedStrategy = localStorage.getItem('nexus_strategy') || '';
    setStrategy(savedStrategy);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setStrategy(value);
    localStorage.setItem('nexus_strategy', value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3">
        <i className="fas fa-compass text-celestial-purple text-sm" />
        <span className="text-[10px] tracking-[0.2em] font-display text-celestial-purple">
          STRATEGY & PLAN
        </span>
        <textarea
          value={strategy}
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
