'use client';

import { useState } from 'react';
import { supabase, setAuthUserId, getCurrentUserId } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthChange: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthChange }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'link'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setAuthUserId(data.user.id);
        onAuthChange(data.user);
        setMessage('로그인 성공! 페이지를 새로고침합니다...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setMessage('확인 이메일을 보냈습니다. 이메일을 확인해주세요.');
    } catch (err: any) {
      setError(err.message || '회원가입 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google 로그인 실패');
      setLoading(false);
    }
  };

  // 기존 데이터를 로그인 계정으로 연결
  const handleLinkData = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setError('연결할 데이터가 없습니다.');
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('먼저 로그인해주세요.');
        setLoading(false);
        return;
      }

      // 기존 데이터 가져오기
      const { data: oldData } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', currentUserId)
        .single();

      if (oldData) {
        // 새 user_id로 데이터 복사/업데이트
        const { error } = await supabase
          .from('portfolios')
          .upsert({
            ...oldData,
            id: undefined, // 새 ID 생성
            user_id: user.id,
          }, {
            onConflict: 'user_id',
          });

        if (error) throw error;

        // localStorage 업데이트
        setAuthUserId(user.id);
        setMessage('데이터 연결 성공! 페이지를 새로고침합니다...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError('연결할 데이터를 찾을 수 없습니다.');
      }
    } catch (err: any) {
      setError(err.message || '데이터 연결 실패');
    } finally {
      setLoading(false);
    }
  };

  const currentUserId = getCurrentUserId();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="glass-card p-6 w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
          <i className="fas fa-times" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-display tracking-widest text-white mb-6 text-center">
          {mode === 'login' && 'LOGIN'}
          {mode === 'signup' && 'SIGN UP'}
          {mode === 'link' && 'LINK DATA'}
        </h2>

        {/* Current User ID Info */}
        {currentUserId && mode !== 'link' && (
          <div className="mb-4 p-3 bg-white/5 rounded text-[10px] font-mono">
            <span className="opacity-50">Current ID: </span>
            <span className="text-celestial-gold break-all">{currentUserId}</span>
          </div>
        )}

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs tracking-widest rounded transition ${
              mode === 'login' ? 'bg-celestial-cyan/20 text-celestial-cyan' : 'bg-white/5 text-white/50'
            }`}
          >
            LOGIN
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-xs tracking-widest rounded transition ${
              mode === 'signup' ? 'bg-celestial-cyan/20 text-celestial-cyan' : 'bg-white/5 text-white/50'
            }`}
          >
            SIGN UP
          </button>
          <button
            onClick={() => setMode('link')}
            className={`flex-1 py-2 text-xs tracking-widest rounded transition ${
              mode === 'link' ? 'bg-celestial-gold/20 text-celestial-gold' : 'bg-white/5 text-white/50'
            }`}
          >
            LINK
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-v64-danger/20 border border-v64-danger/30 rounded text-v64-danger text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-v64-success/20 border border-v64-success/30 rounded text-v64-success text-sm">
            {message}
          </div>
        )}

        {/* Login/Signup Form */}
        {(mode === 'login' || mode === 'signup') && (
          <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-50 mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:border-celestial-cyan/50 outline-none"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-50 mb-1 block">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:border-celestial-cyan/50 outline-none"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-2.5 text-sm tracking-widest disabled:opacity-50"
              >
                {loading ? <i className="fas fa-spinner spinner" /> : mode === 'login' ? 'LOGIN' : 'SIGN UP'}
              </button>
            </div>
          </form>
        )}

        {/* Link Data */}
        {mode === 'link' && (
          <div className="space-y-4">
            <p className="text-sm opacity-70 text-center">
              로그인 후 기존 데이터를 계정에 연결합니다.
            </p>
            <div className="p-3 bg-white/5 rounded text-[10px]">
              <span className="opacity-50">연결할 데이터 ID: </span>
              <span className="text-celestial-gold font-mono break-all">{currentUserId || '없음'}</span>
            </div>
            <button
              onClick={handleLinkData}
              disabled={loading || !currentUserId}
              className="w-full btn-secondary py-2.5 text-sm tracking-widest disabled:opacity-50"
            >
              {loading ? <i className="fas fa-spinner spinner" /> : 'LINK TO MY ACCOUNT'}
            </button>
          </div>
        )}

        {/* Divider */}
        {(mode === 'login' || mode === 'signup') && (
          <>
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] opacity-50">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white/10 hover:bg-white/15 border border-white/10 rounded py-2.5 text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <i className="fab fa-google" />
              Continue with Google
            </button>
          </>
        )}

        {/* Share Link */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-[10px] opacity-50 mb-2 text-center">모바일 공유 링크:</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}?uid=${currentUserId || ''}`}
              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[10px] font-mono"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}?uid=${currentUserId}`);
                setMessage('링크가 복사되었습니다!');
                setTimeout(() => setMessage(''), 2000);
              }}
              className="px-3 py-1.5 bg-celestial-cyan/20 text-celestial-cyan rounded text-xs hover:bg-celestial-cyan/30 transition"
            >
              <i className="fas fa-copy" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
