// ═══════════════════════════════════════════════════════════════
// NEXUS V65.1 - Toast Notification Hook
// ═══════════════════════════════════════════════════════════════

import { useCallback } from 'react';

type ToastType = 'success' | 'danger' | 'warning' | 'info';

interface ToastOptions {
  duration?: number;
  containerId?: string;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: 'check',
  danger: 'times',
  warning: 'exclamation',
  info: 'info',
};

export function useToast(options: ToastOptions = {}) {
  const { duration = 3000, containerId = 'toast-container' } = options;

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      if (typeof window === 'undefined') return;

      const container = document.getElementById(containerId);
      if (!container) return;

      const toastEl = document.createElement('div');
      toastEl.className = `toast-item toast-${type}`;
      toastEl.style.borderColor = `var(--${type === 'danger' ? 'danger' : type})`;
      toastEl.innerHTML = `
        <div style="width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1)">
          <i class="fas fa-${TOAST_ICONS[type]}" style="font-size:10px"></i>
        </div>
        <span style="color:rgba(255,255,255,0.9)">${message}</span>
      `;
      container.appendChild(toastEl);

      setTimeout(() => {
        toastEl.style.animation = 'toastSlideOut 0.3s ease forwards';
        setTimeout(() => toastEl.remove(), 300);
      }, duration);
    },
    [duration, containerId]
  );

  const success = useCallback(
    (message: string) => toast(message, 'success'),
    [toast]
  );

  const error = useCallback(
    (message: string) => toast(message, 'danger'),
    [toast]
  );

  const warning = useCallback(
    (message: string) => toast(message, 'warning'),
    [toast]
  );

  const info = useCallback(
    (message: string) => toast(message, 'info'),
    [toast]
  );

  return {
    toast,
    success,
    error,
    warning,
    info,
  };
}
