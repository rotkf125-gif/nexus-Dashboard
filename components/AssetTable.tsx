'use client';

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { SECTORS, TYPE_COLORS, CHART_COLORS, TYPE_ORDER, TYPE_INFO, getChartColor } from '@/lib/config';
import { Asset, AssetWithIndex, AssetType } from '@/lib/types';
import { formatUSD, getReturnColorClass, getPriceChangeIndicator, groupAssetsByType } from '@/lib/utils';

export default function AssetTable() {
  const { state, removeAsset, openEditAssetModal, updateAssets } = useNexus();
  const { assets, exchangeRate, previousPrices, compactMode } = state;
  
  // 드래그 정렬 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // 접힌 섹션 상태
  const [collapsedTypes, setCollapsedTypes] = useState<Set<string>>(new Set());

  // Type별로 자산 그룹화 (with originalIndex)
  const groupedAssets = useMemo(() => {
    const assetsWithIndex: AssetWithIndex[] = assets.map((asset, index) => ({
      ...asset,
      originalIndex: index,
    }));
    return groupAssetsByType(assetsWithIndex);
  }, [assets]);

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

  const toggleCollapse = (type: string) => {
    setCollapsedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  if (assets.length === 0) {
    return (
      <div className="empty-state py-16">
        <i className="fas fa-satellite text-4xl mb-4 opacity-30" />
        <div className="text-center text-sm opacity-80">
          아직 추가된 자산이 없습니다<br />
          <span className="text-celestial-gold">&quot;IGNITE STAR&quot;</span> 버튼으로<br />
          첫 자산을 추가하세요
        </div>
      </div>
    );
  }

  // 자산 행 렌더링 함수
  const renderAssetRow = (a: Asset & { originalIndex: number }, globalIndex: number) => {
    const i = a.originalIndex;
    const cost = a.qty * a.avg;
    const value = a.qty * a.price;
    const profit = value - cost;
    const pl = cost > 0 ? ((value - cost) / cost * 100) : 0;
    const tickerColor = CHART_COLORS[globalIndex % CHART_COLORS.length];
    const plClass = pl >= 0 ? 'text-v64-success' : 'text-v64-danger';
    const sectorInfo = SECTORS[a.sector] || SECTORS.Other;
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
    const rowClass = pl >= 0 ? 'asset-row asset-row-profit' : 'asset-row asset-row-loss';

    if (compactMode) {
      return (
        <tr 
          key={i} 
          className={`transition-all border-b border-white/5 ${isDragging ? 'opacity-80' : ''} ${isDragOver ? 'bg-celestial-purple/20' : ''}`}
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
          <td className="p-2 text-right text-[10px] opacity-90">{a.qty}</td>
          <td className="p-2 text-right text-[10px]">${a.price.toFixed(2)}</td>
          <td className="p-2 text-right text-[10px]">{formatUSD(value)}</td>
          <td className={`p-2 text-center text-[10px] font-medium ${plClass}`}>
            {pl >= 0 ? '+' : ''}{pl.toFixed(1)}%
          </td>
        </tr>
      );
    }

    return (
      <tr 
        key={i} 
        className={`${rowClass} transition-all border-b border-white/5 ${isDragging ? 'opacity-80' : ''} ${isDragOver ? 'bg-celestial-purple/20' : ''}`}
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
                <span className="text-[10px] opacity-90 font-light">{a.qty}주</span>
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
  };

  // 글로벌 인덱스 추적
  let globalIndex = 0;

  return (
    <div className="space-y-4">
      {TYPE_ORDER.map(type => {
        const group = groupedAssets[type];
        if (!group || group.assets.length === 0) return null;

        const typeInfo = TYPE_INFO[type];
        const typeColor = TYPE_COLORS[type] || TYPE_COLORS.CORE;
        const isCollapsed = collapsedTypes.has(type);
        const profit = group.totalValue - group.totalCost;
        const returnPct = group.totalCost > 0 ? ((profit / group.totalCost) * 100) : 0;
        const plClass = returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger';

        const startIndex = globalIndex;
        globalIndex += group.assets.length;

        return (
          <div key={type} className="rounded-lg overflow-hidden border border-white/10">
            {/* Type Header */}
            <div 
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
              style={{ backgroundColor: `${typeColor}10`, borderLeft: `3px solid ${typeColor}` }}
              onClick={() => toggleCollapse(type)}
            >
              <div className="flex items-center gap-3">
                <i className={`fas fa-${typeInfo.icon} text-sm`} style={{ color: typeColor }} />
                <div>
                  <span className="text-[12px] font-display tracking-wider" style={{ color: typeColor }}>
                    {typeInfo.label}
                  </span>
                  <span className="text-[9px] opacity-80 ml-2">{typeInfo.description}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 opacity-90">
                  {group.assets.length}종목
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[11px] text-white">{formatUSD(group.totalValue)}</div>
                  <div className={`text-[10px] ${plClass}`}>
                    {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                  </div>
                </div>
                <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'} text-[10px] opacity-80`} />
              </div>
            </div>

            {/* Asset Table */}
            {!isCollapsed && (
              <div className="overflow-x-auto bg-black/20">
                <table className="w-full text-sm font-light border-separate border-spacing-y-0">
                  {!compactMode && (
                    <thead className="text-[9px] font-sans uppercase tracking-widest bg-black/30">
                      <tr>
                        <th className="p-2 w-8 border-b border-white/10" />
                        <th className="p-2 text-left border-b border-white/10 font-medium opacity-90">Ticker</th>
                        <th className="p-2 text-center border-b border-white/10 font-medium opacity-90">Return</th>
                        <th className="p-2 text-right border-b border-white/10 font-medium opacity-90">Avg</th>
                        <th className="p-2 text-right border-b border-white/10 font-medium opacity-90">Price</th>
                        <th className="p-2 text-right border-b border-white/10 font-medium opacity-90">Val($)</th>
                        <th className="p-2 text-right border-b border-white/10 font-medium opacity-90">Val(₩)</th>
                        <th className="p-2 text-right border-b border-white/10 font-medium opacity-90">FX Rate</th>
                        <th className="p-2 text-right border-b border-white/10 font-medium opacity-90">FX P/L</th>
                        <th className="p-2 text-center w-20 border-b border-white/10" />
                      </tr>
                    </thead>
                  )}
                  {compactMode && (
                    <thead className="text-[8px] font-sans uppercase tracking-widest bg-black/30">
                      <tr>
                        <th className="p-1.5 w-6 border-b border-white/10" />
                        <th className="p-2 text-left border-b border-white/10 font-medium opacity-90">Ticker</th>
                        <th className="p-2 text-right border-b border-white/10 font-medium opacity-90">Qty</th>
                        <th className="p-2 text-right border-b border-white/10 font-medium opacity-90">Price</th>
                        <th className="p-2 text-right border-b border-white/10 font-medium opacity-90">Value</th>
                        <th className="p-2 text-center border-b border-white/10 font-medium opacity-90">P/L</th>
                      </tr>
                    </thead>
                  )}
                  <tbody className="font-light text-gray-300">
                    {group.assets.map((asset, idx) => renderAssetRow(asset, startIndex + idx))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
