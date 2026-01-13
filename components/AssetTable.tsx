'use client';

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { SECTORS, TYPE_COLORS, CHART_COLORS, TYPE_ORDER, TYPE_INFO, getChartColor } from '@/lib/config';
import { Asset, AssetWithIndex, AssetType } from '@/lib/types';
import { formatUSD, getReturnColorClass, getPriceChangeIndicator, groupAssetsByType } from '@/lib/utils';

export default function AssetTable() {
  const { state, removeAsset, openEditAssetModal, updateAssets } = useNexus();
  const { assets, exchangeRate, previousPrices } = state;
  
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

  // 자산 행 렌더링 함수 (Unified Compact Layout)
  // 열 순서: Ticker(sector) / Qty / Return / Avg / Price / Val($)+P/L($) / Val(₩)+P/L(₩) / FX Rate / FX P/L
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

    const isDragging = draggedIndex === i;
    const isDragOver = dragOverIndex === i;

    // 손익에 따른 배경 효과
    const profitBgClass = profit >= 0 
      ? 'bg-gradient-to-r from-emerald-500/5 to-transparent' 
      : 'bg-gradient-to-r from-rose-500/8 to-transparent';

    // 가격 변화 인디케이터
    const priceChange = getPriceChangeIndicator(a.price, previousPrices[a.ticker] || 0);

    return (
      <tr
        key={i}
        className={`transition-all border-b border-white/5 hover:bg-white/10 ${profitBgClass} ${isDragging ? 'opacity-80' : ''} ${isDragOver ? 'bg-celestial-purple/20' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, i)}
        onDragOver={(e) => handleDragOver(e, i)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, i)}
        onDragEnd={handleDragEnd}
      >
        {/* Drag Handle */}
        <td className="p-1 text-center w-6">
          <span className="drag-handle cursor-grab active:cursor-grabbing opacity-40 hover:opacity-80">
            <i className="fas fa-grip-vertical text-[9px]" />
          </span>
        </td>
        {/* 1. Ticker + Sector */}
        <td className="p-1.5 pl-2">
          <div className="flex items-center gap-2">
            <span className="font-display text-[11px] font-medium" style={{ color: tickerColor }}>{a.ticker}</span>
            <span
              className="text-[8px] px-1 py-0.5 rounded border"
              style={{
                background: `${sectorInfo.color}10`,
                borderColor: `${sectorInfo.color}30`,
                color: sectorInfo.color
              }}
            >
              {sectorInfo.emoji}
            </span>
          </div>
        </td>
        {/* 2. Qty */}
        <td className="p-1.5 text-center text-[10px] text-white/80">{a.qty}</td>
        {/* 3. Return: 수익금 + (수익률 %) */}
        <td className={`p-1.5 text-center ${plClass}`}>
          <div className="text-[10px] font-semibold">
            {profit >= 0 ? '+' : ''}{formatUSD(profit)}
          </div>
          <div className="text-[9px] opacity-80">
            ({pl >= 0 ? '+' : ''}{pl.toFixed(1)}%)
          </div>
        </td>
        {/* 4. Avg */}
        <td className="p-1.5 text-right text-[10px] text-white/70">${a.avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        {/* 5. Price + 가격 변화 인디케이터 */}
        <td className="p-1.5 text-right">
          <div className="flex items-center justify-end gap-1">
            <span className="text-[10px] text-white/90">${a.price.toFixed(2)}</span>
            {priceChange && (
              <span 
                className={`text-[8px] flex items-center gap-0.5 px-1 py-0.5 rounded ${
                  priceChange.isUp 
                    ? 'text-emerald-400 bg-emerald-500/20' 
                    : 'text-rose-400 bg-rose-500/20'
                } animate-pulse`}
              >
                <i className={`fas fa-caret-${priceChange.isUp ? 'up' : 'down'}`} />
                <span>{Math.abs(priceChange.pct).toFixed(1)}%</span>
              </span>
            )}
          </div>
        </td>
        {/* 6. Val($) + P/L($) */}
        <td className="p-1.5 pr-1 text-right">
          <div className="text-[10px] text-white">{formatUSD(value)}</div>
          <div className={`text-[9px] ${plClass}`}>
            ({profit >= 0 ? '+' : ''}{formatUSD(profit)})
          </div>
        </td>
        {/* 7. Val(₩) + P/L(₩) */}
        <td className="p-1.5 pl-1 text-right">
          <div className="text-[10px] text-white/80">₩{valueKrw.toLocaleString()}</div>
          <div className={`text-[9px] ${profitKrwClass}`}>
            ({profitKrw >= 0 ? '+' : ''}₩{Math.abs(profitKrw).toLocaleString()})
          </div>
        </td>
        {/* 8. FX Rate */}
        <td className="p-1.5 pr-1 text-center text-[10px] text-celestial-gold/80">₩{buyRate.toLocaleString()}</td>
        {/* 9. FX P/L */}
        <td className={`p-1.5 pl-1 text-right text-[10px] ${fxClass}`}>
          {fxPL >= 0 ? '+' : ''}₩{Math.abs(fxPL).toLocaleString()}
        </td>
        {/* Actions */}
        <td className="p-1 text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              className="w-5 h-5 flex items-center justify-center text-[9px] text-white/50 hover:text-celestial-cyan transition-colors"
              title="편집"
              onClick={() => openEditAssetModal(i)}
            >
              <i className="fas fa-pen" />
            </button>
            <button
              className="w-5 h-5 flex items-center justify-center text-[9px] text-white/50 hover:text-celestial-gold transition-colors"
              title="차트"
              onClick={() => window.open(`https://finance.yahoo.com/quote/${a.ticker}/chart`, '_blank')}
            >
              <i className="fas fa-chart-line" />
            </button>
            <button
              className="w-5 h-5 flex items-center justify-center text-[9px] text-white/50 hover:text-v64-danger transition-colors"
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

            {/* Asset Table - Unified Compact Layout */}
            {/* 열 순서: Ticker(sector) / Qty / Return / Avg / Price / Val($)+P/L($) / Val(₩)+P/L(₩) / FX Rate / FX P/L */}
            {!isCollapsed && (
              <div className="overflow-x-auto bg-black/20">
                <table className="w-full text-sm font-light border-separate border-spacing-y-0 table-fixed">
                  <colgroup>
                    <col className="w-[3%]" />   {/* Drag */}
                    <col className="w-[10%]" />  {/* Ticker */}
                    <col className="w-[6%]" />   {/* Qty */}
                    <col className="w-[11%]" />  {/* Return */}
                    <col className="w-[9%]" />   {/* Avg */}
                    <col className="w-[11%]" />  {/* Price */}
                    <col className="w-[12%]" />  {/* Val($) */}
                    <col className="w-[12%]" />  {/* Val(₩) */}
                    <col className="w-[8%]" />   {/* FX Rate */}
                    <col className="w-[8%]" />   {/* FX P/L */}
                    <col className="w-[10%]" />  {/* Actions */}
                  </colgroup>
                  <thead className="text-[8px] font-sans uppercase tracking-widest bg-black/30">
                    <tr>
                      <th className="p-1 border-b border-white/10" />
                      <th className="p-1.5 text-left border-b border-white/10 font-medium opacity-80">Ticker</th>
                      <th className="p-1.5 text-center border-b border-white/10 font-medium opacity-80">Qty</th>
                      <th className="p-1.5 text-center border-b border-white/10 font-medium opacity-80">Return</th>
                      <th className="p-1.5 text-right border-b border-white/10 font-medium opacity-80">Avg</th>
                      <th className="p-1.5 text-right border-b border-white/10 font-medium opacity-80">Price</th>
                      <th className="p-1.5 pr-1 text-right border-b border-white/10 font-medium opacity-80">Val($)</th>
                      <th className="p-1.5 pl-1 text-right border-b border-white/10 font-medium opacity-80">Val(₩)</th>
                      <th className="p-1.5 pr-1 text-center border-b border-white/10 font-medium opacity-80">FX Rate</th>
                      <th className="p-1.5 pl-1 text-right border-b border-white/10 font-medium opacity-80">FX P/L</th>
                      <th className="p-1 border-b border-white/10" />
                    </tr>
                  </thead>
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
