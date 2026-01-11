/**
 * Test Server Configuration
 *
 * This module provides utilities for running a test server
 * with mocked external dependencies for integration testing.
 */

import { vi } from 'vitest'
import { setupFetchMock, mockYahooFinanceResponse } from '../mocks/yahoo-finance'
import { mockSupabaseClient } from '../mocks/supabase'

/**
 * Setup test server environment
 */
export function setupTestServer() {
  // Mock fetch for external API calls
  setupFetchMock()

  // Mock Supabase client
  vi.mock('@/lib/supabase', () => ({
    supabase: mockSupabaseClient,
    createClient: vi.fn(() => mockSupabaseClient),
  }))

  // Mock environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  process.env.GEMINI_API_KEY = 'test-gemini-key'
}

/**
 * Reset test server state between tests
 */
export function resetTestServer() {
  vi.clearAllMocks()
  setupFetchMock()
}

/**
 * Teardown test server
 */
export function teardownTestServer() {
  vi.restoreAllMocks()
}

/**
 * Create a test server instance for integration tests
 */
export class TestServer {
  private fetchMock: any

  constructor() {
    this.setup()
  }

  setup() {
    setupTestServer()
    this.fetchMock = global.fetch
  }

  reset() {
    resetTestServer()
  }

  teardown() {
    teardownTestServer()
  }

  /**
   * Mock Yahoo Finance API response
   */
  mockYahooFinance(customResponse?: any) {
    setupFetchMock(customResponse || mockYahooFinanceResponse)
  }

  /**
   * Mock Supabase response for specific table
   */
  mockSupabaseQuery(tableName: string, response: any) {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === tableName) {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: response, error: null })),
              data: Array.isArray(response) ? response : [response],
              error: null,
            })),
            data: Array.isArray(response) ? response : [response],
            error: null,
          })),
          insert: vi.fn(() => Promise.resolve({ data: response, error: null })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: response, error: null })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
          upsert: vi.fn(() => Promise.resolve({ data: response, error: null })),
        }
      }
      return mockSupabaseClient.from(table)
    })
  }

  /**
   * Simulate network error
   */
  mockNetworkError() {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))
  }

  /**
   * Simulate API timeout
   */
  mockTimeout(delay = 5000) {
    global.fetch = vi.fn(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), delay)
      )
    )
  }

  /**
   * Get call count for mocked function
   */
  getFetchCallCount() {
    return (global.fetch as any).mock?.calls?.length || 0
  }

  /**
   * Get last fetch call arguments
   */
  getLastFetchCall() {
    const calls = (global.fetch as any).mock?.calls
    return calls?.[calls.length - 1]
  }
}

/**
 * Helper to create test server instance for tests
 */
export function createTestServer() {
  return new TestServer()
}
