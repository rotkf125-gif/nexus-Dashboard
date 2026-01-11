import { NextRequest } from 'next/server'

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockNextRequest(options: {
  method?: string
  url?: string
  headers?: Record<string, string>
  body?: any
  searchParams?: Record<string, string>
} = {}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    headers = {},
    body,
    searchParams = {},
  } = options

  // Build URL with search params
  const urlObj = new URL(url)
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value)
  })

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestInit.body = JSON.stringify(body)
  }

  return new NextRequest(urlObj.toString(), requestInit)
}

/**
 * Extract JSON response from NextResponse
 */
export async function getJsonResponse(response: Response) {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Create a mock context for API route testing
 */
export function createMockContext(params: Record<string, string> = {}) {
  return {
    params,
  }
}

/**
 * Helper to test API route handlers
 */
export async function testApiHandler(
  handler: (req: NextRequest, context?: any) => Promise<Response>,
  options: {
    method?: string
    url?: string
    headers?: Record<string, string>
    body?: any
    searchParams?: Record<string, string>
    params?: Record<string, string>
  } = {}
) {
  const request = createMockNextRequest(options)
  const context = createMockContext(options.params)
  const response = await handler(request, context)
  const data = await getJsonResponse(response)

  return {
    response,
    data,
    status: response.status,
    headers: response.headers,
  }
}

/**
 * Mock Headers for testing
 */
export function createMockHeaders(headers: Record<string, string> = {}): Headers {
  const mockHeaders = new Headers()
  Object.entries(headers).forEach(([key, value]) => {
    mockHeaders.set(key, value)
  })
  return mockHeaders
}

/**
 * Helper to test CORS headers
 */
export function expectCorsHeaders(headers: Headers) {
  expect(headers.get('Access-Control-Allow-Origin')).toBeTruthy()
  expect(headers.get('Access-Control-Allow-Methods')).toBeTruthy()
  expect(headers.get('Access-Control-Allow-Headers')).toBeTruthy()
}

/**
 * Helper to create mock response for external APIs
 */
export function createMockResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
