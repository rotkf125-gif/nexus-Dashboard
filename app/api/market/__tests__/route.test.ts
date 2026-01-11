import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET } from '../route'
import { createMockNextRequest } from '@/test/utils/api-test-helpers'
import { createTestServer } from '@/test/server/test-server'

describe('/api/market', () => {
  let testServer: ReturnType<typeof createTestServer>

  beforeEach(() => {
    testServer = createTestServer()
    // Mock getMarketState utility
    vi.mock('@/lib/utils', () => ({
      getMarketState: vi.fn(() => 'REGULAR'),
    }))
  })

  afterEach(() => {
    testServer.teardown()
    vi.restoreAllMocks()
  })

  describe('Success Cases', () => {
    it('should return all market indices', async () => {
      // Mock sequential fetch calls for each index
      let callCount = 0
      global.fetch = vi.fn((url: string) => {
        const responses = [
          // NASDAQ
          {
            chart: {
              result: [
                {
                  meta: {
                    regularMarketPrice: 15000.00,
                    marketState: 'REGULAR',
                  },
                },
              ],
            },
          },
          // S&P 500
          {
            chart: {
              result: [
                {
                  meta: {
                    regularMarketPrice: 4800.00,
                    marketState: 'REGULAR',
                  },
                },
              ],
            },
          },
          // VIX
          {
            chart: {
              result: [
                {
                  meta: {
                    regularMarketPrice: 15.25,
                    marketState: 'REGULAR',
                  },
                },
              ],
            },
          },
          // TNX (10-Year Treasury)
          {
            chart: {
              result: [
                {
                  meta: {
                    regularMarketPrice: 4.25,
                    marketState: 'REGULAR',
                  },
                },
              ],
            },
          },
          // KRW (USD/KRW)
          {
            chart: {
              result: [
                {
                  meta: {
                    regularMarketPrice: 1300.50,
                    marketState: 'REGULAR',
                  },
                },
              ],
            },
          },
        ]

        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => responses[callCount++] || responses[0],
        } as Response)
      })

      const request = createMockNextRequest({
        url: 'http://localhost:3000/api/market',
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        nasdaq: 15000.00,
        sp500: 4800.00,
        vix: 15.25,
        tnx: 4.25,
        krw: 1300.50,
        marketState: 'REGULAR',
      })
      expect(data.sources).toBeDefined()
      expect(data.timestamp).toBeDefined()
    })

    it('should use pre-market prices when available', async () => {
      let callCount = 0
      global.fetch = vi.fn(() => {
        const responses = [
          {
            chart: {
              result: [
                {
                  meta: {
                    regularMarketPrice: 15000.00,
                    preMarketPrice: 15050.00,
                    marketState: 'PRE',
                  },
                },
              ],
            },
          },
        ]

        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => responses[callCount++] || responses[0],
        } as Response)
      })

      const response = await GET()
      const data = await response.json()

      expect(data.nasdaq).toBe(15050.00)
      expect(data.sources.nasdaq).toBe('pre')
    })

    it('should use post-market prices when available', async () => {
      let callCount = 0
      global.fetch = vi.fn(() => {
        const responses = [
          {
            chart: {
              result: [
                {
                  meta: {
                    regularMarketPrice: 15000.00,
                    postMarketPrice: 14950.00,
                    marketState: 'POST',
                  },
                },
              ],
            },
          },
        ]

        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => responses[callCount++] || responses[0],
        } as Response)
      })

      const response = await GET()
      const data = await response.json()

      expect(data.nasdaq).toBe(14950.00)
      expect(data.sources.nasdaq).toBe('post')
    })

    it('should fallback to futures when spot market is closed', async () => {
      let callCount = 0
      global.fetch = vi.fn((url: string) => {
        callCount++

        // First call: spot market returns null (CLOSED)
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              chart: {
                result: [
                  {
                    meta: {
                      regularMarketPrice: null,
                      marketState: 'CLOSED',
                    },
                  },
                ],
              },
            }),
          } as Response)
        }

        // Second call: futures market returns price
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            chart: {
              result: [
                {
                  meta: {
                    regularMarketPrice: 15100.00,
                    marketState: 'REGULAR',
                  },
                },
              ],
            },
          }),
        } as Response)
      })

      const response = await GET()
      const data = await response.json()

      expect(data.nasdaq).toBe(15100.00)
      expect(data.sources.nasdaq).toBe('futures')
    })
  })

  describe('Error Cases', () => {
    it('should return 200 with zero values if all fetches fail', async () => {
      testServer.mockNetworkError()

      const response = await GET()
      const data = await response.json()

      // API is resilient - returns 200 with zero values instead of failing
      expect(response.status).toBe(200)
      expect(data.nasdaq).toBe(0)
      expect(data.sp500).toBe(0)
      expect(data.vix).toBe(0)
      expect(data.sources).toBeDefined()
    })

    it('should handle partial failures gracefully', async () => {
      let callCount = 0
      global.fetch = vi.fn(() => {
        callCount++

        // First two succeed, rest fail
        if (callCount <= 2) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              chart: {
                result: [
                  {
                    meta: {
                      regularMarketPrice: 15000.00,
                      marketState: 'REGULAR',
                    },
                  },
                ],
              },
            }),
          } as Response)
        }

        return Promise.resolve({
          ok: false,
          status: 500,
        } as Response)
      })

      const response = await GET()
      const data = await response.json()

      // Should still return data for successful fetches
      expect(response.status).toBe(200)
      expect(data.nasdaq).toBeDefined()
    })
  })

  describe('Data Sources Tracking', () => {
    it('should track data source for each index', async () => {
      let callCount = 0
      global.fetch = vi.fn(() => {
        const responses = [
          {
            chart: {
              result: [
                {
                  meta: {
                    regularMarketPrice: 15000.00,
                    marketState: 'REGULAR',
                  },
                },
              ],
            },
          },
        ]

        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => responses[0],
        } as Response)
      })

      const response = await GET()
      const data = await response.json()

      expect(data.sources).toBeDefined()
      expect(data.sources.nasdaq).toBe('spot')
      expect(data.sources.sp500).toBe('spot')
      expect(data.sources.vix).toBe('spot')
    })
  })

  describe('Timestamp', () => {
    it('should include timestamp in response', async () => {
      testServer.mockYahooFinance({
        chart: {
          result: [
            {
              meta: {
                regularMarketPrice: 15000.00,
                marketState: 'REGULAR',
              },
            },
          ],
        },
      })

      const beforeTimestamp = Date.now()
      const response = await GET()
      const data = await response.json()
      const afterTimestamp = Date.now()

      expect(data.timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(data.timestamp).toBeLessThanOrEqual(afterTimestamp)
    })
  })
})
