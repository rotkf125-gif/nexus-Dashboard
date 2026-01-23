'use client';

import React, { memo } from 'react';
import { AssetWithIndex } from '@/lib/types';
import { formatUSD, getPriceChangeIndicator } from '@/lib/utils';
import { SECTORS, CHART_COLORS } from '@/lib/config';
import { ColumnKey } from '@/lib/hooks/useAssetTable';

interface AssetTableRowProps {
  asset: AssetWithIndex;
  globalIndex: number;
  exchangeRate: number;
  previousPrice: number;
  visibleColumns: Set<ColumnKey>;
  isDragging: boolean;
  isDragOver: boolean;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  dragHandlers: {
    handleDragStart: (e: React.DragEvent, index: number) => void;
    handleDragOver: (e: React.DragEvent, index: number) => void;
    handleDragLeave: () => void;
    handleDrop: (e: React.DragEvent, index: number) => void;
    handleDragEnd: () => void;
  };
}

const AssetTableRow = memo(({
  asset: a,
  globalIndex,
  exchangeRate,
  previousPrice,
  visibleColumns,
  isDragging,
  isDragOver,
  onEdit,
  onRemove,
  dragHandlers
}: AssetTableRowProps) => {
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

  // 손익에 따른 배경 효과
  const profitBgClass = profit >= 0 
    ? 'bg-gradient-to-r from-emerald-500/5 to-transparent' 
    : 'bg-gradient-to-r from-rose-500/8 to-transparent';

  // 가격 변화 인디케이터
  const priceChange = getPriceChangeIndicator(a.price, previousPrice || 0);

  const isColumnVisible = (key: ColumnKey) => visibleColumns.has(key);

  return (
    <tr
      className={`transition-all border-b border-white/5 hover:bg-white/10 ${profitBgClass} ${isDragging ? 'opacity-80' : ''} ${isDragOver ? 'bg-celestial-purple/20' : ''}`}
      draggable
      onDragStart={(e) => dragHandlers.handleDragStart(e, i)}
      onDragOver={(e) => dragHandlers.handleDragOver(e, i)}
      onDragLeave={dragHandlers.handleDragLeave}
      onDrop={(e) => dragHandlers.handleDrop(e, i)}
      onDragEnd={dragHandlers.handleDragEnd}
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
      {isColumnVisible('qty') && (
        <td className="p-1.5 text-center text-[10px] text-white/80">{a.qty}</td>
      )}
      {/* 3. Return: 수익금 + (수익률 %) */}
      {isColumnVisible('return') && (
        <td className={`p-1.5 pr-4 text-center ${plClass}`}>
          <div className="text-[10px] font-semibold">
            {profit >= 0 ? '+' : ''}{formatUSD(profit)}
          </div>
          <div className="text-[9px] opacity-80">
            ({pl >= 0 ? '+' : ''}{pl.toFixed(1)}%)
          </div>
        </td>
      )}
      {/* 4. Avg */}
      {isColumnVisible('avg') && (
        <td className="p-1.5 text-right text-[10px] text-white/70">${a.avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      )}
      {/* 5. Price + 가격 변화 인디케이터 */}
      {isColumnVisible('price') && (
        <td className={`p-1.5 pr-4 text-right relative ${priceChange ? (priceChange.isUp ? 'price-flash-up' : 'price-flash-down') : ''}`}>
          <div className="flex items-center justify-end">
            <span className={`text-[10px] text-white/90 font-medium ${priceChange ? 'price-count-animation' : ''}`}>
              ${a.price.toFixed(2)}
            </span>
          </div>
          {priceChange && (
            <span className={`price-indicator ${priceChange.isUp ? 'price-indicator-up' : 'price-indicator-down'}`}>
              <i className={`fas fa-caret-${priceChange.isUp ? 'up' : 'down'}`} />
              <span>{Math.abs(priceChange.pct).toFixed(1)}%</span>
            </span>
          )}
        </td>
      )}
      {/* 6. Val($) + P/L($) */}
      {isColumnVisible('valUsd') && (
        <td className="p-1.5 text-right">
          <div className="text-[10px] text-white">{formatUSD(value)}</div>
          <div className={`text-[9px] ${plClass}`}>
            ({profit >= 0 ? '+' : ''}{formatUSD(profit)})
          </div>
        </td>
      )}
      {/* 7. Val(₩) + P/L(₩) */}
      {isColumnVisible('valKrw') && (
        <td className="p-1.5 pr-4 text-right">
          <div className="text-[10px] text-white/80">₩{valueKrw.toLocaleString()}</div>
          <div className={`text-[9px] ${profitKrwClass}`}>
            ({profitKrw >= 0 ? '+' : ''}₩{Math.abs(profitKrw).toLocaleString()})
          </div>
        </td>
      )}
      {/* 8. FX Rate */}
      {isColumnVisible('fxRate') && (
        <td className="p-1.5 text-center text-[10px] text-celestial-gold/80">₩{buyRate.toLocaleString()}</td>
      )}
      {/* 9. FX P/L */}
      {isColumnVisible('fxPL') && (
        <td className={`p-1.5 text-right text-[10px] ${fxClass}`}>
          {fxPL >= 0 ? '+' : ''}₩{Math.abs(fxPL).toLocaleString()}
        </td>
      )}
      {/* Actions */}
      <td className="p-1 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            className="w-5 h-5 flex items-center justify-center text-[9px] text-white/50 hover:text-celestial-cyan transition-colors"
            title="편집"
            onClick={() => onEdit(i)}
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
              if (confirm('Delete?')) onRemove(i);
            }}
          >
            <i className="fas fa-trash" />
          </button>
        </div>
      </td>
    </tr>
  );
});

AssetTableRow.displayName = 'AssetTableRow';
export default AssetTableRow;
