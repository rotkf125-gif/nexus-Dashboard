'use client';

import { useState, useEffect } from 'react';
import { useNexus } from '@/lib/context';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { state, setExchangeRate, toast } = useNexus();
  
  const [manualRate, setManualRate] = useState('');
  const [scriptUrl, setScriptUrl] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(5);

  useEffect(() => {
    if (isOpen) {
      // localStorage에서 설정 로드
      const savedUrl = localStorage.getItem('nexus_script_url') || '';
      const savedInterval = localStorage.getItem('nexus_refresh_interval') || '5';
      setScriptUrl(savedUrl);
      setRefreshInterval(parseInt(savedInterval));
    }
  }, [isOpen]);

  const handleSetManualRate = () => {
    const rate = parseFloat(manualRate);
    if (rate && rate > 0) {
      setExchangeRate(rate);
      toast(`환율 설정: ₩${rate.toLocaleString()}`, 'success');
      setManualRate('');
    }
  };

  const handleSaveScriptUrl = () => {
    localStorage.setItem('nexus_script_url', scriptUrl);
    toast('Google Script URL 저장됨', 'success');
  };

  const handleSaveInterval = () => {
    localStorage.setItem('nexus_refresh_interval', refreshInterval.toString());
    toast(`API 갱신 주기: ${refreshInterval}분`, 'success');
  };

  const handleExport = () => {
    const data = localStorage.getItem('nexus_state');
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('데이터 내보내기 완료', 'success');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          localStorage.setItem('nexus_state', JSON.stringify(data));
          toast('데이터 가져오기 완료. 새로고침합니다.', 'success');
          setTimeout(() => window.location.reload(), 1000);
        } catch {
          toast('잘못된 파일 형식', 'danger');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    if (confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      localStorage.removeItem('nexus_state');
      localStorage.removeItem('nexus_script_url');
      localStorage.removeItem('nexus_refresh_interval');
      toast('데이터 초기화 완료. 새로고침합니다.', 'warning');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card w-[440px] p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
          <h3 className="font-semibold text-white text-base tracking-widest font-display">
            <i className="fas fa-cog mr-2" />SETTINGS
          </h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Exchange Rate Override */}
          <div className="inner-glass p-4 rounded-xl">
            <label className="text-[10px] text-white/50 block mb-2 tracking-widest font-medium">
              환율 수동 설정 (USD/KRW)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={manualRate}
                onChange={(e) => setManualRate(e.target.value)}
                className="glass-input py-2 flex-1 rounded-lg"
                placeholder="1450"
              />
              <button onClick={handleSetManualRate} className="celestial-btn text-[10px]">
                APPLY
              </button>
            </div>
            <div className="text-[10px] text-white/40 mt-1 font-medium">
              현재: ₩{state.exchangeRate.toLocaleString()}
            </div>
          </div>

          {/* API Refresh Interval */}
          <div className="inner-glass p-4 rounded-xl">
            <label className="text-[10px] text-white/50 block mb-2 tracking-widest font-medium">
              API 자동 갱신 주기
            </label>
            <div className="flex gap-2 items-center">
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="glass-input py-2 flex-1 bg-transparent rounded-lg"
              >
                <option value="1" className="bg-[#0a0f29]">1분</option>
                <option value="3" className="bg-[#0a0f29]">3분</option>
                <option value="5" className="bg-[#0a0f29]">5분</option>
                <option value="10" className="bg-[#0a0f29]">10분</option>
                <option value="15" className="bg-[#0a0f29]">15분</option>
              </select>
              <button onClick={handleSaveInterval} className="celestial-btn text-[10px]">
                SAVE
              </button>
            </div>
          </div>

          {/* Google Sheet URL */}
          <div className="inner-glass p-4 rounded-xl">
            <label className="text-[10px] text-white/50 block mb-2 tracking-widest font-medium">
              Google Apps Script URL
            </label>
            <input
              type="text"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              className="glass-input py-2 w-full text-left text-[11px] rounded-lg"
              placeholder="https://script.google.com/..."
            />
            <button onClick={handleSaveScriptUrl} className="celestial-btn text-[10px] w-full mt-2">
              SAVE URL
            </button>
          </div>

          {/* Data Export/Import */}
          <div className="inner-glass p-4 rounded-xl">
            <label className="text-[10px] text-white/50 block mb-2 tracking-widest font-medium">
              데이터 백업/복원
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleExport} className="celestial-btn text-[10px]">
                <i className="fas fa-download mr-1" />EXPORT
              </button>
              <label className="celestial-btn text-[10px] text-center cursor-pointer">
                <i className="fas fa-upload mr-1" />IMPORT
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </div>
          </div>

          {/* Reset Data */}
          <div className="inner-glass p-4 rounded-xl border border-v64-danger/20">
            <label className="text-[10px] text-v64-danger block mb-2 tracking-widest font-medium">
              데이터 초기화
            </label>
            <button onClick={handleReset} className="celestial-btn text-[10px] w-full border-v64-danger/40 text-v64-danger">
              <i className="fas fa-trash mr-1" />RESET ALL
            </button>
          </div>
        </div>

        <button onClick={onClose} className="celestial-btn w-full mt-5">
          CLOSE
        </button>
      </div>
    </div>
  );
}
