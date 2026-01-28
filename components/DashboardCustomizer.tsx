'use client';

import { useState, useEffect } from 'react';
import { useNexus } from '@/lib/context';

interface DashboardConfig {
  visibleSections: string[];
  preset: string;
}

interface Preset {
  name: string;
  icon: string;
  description: string;
  sections: string[];
}

const ALL_SECTIONS = [
  { id: 'health', name: 'Portfolio Health', icon: 'fa-heartbeat', color: 'text-rose-400' },
  { id: 'strategy', name: 'Strategy Bar', icon: 'fa-chess', color: 'text-celestial-purple' },
  { id: 'assets', name: 'Asset Table/Heatmap', icon: 'fa-th-large', color: 'text-celestial-cyan' },
  { id: 'income', name: 'Income Stream', icon: 'fa-coins', color: 'text-celestial-gold' },
  { id: 'analytics', name: 'Analytics', icon: 'fa-chart-pie', color: 'text-celestial-purple' },
  { id: 'rebalance', name: 'Rebalance Suggestion', icon: 'fa-balance-scale', color: 'text-celestial-cyan' },
  { id: 'performance', name: 'Performance', icon: 'fa-chart-line', color: 'text-v64-success' },
  { id: 'report', name: 'Monthly Report', icon: 'fa-file-alt', color: 'text-celestial-purple' },
  { id: 'simulation', name: 'Simulation', icon: 'fa-flask', color: 'text-orange-400' },
  { id: 'stress', name: 'Stress Test', icon: 'fa-bolt', color: 'text-orange-400' },
];

const PRESETS: Record<string, Preset> = {
  full: {
    name: 'Full Dashboard',
    icon: 'fa-th',
    description: '모든 섹션 표시',
    sections: ALL_SECTIONS.map(s => s.id),
  },
  minimal: {
    name: 'Minimal',
    icon: 'fa-compress-alt',
    description: '핵심 정보만 표시',
    sections: ['assets', 'performance'],
  },
  investor: {
    name: 'Investor',
    icon: 'fa-user-tie',
    description: '투자 분석 중심',
    sections: ['health', 'assets', 'analytics', 'rebalance', 'performance'],
  },
  income: {
    name: 'Income Focus',
    icon: 'fa-coins',
    description: '배당/수입 중심',
    sections: ['income', 'performance', 'report'],
  },
  trader: {
    name: 'Trader',
    icon: 'fa-bolt',
    description: '단기 매매 중심',
    sections: ['assets', 'simulation', 'stress'],
  },
};

const STORAGE_KEY = 'nexus_dashboard_config';

export default function DashboardCustomizer() {
  const { toast } = useNexus();

  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<DashboardConfig>({
    visibleSections: ALL_SECTIONS.map(s => s.id),
    preset: 'full',
  });

  // localStorage에서 설정 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch {
        // 기본값 유지
      }
    }
  }, []);

  // 설정 저장
  const saveConfig = (newConfig: DashboardConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  };

  // 섹션 토글
  const toggleSection = (sectionId: string) => {
    const newSections = config.visibleSections.includes(sectionId)
      ? config.visibleSections.filter(s => s !== sectionId)
      : [...config.visibleSections, sectionId];

    saveConfig({
      visibleSections: newSections,
      preset: 'custom',
    });
  };

  // 프리셋 적용
  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      saveConfig({
        visibleSections: [...preset.sections],
        preset: presetKey,
      });
      toast(`${preset.name} 프리셋이 적용되었습니다`, 'success');
    }
  };

  // 모두 선택/해제
  const selectAll = () => {
    saveConfig({
      visibleSections: ALL_SECTIONS.map(s => s.id),
      preset: 'full',
    });
  };

  const selectNone = () => {
    saveConfig({
      visibleSections: [],
      preset: 'custom',
    });
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="celestial-btn text-[9px] flex items-center gap-1.5"
        title="대시보드 설정"
      >
        <i className="fas fa-cog" />
        <span className="hidden sm:inline">커스텀</span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 inner-glass p-4 rounded-lg min-w-[320px] shadow-xl border border-white/20">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-[11px] text-white font-medium flex items-center gap-2">
                <i className="fas fa-sliders-h text-celestial-cyan" />
                대시보드 커스터마이징
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <i className="fas fa-times text-xs" />
              </button>
            </div>

            {/* Presets */}
            <div className="mb-4">
              <div className="text-[9px] text-white/60 uppercase tracking-wider mb-2">프리셋</div>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className={`p-2 rounded text-center transition-all ${
                      config.preset === key
                        ? 'bg-celestial-cyan/20 border border-celestial-cyan/40'
                        : 'bg-white/5 border border-white/10 hover:border-white/30'
                    }`}
                  >
                    <i className={`fas ${preset.icon} text-xs mb-1 ${config.preset === key ? 'text-celestial-cyan' : 'text-white/60'}`} />
                    <div className={`text-[9px] ${config.preset === key ? 'text-celestial-cyan' : 'text-white/80'}`}>
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] text-white/60 uppercase tracking-wider">섹션</span>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-[8px] text-celestial-cyan hover:underline"
                  >
                    모두 선택
                  </button>
                  <button
                    onClick={selectNone}
                    className="text-[8px] text-white/70 hover:underline"
                  >
                    모두 해제
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {ALL_SECTIONS.map(section => (
                  <label
                    key={section.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={config.visibleSections.includes(section.id)}
                      onChange={() => toggleSection(section.id)}
                      className="w-3.5 h-3.5 rounded border-white/30 bg-white/10 checked:bg-celestial-cyan checked:border-celestial-cyan"
                    />
                    <i className={`fas ${section.icon} w-4 text-xs ${section.color}`} />
                    <span className="text-[10px] text-white/80 flex-1">{section.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Current Preset Info */}
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-white/70">
                  현재: {PRESETS[config.preset]?.name || '커스텀'}
                </span>
                <span className="text-white/70">
                  {config.visibleSections.length}/{ALL_SECTIONS.length} 섹션
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 섹션 가시성 확인 훅
export function useDashboardConfig() {
  const [config, setConfig] = useState<DashboardConfig>({
    visibleSections: ALL_SECTIONS.map(s => s.id),
    preset: 'full',
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch {
        // 기본값 유지
      }
    }

    // localStorage 변경 감지
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setConfig(JSON.parse(e.newValue));
        } catch {
          // 무시
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isSectionVisible = (sectionId: string) => config.visibleSections.includes(sectionId);

  return { config, isSectionVisible };
}
