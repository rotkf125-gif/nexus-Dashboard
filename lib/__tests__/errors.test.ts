// ═══════════════════════════════════════════════════════════════
// Errors Tests - 에러 처리 테스트
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  NexusError,
  APIError,
  ValidationError,
  NetworkError,
  StorageError,
  isNexusError,
  isAPIError,
  isValidationError,
  isNetworkError,
  getErrorMessage,
  safeJsonParse,
} from '../errors';

describe('NexusError', () => {
  it('should create a NexusError with correct properties', () => {
    const error = new NexusError('Test error', 'TEST_CODE', true);
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.recoverable).toBe(true);
    expect(error.name).toBe('NexusError');
  });

  it('should default recoverable to true', () => {
    const error = new NexusError('Test error', 'TEST_CODE');
    expect(error.recoverable).toBe(true);
  });
});

describe('APIError', () => {
  it('should create an APIError with status', () => {
    const error = new APIError(404, 'Not found');
    
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.code).toBe('API_404');
    expect(error.name).toBe('APIError');
  });

  it('should be recoverable for client errors', () => {
    const error = new APIError(400, 'Bad request');
    expect(error.recoverable).toBe(true);
  });

  it('should not be recoverable for server errors', () => {
    const error = new APIError(500, 'Server error');
    expect(error.recoverable).toBe(false);
  });
});

describe('ValidationError', () => {
  it('should create a ValidationError with field', () => {
    const error = new ValidationError('Invalid value', 'email');
    
    expect(error.message).toBe('Invalid value');
    expect(error.field).toBe('email');
    expect(error.code).toBe('VALIDATION');
    expect(error.name).toBe('ValidationError');
  });

  it('should work without field', () => {
    const error = new ValidationError('Invalid data');
    expect(error.field).toBeUndefined();
  });
});

describe('NetworkError', () => {
  it('should create a NetworkError with default message', () => {
    const error = new NetworkError();
    
    expect(error.message).toBe('Network error occurred');
    expect(error.code).toBe('NETWORK');
    expect(error.name).toBe('NetworkError');
  });

  it('should accept custom message', () => {
    const error = new NetworkError('Connection timeout');
    expect(error.message).toBe('Connection timeout');
  });
});

describe('StorageError', () => {
  it('should create a StorageError for localStorage', () => {
    const error = new StorageError('Quota exceeded', 'localStorage');
    
    expect(error.message).toBe('Quota exceeded');
    expect(error.storageType).toBe('localStorage');
    expect(error.code).toBe('STORAGE_LOCALSTORAGE');
  });

  it('should create a StorageError for supabase', () => {
    const error = new StorageError('Connection failed', 'supabase');
    
    expect(error.storageType).toBe('supabase');
    expect(error.code).toBe('STORAGE_SUPABASE');
  });
});

describe('Type Guards', () => {
  it('isNexusError should identify NexusError', () => {
    const nexusError = new NexusError('test', 'TEST');
    const regularError = new Error('test');
    
    expect(isNexusError(nexusError)).toBe(true);
    expect(isNexusError(regularError)).toBe(false);
    expect(isNexusError('string')).toBe(false);
  });

  it('isAPIError should identify APIError', () => {
    const apiError = new APIError(404, 'Not found');
    const nexusError = new NexusError('test', 'TEST');
    
    expect(isAPIError(apiError)).toBe(true);
    expect(isAPIError(nexusError)).toBe(false);
  });

  it('isValidationError should identify ValidationError', () => {
    const validationError = new ValidationError('Invalid');
    const apiError = new APIError(400, 'Bad request');
    
    expect(isValidationError(validationError)).toBe(true);
    expect(isValidationError(apiError)).toBe(false);
  });

  it('isNetworkError should identify NetworkError', () => {
    const networkError = new NetworkError();
    const apiError = new APIError(500, 'Server error');
    
    expect(isNetworkError(networkError)).toBe(true);
    expect(isNetworkError(apiError)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('should return user-friendly message for API errors', () => {
    expect(getErrorMessage(new APIError(400, 'Bad'))).toBe('잘못된 요청입니다.');
    expect(getErrorMessage(new APIError(401, 'Unauth'))).toBe('인증이 필요합니다.');
    expect(getErrorMessage(new APIError(403, 'Forbidden'))).toBe('접근 권한이 없습니다.');
    expect(getErrorMessage(new APIError(404, 'Not found'))).toBe('요청한 리소스를 찾을 수 없습니다.');
    expect(getErrorMessage(new APIError(429, 'Too many'))).toBe('요청이 너무 많습니다. 잠시 후 다시 시도하세요.');
    expect(getErrorMessage(new APIError(500, 'Server'))).toBe('서버 오류가 발생했습니다.');
  });

  it('should return field-specific message for validation errors', () => {
    const error = new ValidationError('Invalid format', 'email');
    expect(getErrorMessage(error)).toBe('email: Invalid format');
  });

  it('should return network message for network errors', () => {
    const error = new NetworkError();
    expect(getErrorMessage(error)).toBe('네트워크 연결을 확인하세요.');
  });

  it('should return message for regular errors', () => {
    const error = new Error('Something went wrong');
    expect(getErrorMessage(error)).toBe('Something went wrong');
  });

  it('should return default message for unknown errors', () => {
    expect(getErrorMessage('string error')).toBe('알 수 없는 오류가 발생했습니다.');
    expect(getErrorMessage(null)).toBe('알 수 없는 오류가 발생했습니다.');
    expect(getErrorMessage(undefined)).toBe('알 수 없는 오류가 발생했습니다.');
  });
});

describe('safeJsonParse', () => {
  it('should parse valid JSON', () => {
    const result = safeJsonParse('{"key": "value"}', {});
    expect(result).toEqual({ key: 'value' });
  });

  it('should return fallback for invalid JSON', () => {
    const fallback = { default: true };
    const result = safeJsonParse('invalid json', fallback);
    expect(result).toEqual(fallback);
  });

  it('should parse arrays', () => {
    const result = safeJsonParse('[1, 2, 3]', []);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should handle empty string', () => {
    const result = safeJsonParse('', { empty: true });
    expect(result).toEqual({ empty: true });
  });
});
