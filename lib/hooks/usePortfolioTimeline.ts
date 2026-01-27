'use client';

import { useMemo } from 'react';
import { TimelineEntry } from '@/lib/types';

interface TimelineMilestone {
  date: string;
  type: 'buy' | 'sell' | 'dividend' | 'milestone';
  ticker?: string;
  amount?: number;
  description: string;
}

interface TimelineDataPoint {
  date: string;
  value: number;
  cost: number;
  returnPct: number;
}

interface UsePortfolioTimelineReturn {
  dataPoints: TimelineDataPoint[];
  milestones: TimelineMilestone[];
  stats: {
    startValue: number;
    endValue: number;
    totalReturn: number;
    maxValue: number;
    minValue: number;
    avgValue: number;
  };
}

type Period = '1m' | '3m' | '6m' | '1y' | 'all';

const PERIOD_DAYS: Record<Period, number> = {
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
  'all': Infinity,
};

export function usePortfolioTimeline(
  timeline: TimelineEntry[],
  tradeLogs: Array<{ date: string; ticker: string; type: string; qty: number; price: number }>,
  dividends: Array<{ date: string; ticker: string; qty: number; dps: number }>,
  period: Period = '3m'
): UsePortfolioTimelineReturn {
  return useMemo(() => {
    if (!timeline || timeline.length === 0) {
      return {
        dataPoints: [],
        milestones: [],
        stats: {
          startValue: 0,
          endValue: 0,
          totalReturn: 0,
          maxValue: 0,
          minValue: 0,
          avgValue: 0,
        },
      };
    }

    const now = new Date();
    const periodDays = PERIOD_DAYS[period];
    const cutoffDate = periodDays === Infinity
      ? new Date(0)
      : new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Filter and sort timeline entries
    const filteredEntries = timeline
      .filter((t) => new Date(t.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Convert to data points
    const dailyMap = new Map<string, TimelineDataPoint>();
    filteredEntries.forEach((entry) => {
      const returnPct = entry.cost > 0 ? ((entry.value - entry.cost) / entry.cost) * 100 : 0;
      dailyMap.set(entry.date, {
        date: entry.date,
        value: entry.value,
        cost: entry.cost,
        returnPct,
      });
    });

    const dataPoints = Array.from(dailyMap.values());

    // Generate milestones from trade logs and dividends
    const milestones: TimelineMilestone[] = [];

    // Add trade milestones
    tradeLogs
      .filter((t) => new Date(t.date) >= cutoffDate)
      .forEach((trade) => {
        milestones.push({
          date: trade.date,
          type: trade.type.toLowerCase() as 'buy' | 'sell',
          ticker: trade.ticker,
          amount: trade.qty * trade.price,
          description: `${trade.type} ${trade.qty} ${trade.ticker} @ $${trade.price.toFixed(2)}`,
        });
      });

    // Add dividend milestones
    dividends
      .filter((d) => new Date(d.date) >= cutoffDate)
      .forEach((div) => {
        milestones.push({
          date: div.date,
          type: 'dividend',
          ticker: div.ticker,
          amount: div.qty * div.dps * 0.85, // After 15% tax
          description: `${div.ticker} 배당금 $${(div.qty * div.dps * 0.85).toFixed(2)}`,
        });
      });

    // Calculate stats
    const values = dataPoints.map((d) => d.value);
    const startValue = values[0] || 0;
    const endValue = values[values.length - 1] || 0;
    const totalReturn = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;
    const maxValue = Math.max(...values, 0);
    const minValue = Math.min(...values, Infinity) === Infinity ? 0 : Math.min(...values);
    const avgValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    return {
      dataPoints,
      milestones: milestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      stats: {
        startValue,
        endValue,
        totalReturn,
        maxValue,
        minValue,
        avgValue,
      },
    };
  }, [timeline, tradeLogs, dividends, period]);
}

export default usePortfolioTimeline;
