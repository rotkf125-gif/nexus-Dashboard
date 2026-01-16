// ═══════════════════════════════════════════════════════════════
// NEXUS Error Handling - 에러 처리 표준화
// ═══════════════════════════════════════════════════════════════

/**
 * 기본 NEXUS 에러 클래스
 */
export class NexusError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'NexusError';
  }
}

/**
 * API 에러 클래스
 */
export class APIError extends NexusError {
  constructor(
    public status: number,
    message: string
  ) {
    super(message, `API_${status}`, status < 500);
    this.name = 'APIError';
  }

  static fromResponse(response: Response): APIError {
    return new APIError(response.status, `HTTP ${response.status}: ${response.statusText}`);
  }
}

/**
 * 유효성 검사 에러 클래스
 */
export class ValidationError extends NexusError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message, 'VALIDATION', true);
    this.name = 'ValidationError';
  }
}

/**
 * 네트워크 에러 클래스
 */
export class NetworkError extends NexusError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK', true);
    this.name = 'NetworkError';
  }
}

/**
 * 스토리지 에러 클래스
 */
export class StorageError extends NexusError {
  constructor(
    message: string,
    public storageType: 'localStorage' | 'supabase'
  ) {
    super(message, `STORAGE_${storageType.toUpperCase()}`, true);
    this.name = 'StorageError';
  }
}

/**
 * 에러 타입 가드
 */
export function isNexusError(error: unknown): error is NexusError {
  return error instanceof NexusError;
}

export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * 에러를 사용자 친화적 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    switch (error.status) {
      case 400:
        return '잘못된 요청입니다.';
      case 401:
        return '인증이 필요합니다.';
      case 403:
        return '접근 권한이 없습니다.';
      case 404:
        return '요청한 리소스를 찾을 수 없습니다.';
      case 429:
        return '요청이 너무 많습니다. 잠시 후 다시 시도하세요.';
      case 500:
        return '서버 오류가 발생했습니다.';
      default:
        return `서버 오류 (${error.status})`;
    }
  }

  if (isValidationError(error)) {
    return error.field ? `${error.field}: ${error.message}` : error.message;
  }

  if (isNetworkError(error)) {
    return '네트워크 연결을 확인하세요.';
  }

  if (isNexusError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '알 수 없는 오류가 발생했습니다.';
}

/**
 * 에러 로깅 유틸리티
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}]` : '[NEXUS]';
  
  if (isNexusError(error)) {
    console.error(`${prefix} ${error.name} (${error.code}):`, error.message);
  } else if (error instanceof Error) {
    console.error(`${prefix} Error:`, error.message, error.stack);
  } else {
    console.error(`${prefix} Unknown error:`, error);
  }
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * 안전한 API 호출 래퍼
 */
export async function safeApiCall<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    logError(error, context);
    return fallback;
  }
}
