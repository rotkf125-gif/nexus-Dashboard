'use client';

import React, { useState } from 'react';
import { useNexus } from '@/lib/context';
import { useAssetTable, COLUMNS } from '@/lib/hooks/useAssetTable';
import AssetTableRow from './AssetTableRow';
import { TYPE_INFO, TYPE_ORDER, TYPE_COLORS, CHART_COLORS, SECTORS } from '@/lib/config';
import { formatUSD, getPriceChangeIndicator } from '@/lib/utils';

export default function AssetTable() {
  const { state, removeAsset, openEditAssetModal, updateAssets } = useNexus();
  const { assets, exchangeRate, previousPrices } = state;
  const [isColSettingsOpen, setIsColSettingsOpen] = useState(false);

  const {
    groupedAssets,
    visibleColumns,
    collapsedTypes,
    draggedIndex,
    dragOverIndex,
    isColumnVisible,
    toggleColumn,
    resetColumns,
    toggleCollapse,
    dragHandlers,
  } = useAssetTable(assets, updateAssets);

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

  // 글로벌 인덱스 추적
  let globalIndex = 0;

  return (
    <div className="space-y-4">
      {/* 컬럼 설정 버튼 */}
      <div className="flex justify-end mb-2">
        <div className="relative">
          <button
            onClick={() => setIsColSettingsOpen(!isColSettingsOpen)}
            className="celestial-btn text-[9px] flex items-center gap-1.5"
            title="컬럼 설정"
          >
            <i className="fas fa-columns" />
            <span className="hidden sm:inline">컬럼</span>
          </button>
          {isColSettingsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsColSettingsOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-50 inner-glass p-3 rounded-lg min-w-[180px] shadow-lg border border-white/20">
                <div className="text-[10px] text-white/60 mb-2 uppercase tracking-wider">표시할 컬럼</div>
                <div className="space-y-1.5">
                  {COLUMNS.map(col => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1.5 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isColumnVisible(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        className="w-3.5 h-3.5 rounded border-white/30 bg-white/10 checked:bg-celestial-cyan checked:border-celestial-cyan"
                      />
                      <span className="text-[11px] text-white/80">{col.label}</span>
                      <span className="text-[9px] text-white/40 ml-auto">{col.labelEng}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-white/10 flex gap-2">
                  <button
                    onClick={() => resetColumns('all')}
                    className="text-[9px] text-celestial-cyan hover:underline"
                  >
                    모두 표시
                  </button>
                  <button
                    onClick={() => resetColumns('default')}
                    className="text-[9px] text-white/60 hover:underline"
                  >
                    기본값
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {TYPE_ORDER.map(type => {
        const group = groupedAssets[type];
        if (!group || group.assets.length === 0) return null;

        const typeInfo = TYPE_INFO[type as keyof typeof TYPE_INFO];
        const typeColor = TYPE_COLORS[type as keyof typeof TYPE_COLORS] || TYPE_COLORS.CORE;
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

            {/* Asset Content */}
            {!isCollapsed && (
              <>
                {/* Mobile Card View (< md) */}
                <div className="md:hidden p-3 space-y-2 bg-black/10">
                  {group.assets.map((a, idx) => {
                    const i = a.originalIndex;
                    const cost = a.qty * a.avg;
                    const value = a.qty * a.price;
                    const profit = value - cost;
                    const pl = cost > 0 ? ((value - cost) / cost * 100) : 0;
                    const tickerColor = CHART_COLORS[(startIndex + idx) % CHART_COLORS.length];
                    const plClass = pl >= 0 ? 'text-v64-success' : 'text-v64-danger';
                    const sectorInfo = SECTORS[a.sector] || SECTORS.Other;
                    const buyRate = a.buyRate || exchangeRate;
                    const valueKrw = Math.round(value * exchangeRate);
                    const costKrw = Math.round(cost * buyRate);
                    const profitKrw = valueKrw - costKrw;
                    const profitKrwClass = profitKrw >= 0 ? 'text-v64-success' : 'text-v64-danger';
                    const priceChange = getPriceChangeIndicator(a.price, previousPrices[a.ticker] || 0);
                    const profitBgClass = profit >= 0 ? 'border-l-emerald-500/50' : 'border-l-rose-500/50';

                    return (
                      <div
                        key={i}
                        className={`inner-glass p-3 rounded-lg border-l-2 ${profitBgClass} transition-all hover:bg-white/5`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-sm font-bold" style={{ color: tickerColor }}>
                              {a.ticker}
                            </span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded border"
                              style={{
                                background: `${sectorInfo.color}15`,
                                borderColor: `${sectorInfo.color}40`,
                                color: sectorInfo.color
                              }}
                            >
                              {sectorInfo.emoji} {sectorInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="w-7 h-7 flex items-center justify-center text-[10px] text-white/50 hover:text-celestial-cyan rounded-lg hover:bg-white/10" onClick={() => openEditAssetModal(i)}>
                              <i className="fas fa-pen" />
                            </button>
                            <button className="w-7 h-7 flex items-center justify-center text-[10px] text-white/50 hover:text-v64-danger rounded-lg hover:bg-white/10" onClick={() => { if (confirm('Delete?')) removeAsset(i); }}>
                              <i className="fas fa-trash" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="text-center">
                            <div className="text-[9px] text-white/50 uppercase">수량</div>
                            <div className="text-[11px] text-white font-medium">{a.qty}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[9px] text-white/50 uppercase">평균가</div>
                            <div className="text-[11px] text-white/80">${a.avg.toFixed(2)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[9px] text-white/50 uppercase">현재가</div>
                            <div className={`text-[11px] text-white font-medium flex items-center justify-center gap-1 ${priceChange ? (priceChange.isUp ? 'price-flash-up' : 'price-flash-down') : ''}`}>
                              ${a.price.toFixed(2)}
                              {priceChange && (
                                <span className={`text-[8px] ${priceChange.isUp ? 'text-v64-success' : 'text-v64-danger'}`}>
                                  <i className={`fas fa-caret-${priceChange.isUp ? 'up' : 'down'}`} />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                          <div>
                            <div className="text-[9px] text-white/50 uppercase mb-1">평가금액</div>
                            <div className="text-[12px] text-white font-semibold">{formatUSD(value)}</div>
                            <div className="text-[10px] text-white/60">₩{valueKrw.toLocaleString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] text-white/50 uppercase mb-1">손익</div>
                            <div className={`text-[12px] font-bold ${plClass}`}>
                              {profit >= 0 ? '+' : ''}{formatUSD(profit)}
                              <span className="text-[10px] opacity-80 ml-1">({pl >= 0 ? '+' : ''}{pl.toFixed(1)}%)</span>
                            </div>
                            <div className={`text-[10px] ${profitKrwClass}`}>
                              {profitKrw >= 0 ? '+' : ''}₩{Math.abs(profitKrw).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto bg-black/20">
                  <table className="w-full text-sm font-light border-separate border-spacing-y-0">
                    <thead className="text-[8px] font-sans uppercase tracking-widest bg-black/30">
                      <tr>
                        <th className="p-1 border-b border-white/10 w-[3%]" />
                        <th className="p-1.5 text-left border-b border-white/10 font-medium opacity-80 w-[12%]">Ticker</th>
                        {isColumnVisible('qty') && <th className="p-1.5 text-center border-b border-white/10 font-medium opacity-80 w-[6%]">Qty</th>}
                        {isColumnVisible('return') && <th className="p-1.5 pr-4 text-center border-b border-white/10 font-medium opacity-80 w-[11%]">Return</th>}
                        {isColumnVisible('avg') && <th className="p-1.5 text-right border-b border-white/10 font-medium opacity-80 w-[9%]">Avg</th>}
                        {isColumnVisible('price') && <th className="p-1.5 pr-4 text-right border-b border-white/10 font-medium opacity-80 w-[10%]">Price</th>}
                        {isColumnVisible('valUsd') && <th className="p-1.5 text-right border-b border-white/10 font-medium opacity-80 w-[12%]">Val($)</th>}
                        {isColumnVisible('valKrw') && <th className="p-1.5 pr-4 text-right border-b border-white/10 font-medium opacity-80 w-[11%]">Val(₩)</th>}
                        {isColumnVisible('fxRate') && <th className="p-1.5 text-center border-b border-white/10 font-medium opacity-80 w-[8%]">FX Rate</th>}
                        {isColumnVisible('fxPL') && <th className="p-1.5 text-right border-b border-white/10 font-medium opacity-80 w-[8%]">FX P/L</th>}
                        <th className="p-1 border-b border-white/10 w-[8%]" />
                      </tr>
                    </thead>
                    <tbody className="font-light text-gray-300">
                      {group.assets.map((asset, idx) => (
                        <AssetTableRow
                          key={asset.originalIndex}
                          asset={asset}
                          globalIndex={startIndex + idx}
                          exchangeRate={exchangeRate}
                          previousPrice={previousPrices[asset.ticker]}
                          visibleColumns={visibleColumns}
                          isDragging={draggedIndex === asset.originalIndex}
                          isDragOver={dragOverIndex === asset.originalIndex}
                          onEdit={openEditAssetModal}
                          onRemove={removeAsset}
                          dragHandlers={dragHandlers}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}