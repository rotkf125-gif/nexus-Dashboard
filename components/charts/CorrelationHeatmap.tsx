'use client';

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { useCorrelationData, getCorrelationColor } from '@/lib/hooks/useCorrelationData';

type ViewMode = 'sector' | 'asset';

interface CorrelationHeatmapProps {
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export default function CorrelationHeatmap({
  collapsible = false,
  defaultExpanded = false,
}: CorrelationHeatmapProps) {
  const { state } = useNexus();
  const [viewMode, setViewMode] = useState<ViewMode>('sector');
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const { labels, data } = useCorrelationData(state.assets, viewMode);

  const hoveredValue = useMemo(() => {
    if (!hoveredCell || !data[hoveredCell.row]) return null;
    return {
      row: labels[hoveredCell.row],
      col: labels[hoveredCell.col],
      value: data[hoveredCell.row][hoveredCell.col],
    };
  }, [hoveredCell, data, labels]);

  // 히트맵 콘텐츠 렌더링
  const renderHeatmapContent = () => {
    if (labels.length === 0) {
      return (
        <div className="h-32 flex items-center justify-center text-white/50 text-sm">
          <div className="text-center">
            <i className="fas fa-th text-2xl mb-2 opacity-30" aria-hidden="true" />
            <div>자산을 추가하세요</div>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* View Mode Toggle */}
        <div className="flex gap-1 mb-4" role="tablist" aria-label="뷰 모드 선택">
          <button
            role="tab"
            aria-selected={viewMode === 'sector'}
            onClick={() => setViewMode('sector')}
            className={`px-3 py-1.5 text-[10px] rounded transition-all focus-visible-ring ${
              viewMode === 'sector'
                ? 'bg-celestial-purple/20 text-celestial-purple border border-celestial-purple/30'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            섹터
          </button>
          <button
            role="tab"
            aria-selected={viewMode === 'asset'}
            onClick={() => setViewMode('asset')}
            className={`px-3 py-1.5 text-[10px] rounded transition-all focus-visible-ring ${
              viewMode === 'asset'
                ? 'bg-celestial-purple/20 text-celestial-purple border border-celestial-purple/30'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            자산
          </button>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto custom-scrollbar">
          <div className="inline-block min-w-full">
            {/* Header Row */}
            <div className="flex">
              <div className="w-20 flex-shrink-0" />
              {labels.map((label, i) => (
                <div
                  key={i}
                  className="w-12 h-8 flex items-center justify-center text-[9px] text-white/60 font-medium"
                  style={{ transform: 'rotate(-45deg)', transformOrigin: 'center' }}
                >
                  <span className="truncate max-w-[60px]" title={label}>
                    {label.length > 6 ? `${label.slice(0, 6)}...` : label}
                  </span>
                </div>
              ))}
            </div>

            {/* Data Rows */}
            {data.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center">
                {/* Row Label */}
                <div className="w-20 flex-shrink-0 text-[9px] text-white/60 font-medium pr-2 text-right truncate">
                  <span title={labels[rowIndex]}>
                    {labels[rowIndex].length > 10
                      ? `${labels[rowIndex].slice(0, 10)}...`
                      : labels[rowIndex]}
                  </span>
                </div>

                {/* Cells */}
                {row.map((value, colIndex) => (
                  <div
                    key={colIndex}
                    className="w-12 h-10 p-0.5"
                    onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <div
                      className={`w-full h-full rounded flex items-center justify-center text-[9px] font-mono transition-all cursor-pointer heatmap-cell ${
                        hoveredCell?.row === rowIndex || hoveredCell?.col === colIndex
                          ? 'ring-1 ring-white/30'
                          : ''
                      }`}
                      style={{
                        backgroundColor: getCorrelationColor(value),
                        color: Math.abs(value) > 0.5 ? '#000' : '#fff',
                      }}
                      title={`${labels[rowIndex]} - ${labels[colIndex]}: ${value.toFixed(2)}`}
                    >
                      {value.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Hover Info */}
        {hoveredValue && (
          <div
            className="mt-3 p-2 bg-white/5 rounded text-xs text-center"
            aria-live="polite"
          >
            <span className="text-white/70">{hoveredValue.row}</span>
            <span className="text-white/40 mx-2">↔</span>
            <span className="text-white/70">{hoveredValue.col}</span>
            <span className="text-white/40 mx-2">:</span>
            <span
              className="font-mono font-semibold"
              style={{ color: getCorrelationColor(hoveredValue.value) }}
            >
              {hoveredValue.value.toFixed(2)}
            </span>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center justify-center gap-1">
            <span className="text-[9px] text-white/50 mr-2">낮음</span>
            {[-0.8, -0.4, 0, 0.4, 0.8].map((v, i) => (
              <div
                key={i}
                className="w-6 h-3 rounded-sm"
                style={{ backgroundColor: getCorrelationColor(v) }}
                title={v.toString()}
              />
            ))}
            <span className="text-[9px] text-white/50 ml-2">높음</span>
          </div>
        </div>
      </>
    );
  };

  // Collapsible 모드
  if (collapsible) {
    return (
      <div className="collapsible-section">
        <button
          className="collapsible-header"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <h3 className="text-sm font-display tracking-widest text-white flex items-center gap-2">
            <i className="fas fa-th text-celestial-purple text-xs" aria-hidden="true" />
            상관관계 히트맵
          </h3>
          <i
            className={`fas fa-chevron-down collapsible-chevron ${isExpanded ? 'expanded' : ''}`}
            aria-hidden="true"
          />
        </button>
        <div className={`collapsible-content ${isExpanded ? 'expanded' : ''}`}>
          <div className="p-4">
            {renderHeatmapContent()}
          </div>
        </div>
      </div>
    );
  }

  // 일반 모드
  return (
    <div className="inner-glass p-4 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display tracking-widest text-white flex items-center gap-2">
          <i className="fas fa-th text-celestial-purple text-xs" aria-hidden="true" />
          상관관계 히트맵
        </h3>
      </div>
      {renderHeatmapContent()}
    </div>
  );
}
