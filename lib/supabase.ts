import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 사용자 ID 가져오기 (우선순위: Auth > URL > localStorage)
export const getUserId = (): string => {
  if (typeof window === 'undefined') return 'server';
  
  // 1. URL 파라미터 체크 (?uid=xxx)
  const urlParams = new URLSearchParams(window.location.search);
  const urlUserId = urlParams.get('uid');
  if (urlUserId) {
    localStorage.setItem('nexus_user_id', urlUserId);
    // URL에서 uid 파라미터 제거 (깔끔하게)
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
    return urlUserId;
  }
  
  // 2. localStorage에서 기존 ID 확인
  let userId = localStorage.getItem('nexus_user_id');
  if (userId) return userId;
  
  // 3. 새 ID 생성
  userId = 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  localStorage.setItem('nexus_user_id', userId);
  return userId;
};

// Auth 사용자 ID 설정 (로그인 시)
export const setAuthUserId = (authId: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('nexus_user_id', authId);
};

// 현재 저장된 User ID 가져오기
export const getCurrentUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nexus_user_id');
};

