'use client';

import { useState } from 'react';
import { useNexus } from '@/lib/context';
import { SECTORS, TYPE_COLORS, CHART_COLORS } from '@/lib/config';

export default function AssetTable() {
  const { state, removeAsset, openEditAssetModal, updateAssets } = useNexus();
  const { assets, exchangeRate, previousPrices, compactMode } = state;
  
  // 드래그 정렬 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const formatUSD = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getDeltaHtml = (current: number, previous: number) => {
    if (!previous || previous === 0 || current === previous) return null;
    const diff = current - previous;
    const pct = ((diff / previous) * 100).toFixed(1);
    const isUp = diff > 0;
    return (
      <span className={`delta-indicator ${isUp ? 'positive' : 'negative'}`}>
        <i className={`fas fa-caret-${isUp ? 'up' : 'down'}`} />
        {isUp ? '+' : ''}{pct}%
      </span>
    );
  };

  // 드래그 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newAssets = [...assets];
    const [draggedItem] = newAssets.splice(draggedIndex, 1);
    newAssets.splice(dropIndex, 0, draggedItem);
    
    updateAssets(newAssets);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (assets.length === 0) {
    return (
      <div className="empty-state py-16">
        <i className="fas fa-satellite text-4xl mb-4 opacity-30" />
        <div className="text-center text-sm opacity-50">
          아직 추가된 자산이 없습니다<br />
          <span className="text-celestial-gold">&quot;IGNITE STAR&quot;</span> 버튼으로<br />
          첫 자산을 추가하세요
        </div>
      </div>
    );
  }

  // Compact 모드: 간소화된 테이블
  if (compactMode) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-light border-separate border-spacing-y-0">
          <thead className="text-[9px] font-sans uppercase tracking-widest sticky top-0 bg-[#0a0f29] z-10">
            <tr>
              <th className="p-1.5 w-6 border-b border-white/15" />
              <th className="p-2 text-left border-b border-white/15 font-medium opacity-85">Ticker</th>
              <th className="p-2 text-right border-b border-white/15 font-medium opacity-85">Qty</th>
              <th className="p-2 text-right border-b border-white/15 font-medium opacity-85">Price</th>
              <th className="p-2 text-right border-b border-white/15 font-medium opacity-85">Value</th>
              <th className="p-2 text-center border-b border-white/15 font-medium opacity-85">P/L</th>
            </tr>
          </thead>
          <tbody className="font-light text-gray-300">
            {assets.map((a, i) => {
              const cost = a.qty * a.avg;
              const value = a.qty * a.price;
              const pl = cost > 0 ? ((value - cost) / cost * 100) : 0;
              const tickerColor = CHART_COLORS[i % CHART_COLORS.length];
              const plClass = pl >= 0 ? 'text-v64-success' : 'text-v64-danger';
              const isDragging = draggedIndex === i;
              const isDragOver = dragOverIndex === i;

              return (
                <tr 
                  key={i} 
                  className={`transition-all border-b border-white/5 ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'bg-celestial-purple/20' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
                >
                  <td className="p-1.5 text-center">
                    <span className="drag-handle cursor-grab active:cursor-grabbing">
                      <i className="fas fa-grip-vertical text-[10px]" />
                    </span>
                  </td>
                  <td className="p-2">
                    <span className="font-display text-[11px]" style={{ color: tickerColor }}>{a.ticker}</span>
                  </td>
                  <td className="p-2 text-right text-[10px] opacity-70">{a.qty}</td>
                  <td className="p-2 text-right text-[10px]">${a.price.toFixed(2)}</td>
                  <td className="p-2 text-right text-[10px]">{formatUSD(value)}</td>
                  <td className={`p-2 text-center text-[10px] font-medium ${plClass}`}>
                    {pl >= 0 ? '+' : ''}{pl.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // 일반 모드: 전체 테이블
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-light border-separate border-spacing-y-0">
        <thead className="text-[10px] font-sans uppercase tracking-widest sticky top-0 bg-[#0a0f29] z-10">
          <tr>
            <th className="p-2 w-8 border-b border-white/15" />
            <th className="p-3 text-left border-b border-white/15 pl-2 font-medium opacity-85">Constellation</th>
            <th className="p-3 text-center border-b border-white/15 font-medium opacity-85">Return</th>
            <th className="p-3 text-right border-b border-white/15 font-medium opacity-85">Avg</th>
            <th className="p-3 text-right border-b border-white/15 font-medium opacity-85">Price</th>
            <th className="p-3 text-right border-b border-white/15 font-medium opacity-85">Val($)</th>
            <th className="p-3 text-right border-b border-white/15 font-medium opacity-85">Val(₩)</th>
            <th className="p-3 text-right border-b border-white/15 font-medium opacity-85">FX Rate</th>
            <th className="p-3 text-right border-b border-white/15 font-medium opacity-85">FX P/L</th>
            <th className="p-3 text-center w-20 border-b border-white/15" />
          </tr>
        </thead>
        <tbody className="font-light text-gray-300">
          {assets.map((a, i) => {
            const cost = a.qty * a.avg;
            const value = a.qty * a.price;
            const profit = value - cost;
            const pl = cost > 0 ? ((value - cost) / cost * 100) : 0;
            const tickerColor = CHART_COLORS[i % CHART_COLORS.length];
            const plClass = pl >= 0 ? 'text-v64-success' : 'text-v64-danger';
            const rowClass = pl >= 0 ? 'asset-row asset-row-profit' : 'asset-row asset-row-loss';
            const sectorInfo = SECTORS[a.sector] || SECTORS.Other;
            const typeColor = TYPE_COLORS[a.type] || TYPE_COLORS.CORE;
            const buyRate = a.buyRate || exchangeRate;
            const valueKrw = Math.round(value * exchangeRate);
            const costKrw = Math.round(cost * buyRate);
            const profitKrw = valueKrw - costKrw;
            const profitKrwClass = profitKrw >= 0 ? 'text-v64-success' : 'text-v64-danger';
            const fxPL = Math.round(value * (exchangeRate - buyRate));
            const fxClass = fxPL >= 0 ? 'text-v64-success' : 'text-v64-danger';
            
            let warningBadge = null;
            if (pl <= -20) {
              warningBadge = <span className="warning-badge warning-badge-red" title="심각한 손실">!</span>;
            } else if (pl <= -10) {
              warningBadge = <span className="warning-badge warning-badge-yellow" title="주의">!</span>;
            }
            
            const prevPrice = previousPrices[a.ticker] || 0;
            const isDragging = draggedIndex === i;
            const isDragOver = dragOverIndex === i;

            return (
              <tr 
                key={i} 
                className={`${rowClass} transition-all border-b border-white/5 ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'bg-celestial-purple/20' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
              >
                <td className="p-2 text-center">
                  <span className="drag-handle cursor-grab active:cursor-grabbing" title="드래그하여 순서 변경">
                    <i className="fas fa-grip-vertical" />
                  </span>
                </td>
                <td className="p-3 pl-2 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 flex items-center justify-center border border-white/20 bg-white/5 rounded"
                      style={{ color: tickerColor }}
                    >
                      <span className="font-display text-[10px]">{a.ticker}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <span 
                          className="text-[9px] px-1.5 py-0.5 border rounded font-light opacity-80"
                          style={{ borderColor: `${typeColor}40`, color: typeColor }}
                        >
                          {a.type || 'CORE'}
                        </span>
                        <span className="text-[10px] opacity-70 font-light">{a.qty}주</span>
                        {warningBadge}
                      </div>
                      <div 
                        className="sector-badge"
                        style={{ 
                          background: `${sectorInfo.color}10`, 
                          borderColor: `${sectorInfo.color}30`, 
                          color: sectorInfo.color 
                        }}
                      >
                        {sectorInfo.emoji} {sectorInfo.label}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex flex-col">
                    <span className={`${plClass} font-medium text-[11px]`}>
                      {profit >= 0 ? '+' : ''}{formatUSD(profit)}
                    </span>
                    <span className={`${plClass} text-[10px] opacity-80`}>
                      ({pl >= 0 ? '+' : ''}{pl.toFixed(1)}%)
                    </span>
                  </div>
                </td>
                <td className="p-3 text-right text-[11px] opacity-80 font-light">${a.avg.toFixed(2)}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end">
                    <span className="text-[11px] text-white font-light">${a.price.toFixed(2)}</span>
                    {getDeltaHtml(a.price, prevPrice)}
                  </div>
                </td>
                <td className="p-3 text-right">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white font-light">{formatUSD(value)}</span>
                    <span className={`text-[9px] ${plClass} font-light`}>
                      ({profit >= 0 ? '+' : ''}{formatUSD(profit)})
                    </span>
                  </div>
                </td>
                <td className="p-3 text-right">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white font-light">₩{valueKrw.toLocaleString()}</span>
                    <span className={`text-[9px] ${profitKrwClass} font-light`}>
                      ({profitKrw >= 0 ? '+' : ''}₩{Math.abs(profitKrw).toLocaleString()})
                    </span>
                  </div>
                </td>
                <td className="p-3 text-right text-[10px] text-celestial-gold font-light">
                  ₩{buyRate.toLocaleString()}
                </td>
                <td className={`p-3 text-right text-[10px] ${fxClass} font-light`}>
                  {fxPL >= 0 ? '+' : ''}₩{Math.abs(fxPL).toLocaleString()}
                </td>
                <td className="p-3 text-center">
                  <div className="quick-actions">
                    <button 
                      className="quick-action-btn" 
                      title="편집"
                      onClick={() => openEditAssetModal(i)}
                    >
                      <i className="fas fa-pen" />
                    </button>
                    <button 
                      className="quick-action-btn" 
                      title="차트"
                      onClick={() => window.open(`https://finance.yahoo.com/quote/${a.ticker}/chart`, '_blank')}
                    >
                      <i className="fas fa-chart-line" />
                    </button>
                    <button 
                      className="quick-action-btn"
                      title="삭제"
                      onClick={() => {
                        if (confirm('Delete?')) removeAsset(i);
                      }}
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
