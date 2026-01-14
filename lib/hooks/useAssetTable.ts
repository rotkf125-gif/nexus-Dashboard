import { useState, useMemo, useEffect, useCallback } from 'react';
import { Asset, AssetWithIndex } from '../types';
import { groupAssetsByType } from '../utils';

export type ColumnKey = 'qty' | 'return' | 'avg' | 'price' | 'valUsd' | 'valKrw' | 'fxRate' | 'fxPL';

export interface ColumnConfig {
  key: ColumnKey;
  label: string;
  labelEng: string;
  defaultVisible: boolean;
}

export const COLUMNS: ColumnConfig[] = [
  { key: 'qty', label: '수량', labelEng: 'Qty', defaultVisible: true },
  { key: 'return', label: '수익', labelEng: 'Return', defaultVisible: true },
  { key: 'avg', label: '평균가', labelEng: 'Avg', defaultVisible: true },
  { key: 'price', label: '현재가', labelEng: 'Price', defaultVisible: true },
  { key: 'valUsd', label: '평가($)', labelEng: 'Val($)', defaultVisible: true },
  { key: 'valKrw', label: '평가(₩)', labelEng: 'Val(₩)', defaultVisible: true },
  { key: 'fxRate', label: '환율', labelEng: 'FX Rate', defaultVisible: false },
  { key: 'fxPL', label: '환손익', labelEng: 'FX P/L', defaultVisible: false },
];

const STORAGE_KEY = 'nexus_visible_columns';

export function useAssetTable(
  assets: Asset[],
  updateAssets: (assets: Asset[]) => void
) {
  // --- State ---
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [collapsedTypes, setCollapsedTypes] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(() => {
    return new Set(COLUMNS.filter(c => c.defaultVisible).map(c => c.key));
  });

  // --- Effects ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVisibleColumns(new Set(parsed as ColumnKey[]));
      } catch { /* ignore */ }
    }
  }, []);

  // --- Logic ---
  const isColumnVisible = useCallback((key: ColumnKey) => visibleColumns.has(key), [visibleColumns]);

  const toggleColumn = useCallback((key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const resetColumns = useCallback((mode: 'all' | 'default') => {
    let next: Set<ColumnKey>;
    if (mode === 'all') {
      next = new Set(COLUMNS.map(c => c.key));
    } else {
      next = new Set(COLUMNS.filter(c => c.defaultVisible).map(c => c.key));
    }
    setVisibleColumns(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
  }, []);

  const toggleCollapse = useCallback((type: string) => {
    setCollapsedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  // Grouping
  const groupedAssets = useMemo(() => {
    const assetsWithIndex: AssetWithIndex[] = assets.map((asset, index) => ({
      ...asset,
      originalIndex: index,
    }));
    return groupAssetsByType(assetsWithIndex);
  }, [assets]);

  // Drag & Drop Handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newAssets = [...assets];
    const [draggedItem] = newAssets.splice(draggedIndex, 1);
    newAssets.splice(dropIndex, 0, draggedItem);

    updateAssets(newAssets);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [assets, draggedIndex, updateAssets]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  return {
    groupedAssets,
    visibleColumns,
    collapsedTypes,
    draggedIndex,
    dragOverIndex,
    isColumnVisible,
    toggleColumn,
    resetColumns,
    toggleCollapse,
    dragHandlers: {
      handleDragStart,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleDragEnd,
    },
  };
}
