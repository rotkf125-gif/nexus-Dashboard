'use client';

import { useState, useEffect, useCallback, useRef, DependencyList } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

interface UseAsyncStateOptions {
  immediate?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

export function useAsyncState<T>(
  asyncFn: () => Promise<T>,
  deps: DependencyList = [],
  options: UseAsyncStateOptions = {}
): AsyncState<T> & { retry: () => Promise<void>; reset: () => void } {
  const { immediate = true, retryCount = 0, retryDelay = 1000 } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: immediate,
    isError: false,
    isSuccess: false,
  });

  const retriesRef = useRef(0);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      isError: false,
      error: null,
    }));

    try {
      const result = await asyncFn();
      if (mountedRef.current) {
        setState({
          data: result,
          error: null,
          isLoading: false,
          isError: false,
          isSuccess: true,
        });
        retriesRef.current = 0;
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));

        if (retriesRef.current < retryCount) {
          retriesRef.current += 1;
          setTimeout(() => {
            if (mountedRef.current) {
              execute();
            }
          }, retryDelay);
        } else {
          setState({
            data: null,
            error,
            isLoading: false,
            isError: true,
            isSuccess: false,
          });
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asyncFn, retryCount, retryDelay]);

  const retry = useCallback(async () => {
    retriesRef.current = 0;
    await execute();
  }, [execute]);

  const reset = useCallback(() => {
    retriesRef.current = 0;
    setState({
      data: null,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: false,
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      execute();
    }
    return () => {
      mountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...state,
    retry,
    reset,
  };
}

export default useAsyncState;
