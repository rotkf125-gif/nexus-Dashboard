// ═══════════════════════════════════════════════════════════════
// NEXUS V1.7 - Modal Management Hook
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';

interface UseModalReturn<T> {
  isOpen: boolean;
  data: T | null;
  open: (data?: T) => void;
  close: () => void;
  toggle: () => void;
}

export function useModal<T = undefined>(
  initialOpen: boolean = false
): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((data?: T) => {
    setData(data ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
  };
}

// Specialized modal hook for editing items
interface UseEditModalReturn<T> {
  isOpen: boolean;
  editingItem: T | null;
  editingIndex: number | null;
  openAdd: () => void;
  openEdit: (item: T, index: number) => void;
  close: () => void;
  isEditing: boolean;
}

export function useEditModal<T>(): UseEditModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const openAdd = useCallback(() => {
    setEditingItem(null);
    setEditingIndex(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((item: T, index: number) => {
    setEditingItem(item);
    setEditingIndex(index);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingItem(null);
    setEditingIndex(null);
  }, []);

  return {
    isOpen,
    editingItem,
    editingIndex,
    openAdd,
    openEdit,
    close,
    isEditing: editingIndex !== null,
  };
}
