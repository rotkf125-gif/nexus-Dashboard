'use client';

import { useState, useCallback } from 'react';

interface RetryButtonProps {
  onRetry: () => Promise<void> | void;
  maxRetries?: number;
  className?: string;
  children?: React.ReactNode;
}

export function RetryButton({
  onRetry,
  maxRetries = 3,
  className = '',
  children,
}: RetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = useCallback(async () => {
    if (isRetrying || retryCount >= maxRetries) return;

    setIsRetrying(true);
    try {
      await onRetry();
      setRetryCount(0);
    } catch {
      setRetryCount((prev) => prev + 1);
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, retryCount, maxRetries, onRetry]);

  const isDisabled = isRetrying || retryCount >= maxRetries;

  return (
    <button
      onClick={handleRetry}
      disabled={isDisabled}
      className={`retry-btn focus-visible-ring ${className}`}
      aria-busy={isRetrying}
      aria-disabled={isDisabled}
    >
      {isRetrying ? (
        <>
          <i className="fas fa-spinner spinner" aria-hidden="true" />
          <span>재시도 중...</span>
        </>
      ) : (
        <>
          <i className="fas fa-redo" aria-hidden="true" />
          <span>{children || '다시 시도'}</span>
        </>
      )}
      {retryCount > 0 && retryCount < maxRetries && (
        <span className="text-xs opacity-60">
          ({retryCount}/{maxRetries})
        </span>
      )}
      {retryCount >= maxRetries && (
        <span className="text-xs opacity-60">최대 재시도 횟수 초과</span>
      )}
    </button>
  );
}

export default RetryButton;
