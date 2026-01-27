'use client';

import { useEffect, useCallback } from 'react';

interface UseKeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onHome,
  onEnd,
  enabled = true,
}: UseKeyboardNavigationOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const handlers: Record<string, (() => void) | undefined> = {
        Escape: onEscape,
        Enter: onEnter,
        ArrowUp: onArrowUp,
        ArrowDown: onArrowDown,
        ArrowLeft: onArrowLeft,
        ArrowRight: onArrowRight,
        Home: onHome,
        End: onEnd,
      };

      const handler = handlers[event.key];
      if (handler) {
        event.preventDefault();
        handler();
      }
    },
    [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onHome, onEnd]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);
}

export function useTabNavigation(
  tabs: string[],
  activeTab: string,
  setActiveTab: (tab: string) => void,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
) {
  const currentIndex = tabs.indexOf(activeTab);

  const goToNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIndex]);
  }, [currentIndex, tabs, setActiveTab]);

  const goToPrevious = useCallback(() => {
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[prevIndex]);
  }, [currentIndex, tabs, setActiveTab]);

  const goToFirst = useCallback(() => {
    setActiveTab(tabs[0]);
  }, [tabs, setActiveTab]);

  const goToLast = useCallback(() => {
    setActiveTab(tabs[tabs.length - 1]);
  }, [tabs, setActiveTab]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const isNext = orientation === 'horizontal' ? event.key === 'ArrowRight' : event.key === 'ArrowDown';
      const isPrev = orientation === 'horizontal' ? event.key === 'ArrowLeft' : event.key === 'ArrowUp';

      if (isNext) {
        event.preventDefault();
        goToNext();
      } else if (isPrev) {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === 'Home') {
        event.preventDefault();
        goToFirst();
      } else if (event.key === 'End') {
        event.preventDefault();
        goToLast();
      }
    },
    [orientation, goToNext, goToPrevious, goToFirst, goToLast]
  );

  return {
    handleKeyDown,
    goToNext,
    goToPrevious,
    goToFirst,
    goToLast,
  };
}

export default useKeyboardNavigation;
