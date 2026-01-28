'use client';

import { useEffect } from 'react';
import { useNexus } from '@/lib/context';

export default function UndoRedoIndicator() {
  const { undo, redo, canUndo, canRedo, undoCount, redoCount, toast } = useNexus();

  // 키보드 단축키 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 무시
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Cmd+Z (Mac) or Ctrl+Z (Windows) for Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
          toast('실행 취소됨', 'info');
        } else {
          toast('더 이상 취소할 수 없습니다', 'warning');
        }
      }

      // Cmd+Shift+Z (Mac) or Ctrl+Y (Windows) for Redo
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') ||
        ((e.metaKey || e.ctrlKey) && e.key === 'y')
      ) {
        e.preventDefault();
        if (canRedo) {
          redo();
          toast('다시 실행됨', 'info');
        } else {
          toast('더 이상 다시 실행할 수 없습니다', 'warning');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, toast]);

  return (
    <div className="flex items-center gap-1">
      {/* Undo Button */}
      <button
        onClick={() => {
          if (canUndo) {
            undo();
            toast('실행 취소됨', 'info');
          }
        }}
        disabled={!canUndo}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
          canUndo
            ? 'text-white/70 hover:text-white hover:bg-white/10 cursor-pointer'
            : 'text-white/20 cursor-not-allowed'
        }`}
        title={`실행 취소 (${undoCount}/10) - Ctrl+Z`}
      >
        <i className="fas fa-undo text-xs" />
      </button>

      {/* Redo Button */}
      <button
        onClick={() => {
          if (canRedo) {
            redo();
            toast('다시 실행됨', 'info');
          }
        }}
        disabled={!canRedo}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
          canRedo
            ? 'text-white/70 hover:text-white hover:bg-white/10 cursor-pointer'
            : 'text-white/20 cursor-not-allowed'
        }`}
        title={`다시 실행 (${redoCount}) - Ctrl+Shift+Z`}
      >
        <i className="fas fa-redo text-xs" />
      </button>

      {/* History Counter */}
      {(undoCount > 0 || redoCount > 0) && (
        <span className="text-[9px] text-white/60 ml-1 hidden sm:inline">
          {undoCount}/{10}
        </span>
      )}
    </div>
  );
}
