'use client';

import { useState, useMemo, useCallback } from 'react';

interface UseTableFilterOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  initialFilters?: Record<string, string>;
}

interface FilterConfig {
  key: string;
  values: string[];
}

export function useTableFilter<T extends Record<string, unknown>>({
  data,
  searchFields,
  initialFilters = {},
}: UseTableFilterOptions<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);

  const setSearch = useCallback((query: string) => {
    setSearchQuery(query.toLowerCase().trim());
  }, []);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setFilters(initialFilters);
  }, [initialFilters]);

  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery) {
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchQuery);
          }
          if (typeof value === 'number') {
            return value.toString().includes(searchQuery);
          }
          return false;
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((item) => {
          const itemValue = item[key as keyof T];
          if (typeof itemValue === 'string') {
            return itemValue === value;
          }
          return false;
        });
      }
    });

    return result;
  }, [data, searchQuery, searchFields, filters]);

  // Extract unique values for filter options
  const getFilterOptions = useCallback(
    (key: keyof T): string[] => {
      const uniqueValues = new Set<string>();
      data.forEach((item) => {
        const value = item[key];
        if (typeof value === 'string') {
          uniqueValues.add(value);
        }
      });
      return Array.from(uniqueValues).sort();
    },
    [data]
  );

  const activeFilterCount = useMemo(() => {
    let count = searchQuery ? 1 : 0;
    count += Object.values(filters).filter(Boolean).length;
    return count;
  }, [searchQuery, filters]);

  return {
    filteredData,
    searchQuery,
    setSearch,
    filters,
    setFilter,
    resetFilters,
    getFilterOptions,
    activeFilterCount,
  };
}

export default useTableFilter;
