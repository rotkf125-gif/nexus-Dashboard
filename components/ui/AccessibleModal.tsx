'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'w-[90vw] max-w-[320px] sm:w-[320px]',
  md: 'w-[90vw] max-w-[420px] sm:w-[420px]',
  lg: 'w-[90vw] max-w-[520px] sm:w-[520px]',
  xl: 'w-[90vw] max-w-[640px] sm:w-[640px]',
  full: 'w-[95vw] max-w-[900px]',
};

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = '',
  size = 'md',
}: AccessibleModalProps) {
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`);
  const descId = useRef(`modal-desc-${Math.random().toString(36).substr(2, 9)}`);

  const containerRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
    autoFocus: true,
    restoreFocus: true,
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        aria-describedby={description ? descId.current : undefined}
        className={`
          relative glass-card p-4 sm:p-6 max-h-[90vh] overflow-y-auto custom-scrollbar
          ${sizeClasses[size]}
          ${className}
        `}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <h2
            id={titleId.current}
            className="text-base sm:text-lg font-display tracking-widest text-white"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors focus-visible-ring touch-target"
            aria-label="닫기"
          >
            <i className="fas fa-times text-sm" aria-hidden="true" />
          </button>
        </div>

        {/* Description (if provided) */}
        {description && (
          <p
            id={descId.current}
            className="text-sm text-white/60 mb-4"
          >
            {description}
          </p>
        )}

        {/* Content */}
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AccessibleModal;
