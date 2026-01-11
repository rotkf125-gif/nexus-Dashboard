import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET } from '../[ticker]/route'
import { testApiHandler, createMockNextRequest } from '@/test/utils/api-test-helpers'
import { createTestServer } from '@/test/server/test-server'

describe('/api/price/[ticker]', () => {
  let testServer: ReturnType<typeof createTestServer>

  beforeEach(() => {
    testServer = createTestServer()
  })

  afterEach(() => {
    testServer.teardown()
  })

  describe('Success Cases', () => {
    it('should return stock price for valid ticker', async () => {
      // Mock Yahoo Finance response
      testServer.mockYahooFinance({
        chart: {
          result: [
            {
              meta: {
                regularMarketPrice: 150.25,
                previousClose: 149.50,
                marketState: 'REGULAR',
              },
            },
          ],
        },
      })

      const request = createMockNextRequest({
        url: 'http://localhost:3000/api/price/AAPL',
      })

      const response = await GET(request, { params: { ticker: 'AAPL' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        ticker: 'AAPL',
        price: 150.25,
        previousClose: 149.50,
        marketState: 'REGULAR',
      })
      expect(data.change).toBeCloseTo(0.75)
      expect(data.changePercent).toBeCloseTo(0.5, 1)
      expect(data.timestamp).toBeDefined()
    })

    it('should return pre-market price when market is PRE', async () => {
      testServer.mockYahooFinance({
        chart: {
          result: [
            {
              meta: {
                regularMarketPrice: 150.00,
                preMarketPrice: 151.50,
                previousClose: 149.50,
                marketState: 'PRE',
              },
            },
          ],
        },
      })

      const request = createMockNextRequest({
        url: 'http://localhost:3000/api/price/AAPL',
      })

      const response = await GET(request, { params: { ticker: 'AAPL' } })
      const data = await response.json()

      expect(data.price).toBe(151.50)
      expect(data.marketState).toBe('PRE')
      expect(data.change).toBeCloseTo(2.00)
    })

    it('should return post-market price when market is POST', async () => {
      testServer.mockYahooFinance({
        chart: {
          result: [
            {
              meta: {
                regularMarketPrice: 150.00,
                postMarketPrice: 149.25,
                previousClose: 149.50,
                marketState: 'POST',
              },
            },
          ],
        },
      })

      const request = createMockNextRequest({
        url: 'http://localhost:3000/api/price/AAPL',
      })

      const response = await GET(request, { params: { ticker: 'AAPL' } })
      const data = await response.json()

      expect(data.price).toBe(149.25)
      expect(data.marketState).toBe('POST')
      expect(data.change).toBeCloseTo(-0.25)
    })

    it('should handle ticker with special characters', async () => {
      testServer.mockYahooFinance({
        chart: {
          result: [
            {
              meta: {
                regularMarketPrice: 100.00,
                previousClose: 99.50,
                marketState: 'REGULAR',
              },
            },
          ],
        },
      })

      const request = createMockNextRequest({
        url: 'http://localhost:3000/api/price/BRK.B',
      })

      const response = await GET(request, { params: { ticker: 'BRK.B' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ticker).toBe('BRK.B')
    })
  })

  describe('Error Cases', () => {
    it('should return 400 if ticker is missing', async () => {
      const request = createMockNextRequest({
        url: 'http://localhost:3000/api/price/',
      })

      const response = await GET(request, { params: { ticker: '' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Ticker required')
    })

    it('should return 500 if Yahoo Finance API fails', async () => {
      testServer.mockNetworkError()

      const request = createMockNextRequest({
        url: 'http://localhost:3000/api/price/AAPL',
      })

      const response = await GET(request, { params: { ticker: 'AAPL' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to fetch')
      expect(data.ticker).toBe('AAPL')
    })

    it('should return 500 if data format is invalid', async () => {
      testServer.mockYahooFinance({
        chart: {
          result: null, // Invalid format
        },
      })

      const request = createMockNextRequest({
        url: 'http://localhost:3000/api/price/INVALID',
      })

      const response = await GET(request, { params: { ticker: 'INVALID' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })
  })

  describe('Price Calculations', () => {
    it('should correctly calculate change and changePercent', async () => {
      testServer.mockYahooFinance({
        chart: {
          result: [
            {
              meta: {
                regularMarketPrice: 110.00,
                previousClose: 100.00,
                marketState: 'REGULAR',
              },
            },
          ],
        },
      })

      const request = createMockNextRequest({
        url: 'http://localhost:3000/api/price/TEST',
      })

      const response = await GET(request, { params: { ticker: 'TEST' } })
      const data = await response.json()

      expect(data.change).toBe(10.00)
      expect(data.changePercent).toBe(10.00)
    })

    it('should handle zero previousClose gracefully', async () => {
      testServer.mockYahooFinance({
        chart: {
          result: [
            {
              meta: {
                regularMarketPrice: 100.00,
                previousClose: 0,
                marketState: 'REGULAR',
              },
            },
          ],
        },
      })

      const request = createMockNextRequest({
        url: 'http://localhost:3000/api/price/TEST',
      })

      const response = await GET(request, { params: { ticker: 'TEST' } })
      const data = await response.json()

      expect(data.changePercent).toBe(0)
    })
  })
})
