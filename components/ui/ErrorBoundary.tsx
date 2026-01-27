'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div
      className="error-state"
      role="alert"
      aria-live="assertive"
    >
      <div className="error-state-icon">
        <i className="fas fa-exclamation-triangle" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">
        문제가 발생했습니다
      </h2>
      <p className="error-state-message">
        {error?.message || '알 수 없는 오류가 발생했습니다.'}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="retry-btn focus-visible-ring"
      >
        <i className="fas fa-redo" aria-hidden="true" />
        다시 시도
      </button>
    </div>
  );
}

export default ErrorBoundary;
