import { useMemo } from 'react';
import { Asset, Dividend, TradeSums } from '../types';
import { TAX_CONFIG } from '../config';
import { IncomeStatData } from '@/components/income';

const { AFTER_TAX_RATE } = TAX_CONFIG;

interface UseIncomeAnalyticsProps {
    assets: Asset[];
    dividends: Dividend[];
    tradeSums: TradeSums;
}

export function useIncomeAnalytics({ assets, dividends, tradeSums }: UseIncomeAnalyticsProps) {
    // INCOME 타입 자산만 필터링
    const incomeAssets = useMemo(() => {
        return assets.filter(a => a.type === 'INCOME');
    }, [assets]);

    // 12개월 전 날짜
    const twelveMonthsAgo = useMemo(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 12);
        return date;
    }, []);

    // 티커별 배당 (최근 12개월)
    const dividendsByTicker = useMemo(() => {
        const indexed: Record<string, Dividend[]> = {};
        dividends.forEach(d => {
            const dividendDate = new Date(d.date);
            if (dividendDate >= twelveMonthsAgo) {
                if (!indexed[d.ticker]) indexed[d.ticker] = [];
                indexed[d.ticker].push(d);
            }
        });
        return indexed;
    }, [dividends, twelveMonthsAgo]);

    // 티커별 전체 배당 - 여기 수정됨: 타입을 명확히 함
    const allDividendsByTicker = useMemo(() => {
        const indexed: Record<string, Dividend[]> = {};
        dividends.forEach(d => {
            if (!indexed[d.ticker]) indexed[d.ticker] = [];
            indexed[d.ticker].push(d);
        });
        return indexed;
    }, [dividends]);

    // 인컴 통계 계산
    const incomeStats = useMemo((): IncomeStatData[] => {
        return incomeAssets.map(asset => {
            const tickerDividends = dividendsByTicker[asset.ticker] || [];
            const allTickerDividends = allDividendsByTicker[asset.ticker] || [];

            const totalDividend = allTickerDividends.reduce((sum, d) => {
                return sum + d.qty * d.dps * AFTER_TAX_RATE;
            }, 0);

            const avgDps = tickerDividends.length > 0
                ? tickerDividends.reduce((sum, d) => sum + d.dps, 0) / tickerDividends.length
                : 0;

            const principal = asset.qty * asset.avg;
            const valuation = asset.qty * asset.price;
            const tradeReturn = tradeSums[asset.ticker] ?? 0;
            const totalReturn = tradeReturn + (valuation - principal) + totalDividend;
            const recoveryPct = principal > 0 ? (totalDividend / principal) * 100 : 0;

            return {
                ticker: asset.ticker,
                qty: asset.qty,
                avgDps,
                principal,
                totalDividend,
                valuation,
                tradeReturn,
                totalReturn,
                recoveryPct,
                dividendCount: allTickerDividends.length,
            };
        });
    }, [incomeAssets, dividendsByTicker, allDividendsByTicker, tradeSums]);

    // 주간 예상 배당
    const weeklySummary = useMemo(() => {
        let estimatedMin = 0, estimatedAvg = 0, estimatedMax = 0;

        incomeAssets.forEach(asset => {
            const tickerDividends = dividendsByTicker[asset.ticker] || [];
            if (tickerDividends.length > 0) {
                const recentDps = [...tickerDividends]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 6)
                    .map(d => d.dps);

                if (recentDps.length > 0) {
                    const minDps = Math.min(...recentDps);
                    const maxDps = Math.max(...recentDps);
                    const avgDps = recentDps.reduce((sum, d) => sum + d, 0) / recentDps.length;

                    estimatedMin += asset.qty * minDps * AFTER_TAX_RATE;
                    estimatedAvg += asset.qty * avgDps * AFTER_TAX_RATE;
                    estimatedMax += asset.qty * maxDps * AFTER_TAX_RATE;
                }
            }
        });

        return { weeklyMin: estimatedMin, weeklyAvg: estimatedAvg, weeklyMax: estimatedMax };
    }, [incomeAssets, dividendsByTicker]);

    // 최근 배당 로그
    const recentLogs = useMemo(() => {
        return [...dividends]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [dividends]);

    // ===== Analytics Data =====
    const dpsData = useMemo(() => {
        const result: Record<string, { date: string; dps: number }[]> = {};
        incomeAssets.forEach(asset => {
            const tickerDividends = (dividendsByTicker[asset.ticker] || [])
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            result[asset.ticker] = tickerDividends.map(d => ({ date: d.date, dps: d.dps }));
        });
        return result;
    }, [incomeAssets, dividendsByTicker]);

    const avgDpsData = useMemo(() => {
        return incomeAssets.map(asset => {
            const data = dpsData[asset.ticker] || [];
            const avg = data.length > 0 ? data.reduce((sum, d) => sum + d.dps, 0) / data.length : 0;
            return { ticker: asset.ticker, avgDps: avg, count: data.length };
        });
    }, [incomeAssets, dpsData]);

    const monthlyPattern = useMemo(() => {
        const months: Record<string, number> = {};
        dividends.forEach(d => {
            const month = d.date.slice(0, 7);
            months[month] = (months[month] || 0) + d.qty * d.dps * AFTER_TAX_RATE;
        });
        return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-12) as [string, number][];
    }, [dividends]);

    const predictionAccuracy = useMemo(() => {
        if (avgDpsData.length === 0) return { accuracy: 0, totalPredicted: 0, totalActual: 0 };

        let totalPredicted = 0, totalActual = 0;
        incomeAssets.forEach(asset => {
            const data = dpsData[asset.ticker] || [];
            if (data.length >= 2) {
                const avgDps = data.reduce((sum, d) => sum + d.dps, 0) / data.length;
                const lastDps = data[data.length - 1].dps;
                totalPredicted += avgDps * asset.qty;
                totalActual += lastDps * asset.qty;
            }
        });

        const accuracy = totalPredicted > 0 ? Math.min(100, (totalActual / totalPredicted) * 100) : 0;
        return { accuracy, totalPredicted, totalActual };
    }, [incomeAssets, dpsData, avgDpsData]);

    return {
        incomeAssets,
        incomeStats,
        weeklySummary,
        recentLogs,
        dpsData,
        avgDpsData,
        monthlyPattern,
        predictionAccuracy,
        dividendsByTicker,
        allDividendsByTicker
    };
}
