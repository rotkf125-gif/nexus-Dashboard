'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UndoRedoActions<T> {
  set: (newState: T, actionName?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  lastAction: string | null;
}

const MAX_HISTORY = 10;

export function useUndoRedo<T>(
  initialState: T,
  onStateChange?: (state: T) => void
): [T, UndoRedoActions<T>] {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const [lastAction, setLastAction] = useState<string | null>(null);
  const isInternalUpdate = useRef(false);

  // 외부에서 상태가 변경되면 present 업데이트
  useEffect(() => {
    if (!isInternalUpdate.current) {
      setState(prev => ({
        ...prev,
        present: initialState,
      }));
    }
    isInternalUpdate.current = false;
  }, [initialState]);

  const set = useCallback((newState: T, actionName?: string) => {
    isInternalUpdate.current = true;
    setState(prev => {
      const newPast = [...prev.past, prev.present].slice(-MAX_HISTORY);
      return {
        past: newPast,
        present: newState,
        future: [],
      };
    });
    setLastAction(actionName || 'update');
    onStateChange?.(newState);
  }, [onStateChange]);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.past.length === 0) return prev;

      const newPast = prev.past.slice(0, -1);
      const newPresent = prev.past[prev.past.length - 1];
      const newFuture = [prev.present, ...prev.future].slice(0, MAX_HISTORY);

      isInternalUpdate.current = true;
      onStateChange?.(newPresent);

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
    setLastAction('undo');
  }, [onStateChange]);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.future.length === 0) return prev;

      const newFuture = prev.future.slice(1);
      const newPresent = prev.future[0];
      const newPast = [...prev.past, prev.present].slice(-MAX_HISTORY);

      isInternalUpdate.current = true;
      onStateChange?.(newPresent);

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
    setLastAction('redo');
  }, [onStateChange]);

  return [
    state.present,
    {
      set,
      undo,
      redo,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      undoCount: state.past.length,
      redoCount: state.future.length,
      lastAction,
    },
  ];
}

// 키보드 단축키 훅
export function useUndoRedoKeyboard(
  undo: () => void,
  redo: () => void,
  canUndo: boolean,
  canRedo: boolean,
  toast?: (message: string, type?: string) => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Z (Mac) or Ctrl+Z (Windows) for Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
          toast?.('실행 취소됨', 'info');
        } else {
          toast?.('더 이상 취소할 수 없습니다', 'warning');
        }
      }

      // Cmd+Shift+Z (Mac) or Ctrl+Shift+Z / Ctrl+Y (Windows) for Redo
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') ||
        ((e.metaKey || e.ctrlKey) && e.key === 'y')
      ) {
        e.preventDefault();
        if (canRedo) {
          redo();
          toast?.('다시 실행됨', 'info');
        } else {
          toast?.('더 이상 다시 실행할 수 없습니다', 'warning');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, toast]);
}
