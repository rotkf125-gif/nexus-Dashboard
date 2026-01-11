import { vi } from 'vitest'

export const mockYahooFinanceResponse = {
  chart: {
    result: [
      {
        meta: {
          currency: 'USD',
          symbol: 'AAPL',
          regularMarketPrice: 150.25,
          chartPreviousClose: 149.50,
          regularMarketTime: 1704470400,
          currentTradingPeriod: {
            pre: {
              timezone: 'EST',
              start: 1704448800,
              end: 1704470400,
              gmtoffset: -18000,
            },
            regular: {
              timezone: 'EST',
              start: 1704470400,
              end: 1704494400,
              gmtoffset: -18000,
            },
            post: {
              timezone: 'EST',
              start: 1704494400,
              end: 1704508800,
              gmtoffset: -18000,
            },
          },
        },
        timestamp: [1704470400],
        indicators: {
          quote: [
            {
              open: [149.75],
              high: [151.00],
              low: [149.25],
              close: [150.25],
              volume: [50000000],
            },
          ],
        },
      },
    ],
    error: null,
  },
}

export const mockMarketIndicesResponse = {
  '^IXIC': { // NASDAQ
    regularMarketPrice: 15000.00,
    regularMarketChange: 50.25,
    regularMarketChangePercent: 0.34,
  },
  '^GSPC': { // S&P 500
    regularMarketPrice: 4800.00,
    regularMarketChange: 10.50,
    regularMarketChangePercent: 0.22,
  },
  '^VIX': { // Volatility Index
    regularMarketPrice: 15.25,
    regularMarketChange: -0.50,
    regularMarketChangePercent: -3.18,
  },
  '^TNX': { // 10-Year Treasury
    regularMarketPrice: 4.25,
    regularMarketChange: 0.05,
    regularMarketChangePercent: 1.19,
  },
  'KRW=X': { // USD/KRW
    regularMarketPrice: 1300.50,
    regularMarketChange: 5.00,
    regularMarketChangePercent: 0.39,
  },
}

export const createMockFetch = (responseData?: any) => {
  return vi.fn((url: string) => {
    // Mock Yahoo Finance API responses based on URL
    if (url.includes('query1.finance.yahoo.com') || url.includes('query2.finance.yahoo.com')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => responseData || mockYahooFinanceResponse,
      } as Response)
    }

    // Default mock response
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response)
  })
}

export const setupFetchMock = (customResponse?: any) => {
  global.fetch = createMockFetch(customResponse)
}
