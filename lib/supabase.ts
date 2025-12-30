import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 고유 사용자 ID 생성/조회 (브라우저 fingerprint 기반)
export const getUserId = (): string => {
  if (typeof window === 'undefined') return 'server';
  
  let userId = localStorage.getItem('nexus_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('nexus_user_id', userId);
  }
  return userId;
};
