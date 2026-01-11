import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { NexusProvider } from '@/lib/context'

interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return <NexusProvider>{children}</NexusProvider>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Helper function to create mock asset data
export const createMockAsset = (overrides = {}) => ({
  id: 'test-asset-1',
  ticker: 'AAPL',
  name: 'Apple Inc.',
  quantity: 10,
  avgCost: 150.00,
  currentPrice: 155.00,
  sector: 'Technology',
  weight: 0,
  value: 1550.00,
  gain: 50.00,
  gainPercent: 3.33,
  ...overrides,
})

// Helper function to create mock dividend data
export const createMockDividend = (overrides = {}) => ({
  id: 'test-dividend-1',
  assetId: 'test-asset-1',
  ticker: 'AAPL',
  exDate: '2024-02-09',
  payDate: '2024-02-16',
  amount: 0.24,
  frequency: 'quarterly' as const,
  ...overrides,
})

// Helper function to wait for async updates
export const waitForNextUpdate = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper to mock Next.js router
export const createMockRouter = (overrides = {}) => ({
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  push: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  beforePopState: vi.fn(),
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
  isFallback: false,
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
  ...overrides,
})
