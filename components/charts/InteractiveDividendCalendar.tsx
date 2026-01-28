'use client';

import { useState, useMemo, useCallback } from 'react';
import { useNexus } from '@/lib/context';
import { TAX_CONFIG } from '@/lib/config';

interface DividendDay {
  date: number;
  total: number;
  items: Array<{
    ticker: string;
    qty: number;
    dps: number;
    amount: number;
  }>;
}

type ViewMode = 'month' | 'year';

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function InteractiveDividendCalendar() {
  const { state } = useNexus();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DividendDay | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate monthly dividend data
  const monthlyData = useMemo(() => {
    const data: Record<number, DividendDay> = {};

    state.dividends
      .filter((d) => {
        const date = new Date(d.date);
        return date.getFullYear() === year && date.getMonth() === month;
      })
      .forEach((div) => {
        const date = new Date(div.date);
        const day = date.getDate();
        const afterTax = div.qty * div.dps * TAX_CONFIG.AFTER_TAX_RATE;

        if (!data[day]) {
          data[day] = { date: day, total: 0, items: [] };
        }
        data[day].total += afterTax;
        data[day].items.push({
          ticker: div.ticker,
          qty: div.qty,
          dps: div.dps,
          amount: afterTax,
        });
      });

    return data;
  }, [state.dividends, year, month]);

  // Calculate yearly summary
  const yearlySummary = useMemo(() => {
    const monthlySums = Array(12).fill(0);

    state.dividends
      .filter((d) => new Date(d.date).getFullYear() === year)
      .forEach((div) => {
        const date = new Date(div.date);
        const m = date.getMonth();
        const afterTax = div.qty * div.dps * TAX_CONFIG.AFTER_TAX_RATE;
        monthlySums[m] += afterTax;
      });

    return monthlySums;
  }, [state.dividends, year]);

  const totalYearDividend = yearlySummary.reduce((a, b) => a + b, 0);
  const totalMonthDividend = Object.values(monthlyData).reduce((sum, d) => sum + d.total, 0);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    // Add empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [year, month]);

  const goToPrevMonth = useCallback(() => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  }, [year, month]);

  const goToNextMonth = useCallback(() => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  }, [year, month]);

  const goToPrevYear = useCallback(() => {
    setCurrentDate(new Date(year - 1, month, 1));
    setSelectedDay(null);
  }, [year, month]);

  const goToNextYear = useCallback(() => {
    setCurrentDate(new Date(year + 1, month, 1));
    setSelectedDay(null);
  }, [year, month]);

  const handleDayClick = useCallback((day: number) => {
    const dayData = monthlyData[day];
    if (dayData) {
      setSelectedDay(selectedDay?.date === day ? null : dayData);
    }
  }, [monthlyData, selectedDay]);

  return (
    <div className="inner-glass p-4 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display tracking-widest text-white flex items-center gap-2">
          <i className="fas fa-calendar-alt text-celestial-gold text-xs" aria-hidden="true" />
          배당 캘린더
        </h3>

        {/* View Mode Toggle */}
        <div className="flex gap-1" role="tablist" aria-label="뷰 모드">
          <button
            role="tab"
            aria-selected={viewMode === 'month'}
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 text-[10px] rounded transition-all focus-visible-ring ${
              viewMode === 'month'
                ? 'bg-celestial-gold/20 text-celestial-gold border border-celestial-gold/30'
                : 'text-white/70 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            월간
          </button>
          <button
            role="tab"
            aria-selected={viewMode === 'year'}
            onClick={() => setViewMode('year')}
            className={`px-3 py-1.5 text-[10px] rounded transition-all focus-visible-ring ${
              viewMode === 'year'
                ? 'bg-celestial-gold/20 text-celestial-gold border border-celestial-gold/30'
                : 'text-white/70 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            연간
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors focus-visible-ring"
              aria-label="이전 달"
            >
              <i className="fas fa-chevron-left text-xs" aria-hidden="true" />
            </button>
            <div className="text-center">
              <div className="text-sm font-medium text-white">
                {year}년 {month + 1}월
              </div>
              <div className="text-[10px] text-celestial-gold">
                총 ${totalMonthDividend.toFixed(2)}
              </div>
            </div>
            <button
              onClick={goToNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors focus-visible-ring"
              aria-label="다음 달"
            >
              <i className="fas fa-chevron-right text-xs" aria-hidden="true" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Day headers */}
            {DAYS_OF_WEEK.map((day, i) => (
              <div
                key={day}
                className={`text-center text-[10px] py-1 ${
                  i === 0 ? 'text-v64-danger/70' : i === 6 ? 'text-v64-info/70' : 'text-white/70'
                }`}
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="h-12" />;
              }

              const dayData = monthlyData[day];
              const hasDividend = dayData && dayData.total > 0;
              const isSelected = selectedDay?.date === day;

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  disabled={!hasDividend}
                  className={`h-12 rounded text-xs relative transition-all focus-visible-ring ${
                    hasDividend
                      ? isSelected
                        ? 'bg-celestial-gold/30 border border-celestial-gold'
                        : 'bg-celestial-gold/10 border border-celestial-gold/20 hover:bg-celestial-gold/20 cursor-pointer'
                      : 'text-white/60 cursor-default'
                  }`}
                >
                  <span className="absolute top-1 left-1.5 text-[10px]">{day}</span>
                  {hasDividend && (
                    <span className="absolute bottom-1 right-1.5 text-[9px] text-celestial-gold font-mono">
                      +${dayData.total.toFixed(0)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Detail */}
          {selectedDay && (
            <div
              className="p-3 bg-celestial-gold/10 border border-celestial-gold/20 rounded-lg"
              role="region"
              aria-label="선택된 날짜 상세"
            >
              <div className="text-xs text-celestial-gold mb-2 font-medium">
                {month + 1}월 {selectedDay.date}일 배당 내역
              </div>
              <div className="space-y-1">
                {selectedDay.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-white/70">
                      {item.ticker} ({item.qty}주 × ${item.dps.toFixed(2)})
                    </span>
                    <span className="text-celestial-gold font-mono">
                      +${item.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-celestial-gold/20 flex justify-between text-xs">
                <span className="text-white/70">세후 총액</span>
                <span className="text-celestial-gold font-semibold">
                  ${selectedDay.total.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPrevYear}
              className="w-8 h-8 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors focus-visible-ring"
              aria-label="이전 연도"
            >
              <i className="fas fa-chevron-left text-xs" aria-hidden="true" />
            </button>
            <div className="text-center">
              <div className="text-sm font-medium text-white">{year}년</div>
              <div className="text-[10px] text-celestial-gold">
                총 ${totalYearDividend.toFixed(2)}
              </div>
            </div>
            <button
              onClick={goToNextYear}
              className="w-8 h-8 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors focus-visible-ring"
              aria-label="다음 연도"
            >
              <i className="fas fa-chevron-right text-xs" aria-hidden="true" />
            </button>
          </div>

          {/* Yearly Bar Chart */}
          <div className="space-y-2">
            {MONTHS.map((monthName, i) => {
              const amount = yearlySummary[i];
              const maxAmount = Math.max(...yearlySummary, 1);
              const widthPercent = (amount / maxAmount) * 100;

              return (
                <div key={monthName} className="flex items-center gap-2">
                  <div className="w-8 text-[10px] text-white/70 text-right">{monthName}</div>
                  <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden">
                    <div
                      className="h-full bg-celestial-gold/60 rounded transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  <div className="w-16 text-[10px] text-right font-mono text-celestial-gold">
                    ${amount.toFixed(0)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-[10px] text-white/70">월 평균</div>
              <div className="text-sm font-mono text-celestial-gold">
                ${(totalYearDividend / 12).toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-white/70">최고 월</div>
              <div className="text-sm font-mono text-v64-success">
                ${Math.max(...yearlySummary).toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-white/70">연간 총액</div>
              <div className="text-sm font-mono text-white">
                ${totalYearDividend.toFixed(0)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
