'use client'

import { useState } from 'react'

export default function TestServerPage() {
  const [priceResult, setPriceResult] = useState<any>(null)
  const [marketResult, setMarketResult] = useState<any>(null)
  const [ticker, setTicker] = useState('AAPL')
  const [loading, setLoading] = useState({ price: false, market: false })

  const testPriceAPI = async () => {
    setLoading({ ...loading, price: true })
    try {
      const res = await fetch(`/api/price/${ticker}`)
      const data = await res.json()
      setPriceResult({ status: res.status, data })
    } catch (error: any) {
      setPriceResult({ error: error.message })
    }
    setLoading({ ...loading, price: false })
  }

  const testMarketAPI = async () => {
    setLoading({ ...loading, market: true })
    try {
      const res = await fetch('/api/market')
      const data = await res.json()
      setMarketResult({ status: res.status, data })
    } catch (error: any) {
      setMarketResult({ error: error.message })
    }
    setLoading({ ...loading, market: false })
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
        🧪 Nexus Dashboard - 테스트 서버
      </h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>
        API 엔드포인트를 테스트하고 응답을 확인할 수 있습니다.
      </p>

      {/* Price API Test */}
      <div style={{
        background: '#f5f5f5',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          📈 /api/price/[ticker]
        </h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
          특정 주식의 실시간 가격 조회 (프리마켓/애프터마켓 지원)
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Ticker (예: AAPL)"
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              width: '150px'
            }}
          />
          <button
            onClick={testPriceAPI}
            disabled={loading.price}
            style={{
              padding: '8px 16px',
              background: loading.price ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading.price ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {loading.price ? '로딩중...' : '테스트 실행'}
          </button>
        </div>

        {priceResult && (
          <div style={{
            background: 'white',
            padding: '16px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '8px',
              alignItems: 'center'
            }}>
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                background: priceResult.status === 200 ? '#10b981' : '#ef4444',
                color: 'white',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {priceResult.status || 'ERROR'}
              </span>
              {priceResult.data?.marketState && (
                <span style={{
                  fontSize: '12px',
                  color: '#666',
                  fontWeight: '500'
                }}>
                  {priceResult.data.marketState}
                </span>
              )}
            </div>
            <pre style={{
              fontSize: '13px',
              overflow: 'auto',
              margin: 0,
              lineHeight: '1.6'
            }}>
              {JSON.stringify(priceResult.data || priceResult.error, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Market API Test */}
      <div style={{
        background: '#f5f5f5',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          📊 /api/market
        </h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
          시장 지수 조회 (NASDAQ, S&P 500, VIX, US10Y, USD/KRW)
        </p>

        <button
          onClick={testMarketAPI}
          disabled={loading.market}
          style={{
            padding: '8px 16px',
            background: loading.market ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading.market ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '16px'
          }}
        >
          {loading.market ? '로딩중...' : '테스트 실행'}
        </button>

        {marketResult && (
          <div style={{
            background: 'white',
            padding: '16px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '8px',
              alignItems: 'center'
            }}>
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                background: marketResult.status === 200 ? '#10b981' : '#ef4444',
                color: 'white',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {marketResult.status || 'ERROR'}
              </span>
              {marketResult.data?.marketState && (
                <span style={{
                  fontSize: '12px',
                  color: '#666',
                  fontWeight: '500'
                }}>
                  {marketResult.data.marketState}
                </span>
              )}
            </div>
            <pre style={{
              fontSize: '13px',
              overflow: 'auto',
              margin: 0,
              lineHeight: '1.6'
            }}>
              {JSON.stringify(marketResult.data || marketResult.error, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Test Info */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px'
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
          💡 사용 가이드
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#1e40af' }}>
          <li>위 버튼을 클릭하여 실제 API를 호출하고 응답을 확인할 수 있습니다.</li>
          <li>주가 조회는 미국 주식 티커를 입력하세요 (예: AAPL, TSLA, GOOGL)</li>
          <li>실제 Yahoo Finance API를 호출하므로 실시간 데이터를 확인할 수 있습니다.</li>
          <li>단위 테스트 실행: <code style={{ background: 'white', padding: '2px 6px', borderRadius: '3px' }}>npm test</code></li>
          <li>UI 모드: <code style={{ background: 'white', padding: '2px 6px', borderRadius: '3px' }}>npm run test:ui</code></li>
        </ul>
      </div>
    </div>
  )
}
