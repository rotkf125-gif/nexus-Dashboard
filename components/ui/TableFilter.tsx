'use client';

import { useCallback, useState } from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface TableFilterProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  className?: string;
}

export function TableFilter({
  filters,
  values,
  onChange,
  onReset,
  className = '',
}: TableFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = Object.values(values).filter(Boolean).length;

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      onChange(key, value === values[key] ? '' : value);
    },
    [onChange, values]
  );

  return (
    <div className={`table-filter ${className}`}>
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="celestial-btn text-[10px] flex items-center gap-2 focus-visible-ring"
        aria-expanded={isExpanded}
        aria-controls="filter-panel"
      >
        <i className="fas fa-filter" aria-hidden="true" />
        <span className="hidden sm:inline">필터</span>
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 text-[9px] bg-celestial-cyan/30 text-celestial-cyan rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isExpanded && (
        <div
          id="filter-panel"
          className="absolute top-full right-0 mt-2 p-4 glass-card rounded-lg min-w-[280px] z-20"
          role="group"
          aria-label="필터 옵션"
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
            <span className="text-xs font-medium text-white/80">필터</span>
            {activeFilterCount > 0 && (
              <button
                onClick={onReset}
                className="text-[10px] text-celestial-cyan hover:text-celestial-cyan/80 focus-visible-ring rounded px-2 py-1"
              >
                초기화
              </button>
            )}
          </div>

          <div className="space-y-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-[10px] text-white/60 mb-2 uppercase tracking-wider">
                  {filter.label}
                </label>
                <div className="flex flex-wrap gap-2">
                  {filter.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange(filter.key, option.value)}
                      className={`filter-chip focus-visible-ring ${
                        values[filter.key] === option.value ? 'active' : ''
                      }`}
                      aria-pressed={values[filter.key] === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TableFilter;
