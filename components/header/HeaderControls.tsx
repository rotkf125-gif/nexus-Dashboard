'use client';

// ═══════════════════════════════════════════════════════════════
// Header Controls - 헤더 컨트롤 버튼 컴포넌트
// ═══════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase';
import UndoRedoIndicator from '../UndoRedoIndicator';

interface HeaderControlsProps {
  user: any;
  connectionStatus: 'offline' | 'loading' | 'online';
  syncTime: string;
  clock: string;
  isLive: boolean;
  onToggleLive: () => void;
  onExport: () => void;
  onOpenAuth: () => void;
  onOpenFreedom: () => void;
  onOpenSettings: () => void;
  toast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function HeaderControls({
  user,
  connectionStatus,
  syncTime,
  clock,
  isLive,
  onToggleLive,
  onExport,
  onOpenAuth,
  onOpenFreedom,
  onOpenSettings,
  toast,
}: HeaderControlsProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast('로그아웃 되었습니다', 'info');
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        {/* Auth Status */}
        {user ? (
          <div className="flex items-center gap-2">
            <i className="fas fa-user-check text-v64-success text-[10px]" />
            <span className="text-[9px] text-v64-success">{user.email?.split('@')[0]}</span>
          </div>
        ) : (
          <span className="text-[9px] opacity-80">Guest</span>
        )}
        <span className={`status-dot ${connectionStatus}`} />
        <span className="text-[10px] tracking-widest font-light opacity-90">
          {connectionStatus === 'loading' ? 'SYNC...' : connectionStatus === 'online' ? 'ONLINE' : 'OFFLINE'}
        </span>
        <span className="text-[9px] opacity-80">{syncTime}</span>
        <div className="text-lg font-display font-light w-20 text-center">{clock}</div>
      </div>
      <div className="flex gap-1.5 items-center">
        {/* Undo/Redo */}
        <UndoRedoIndicator />
        <div className="w-px h-6 bg-white/20 mx-1" />
        {/* Auth Button */}
        {user ? (
          <button
            onClick={handleLogout}
            className="celestial-btn text-[9px]"
            title="Logout"
          >
            <i className="fas fa-sign-out-alt" />
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="celestial-btn text-[9px]"
            title="Login"
          >
            <i className="fas fa-user" />
          </button>
        )}
        <button
          onClick={onToggleLive}
          className={`celestial-btn text-[9px] ${isLive ? 'border-v64-success/40 text-v64-success' : ''}`}
        >
          {isLive ? 'DISCONNECT' : 'CONNECT'}
        </button>
        <button
          onClick={onExport}
          className="celestial-btn text-[9px]"
          title="Export to Clipboard"
        >
          <i className="fas fa-copy" />
        </button>
        <button
          onClick={onOpenFreedom}
          className="celestial-btn celestial-btn-gold text-[9px]"
          title="Freedom AI Analysis"
        >
          <i className="fas fa-robot mr-1" />AI
        </button>
        <button
          onClick={onOpenSettings}
          className="celestial-btn text-[9px]"
        >
          <i className="fas fa-cog" />
        </button>
      </div>
    </div>
  );
}
