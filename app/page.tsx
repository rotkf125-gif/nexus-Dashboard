'use client';

import { useState, useMemo, useCallback } from 'react';
import { NexusProvider, useNexus } from '@/lib/context';
import Header from '@/components/Header';
import StrategyBar from '@/components/StrategyBar';
import AssetTable from '@/components/AssetTable';
import SimulationHub from '@/components/SimulationHub';
import Analytics from '@/components/Analytics';
import AssetModal from '@/components/AssetModal';
import DividendModal from '@/components/DividendModal';
import SettingsModal from '@/components/SettingsModal';
import AuthModal from '@/components/AuthModal';
import FreedomModal from '@/components/FreedomModal';
import IncomeStream from '@/components/IncomeStream';
import PerformanceArena from '@/components/PerformanceArena';
import HistoricPerformance from '@/components/HistoricPerformance';

type TabType = 'stellar' | 'income' | 'analytics' | 'performance' | 'simulation';

function DashboardContent() {
  const {
    assetModalOpen,
    closeAssetModal,
    saveAssetFromModal,
    editingAsset,
    editingIndex,
    openAddAssetModal,
    dividendModalOpen,
    closeDividendModal,
    openDividendModal,
    syncFromSheet,
    state,
    refreshPrices,
    setCompactMode
  } = useNexus();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [freedomOpen, setFreedomOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('stellar');

  // INCOME 자산 메모이제이션
  const incomeAssets = useMemo(
    () => state.assets.filter(a => a.type === 'INCOME'),
    [state.assets]
  );

  // 배당 카운트다운 계산 함수 메모이제이션
  const getDividendCountdown = useCallback((ticker: string) => {
    // 매주 목요일 배당 가정
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
    return `D-${daysUntilThursday}`;
  }, []);

  // 모달 핸들러 메모이제이션
  const handleOpenSettings = useCallback(() => setSettingsOpen(true), []);
  const handleCloseSettings = useCallback(() => setSettingsOpen(false), []);
  const handleOpenAuth = useCallback(() => setAuthOpen(true), []);
  const handleCloseAuth = useCallback(() => setAuthOpen(false), []);
  const handleOpenFreedom = useCallback(() => setFreedomOpen(true), []);
  const handleCloseFreedom = useCallback(() => setFreedomOpen(false), []);

  return (
    <div className="max-w-[1900px] mx-auto p-4 md:p-6 space-y-5">
      {/* Modals */}
      <AssetModal
        isOpen={assetModalOpen}
        onClose={closeAssetModal}
        onSave={saveAssetFromModal}
        editingAsset={editingAsset}
        editingIndex={editingIndex}
        exchangeRate={state.exchangeRate}
      />
      <DividendModal isOpen={dividendModalOpen} onClose={closeDividendModal} />
      <SettingsModal isOpen={settingsOpen} onClose={handleCloseSettings} />
      <AuthModal isOpen={authOpen} onClose={handleCloseAuth} onAuthChange={() => {}} />
      <FreedomModal isOpen={freedomOpen} onClose={handleCloseFreedom} />

      {/* Header */}
      <Header
        onOpenSettings={handleOpenSettings}
        onOpenAuth={handleOpenAuth}
        onOpenFreedom={handleOpenFreedom}
      />

      {/* Strategy Bar */}
      <StrategyBar />

      {/* Main Content with Left Sidebar Tabs - Seamless Connection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 glass-card overflow-hidden relative">
        {/* Left Sidebar Tabs */}
        <div className="lg:col-span-2 p-4 flex flex-col h-full border-r border-white/5 bg-black/30 relative z-10">
          <div className="text-xs tracking-widest text-white/60 mb-4 uppercase font-medium">Navigation</div>
          <div className="flex flex-col flex-1 gap-1">
            {/* Stellar Assets - Cyan (핵심 자산) */}
            <button
              onClick={() => setActiveTab('stellar')}
              className={`flex-1 w-full px-4 transition-all flex items-center justify-center relative ${
                activeTab === 'stellar'
                  ? 'bg-celestial-cyan/10 text-celestial-cyan rounded-l-lg border-l-2 border-y border-celestial-cyan/50 border-r-0 -mr-px z-10'
                  : 'text-white/70 hover:bg-celestial-cyan/10 hover:text-celestial-cyan rounded-lg'
              }`}
              style={activeTab === 'stellar' ? { marginRight: '-1px', borderRight: 'none' } : {}}
            >
              <div className="flex items-center gap-3">
                <i className="fas fa-star text-sm" />
                <span className="text-sm font-medium tracking-wide">Stellar Assets</span>
              </div>
            </button>
            {/* Income Stream - Gold (배당/수익) */}
            <button
              onClick={() => setActiveTab('income')}
              className={`flex-1 w-full px-4 transition-all flex items-center justify-center relative ${
                activeTab === 'income'
                  ? 'bg-celestial-gold/10 text-celestial-gold rounded-l-lg border-l-2 border-y border-celestial-gold/50 border-r-0 -mr-px z-10'
                  : 'text-white/70 hover:bg-celestial-gold/10 hover:text-celestial-gold rounded-lg'
              }`}
              style={activeTab === 'income' ? { marginRight: '-1px', borderRight: 'none' } : {}}
            >
              <div className="flex items-center gap-3">
                <i className="fas fa-coins text-sm" />
                <span className="text-sm font-medium tracking-wide">Income Stream</span>
              </div>
            </button>
            {/* Analytics - Purple (분석/리스크) */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 w-full px-4 transition-all flex items-center justify-center relative ${
                activeTab === 'analytics'
                  ? 'bg-celestial-purple/10 text-celestial-purple rounded-l-lg border-l-2 border-y border-celestial-purple/50 border-r-0 -mr-px z-10'
                  : 'text-white/70 hover:bg-celestial-purple/10 hover:text-celestial-purple rounded-lg'
              }`}
              style={activeTab === 'analytics' ? { marginRight: '-1px', borderRight: 'none' } : {}}
            >
              <div className="flex items-center gap-3">
                <i className="fas fa-shield-alt text-sm" />
                <span className="text-sm font-medium tracking-wide">Analytics</span>
              </div>
            </button>
            {/* Performance - Green (성과/수익률) */}
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex-1 w-full px-4 transition-all flex items-center justify-center relative ${
                activeTab === 'performance'
                  ? 'bg-v64-success/10 text-v64-success rounded-l-lg border-l-2 border-y border-v64-success/50 border-r-0 -mr-px z-10'
                  : 'text-white/70 hover:bg-v64-success/10 hover:text-v64-success rounded-lg'
              }`}
              style={activeTab === 'performance' ? { marginRight: '-1px', borderRight: 'none' } : {}}
            >
              <div className="flex items-center gap-3">
                <i className="fas fa-chart-line text-sm" />
                <span className="text-sm font-medium tracking-wide">Performance</span>
              </div>
            </button>
            {/* Simulation - Orange (시뮬레이션/실험) */}
            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex-1 w-full px-4 transition-all flex items-center justify-center relative ${
                activeTab === 'simulation'
                  ? 'bg-orange-500/10 text-orange-400 rounded-l-lg border-l-2 border-y border-orange-500/50 border-r-0 -mr-px z-10'
                  : 'text-white/70 hover:bg-orange-500/10 hover:text-orange-400 rounded-lg'
              }`}
              style={activeTab === 'simulation' ? { marginRight: '-1px', borderRight: 'none' } : {}}
            >
              <div className="flex items-center gap-3">
                <i className="fas fa-flask text-sm" />
                <span className="text-sm font-medium tracking-wide">Simulation</span>
              </div>
            </button>
          </div>
        </div>

        {/* Main Content Area with Gradient Connection */}
        <div
          className="lg:col-span-10 min-h-[800px] p-5 relative"
          style={{
            background: activeTab === 'stellar'
              ? 'linear-gradient(90deg, rgba(34,211,238,0.08) 0%, transparent 15%)'
              : activeTab === 'income'
              ? 'linear-gradient(90deg, rgba(251,191,36,0.08) 0%, transparent 15%)'
              : activeTab === 'analytics'
              ? 'linear-gradient(90deg, rgba(168,85,247,0.08) 0%, transparent 15%)'
              : activeTab === 'performance'
              ? 'linear-gradient(90deg, rgba(105,240,174,0.08) 0%, transparent 15%)'
              : 'linear-gradient(90deg, rgba(249,115,22,0.08) 0%, transparent 15%)'
          }}
        >
          {/* Stellar Assets Tab */}
          {activeTab === 'stellar' && (
            <div className="h-full min-h-[800px]">
              <div className="flex justify-between items-end mb-4 pb-2 border-b border-white/10">
                <h2 className="text-lg font-display tracking-widest flex items-center gap-3 text-white">
                  <i className="fas fa-star text-celestial-gold text-xs" /> STELLAR ASSETS
                </h2>
                <div className="flex items-center gap-4">
                  {/* Compact Mode Toggle */}
                  <label className="compact-toggle">
                    <input
                      type="checkbox"
                      id="compact-toggle"
                      checked={state.compactMode}
                      onChange={(e) => setCompactMode(e.target.checked)}
                    />
                    <span className="compact-toggle-switch" />
                    <span>COMPACT</span>
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={refreshPrices}
                      className="celestial-btn text-[10px]"
                    >
                      <i className="fas fa-sync-alt" />
                    </button>
                    <button
                      onClick={openAddAssetModal}
                      className="celestial-btn text-[10px]"
                    >
                      IGNITE STAR
                    </button>
                  </div>
                </div>
              </div>

              {/* Dividend Countdown */}
              {incomeAssets.length > 0 && (
                <div className="dividend-countdown mb-4">
                  <i className="fas fa-calendar-alt text-celestial-gold" />
                  <span className="text-white/60">NEXT DIVIDEND</span>
                  {incomeAssets.slice(0, 3).map(asset => (
                    <div key={asset.ticker} className="dividend-countdown-item">
                      <span className="dividend-countdown-ticker">{asset.ticker}</span>
                      <span className="dividend-countdown-days">{getDividendCountdown(asset.ticker)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Asset Table */}
              <div className="flex flex-col h-[600px]">
                <div className="flex-1 min-h-0">
                  <div className="overflow-y-auto custom-scrollbar h-full">
                    <AssetTable />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Income Stream Tab */}
          {activeTab === 'income' && (
            <div className="min-h-[800px]">
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                <h2 className="text-lg font-display tracking-widest flex items-center gap-3 text-white">
                  <i className="fas fa-coins text-celestial-gold text-xs" /> INCOME STREAM
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={syncFromSheet}
                    className="celestial-btn text-[10px]"
                    style={{ borderColor: 'rgba(105,240,174,0.4)', color: '#69F0AE' }}
                  >
                    SYNC
                  </button>
                  <button
                    onClick={openDividendModal}
                    className="celestial-btn celestial-btn-gold text-[10px]"
                  >
                    RECORD
                  </button>
                </div>
              </div>
              <IncomeStream showAnalytics />
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="min-h-[800px]">
              <Analytics horizontal />
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 min-h-[800px]">
              <div className="xl:col-span-1">
                <PerformanceArena compact />
              </div>
              <div className="xl:col-span-3">
                <HistoricPerformance />
              </div>
            </div>
          )}

          {/* Simulation Tab */}
          {activeTab === 'simulation' && (
            <div className="flex flex-col min-h-[800px]">
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3 flex-shrink-0">
                <h2 className="text-base font-semibold text-white font-display tracking-widest flex items-center gap-2">
                  <i className="fas fa-flask text-v64-success" /> SIMULATION
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                <SimulationHub />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] opacity-30 py-4 tracking-[0.3em]">
        CELESTIAL NEXUS V65.10 // NEXT.JS EDITION
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <NexusProvider>
      <DashboardContent />
    </NexusProvider>
  );
}
