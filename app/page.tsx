'use client';

import { useState } from 'react';
import { NexusProvider, useNexus } from '@/lib/context';
import Header from '@/components/Header';
import StrategyBar from '@/components/StrategyBar';
import AssetTable from '@/components/AssetTable';
import StarCore from '@/components/StarCore';
import Sidebar from '@/components/Sidebar';
import SimulationHub from '@/components/SimulationHub';
import RiskAnalytics from '@/components/RiskAnalytics';
import AssetModal from '@/components/AssetModal';
import DividendModal from '@/components/DividendModal';
import SettingsModal from '@/components/SettingsModal';
import AuthModal from '@/components/AuthModal';
import FreedomModal from '@/components/FreedomModal';
import IncomeStream from '@/components/IncomeStream';
import PerformanceArena from '@/components/PerformanceArena';
import HistoricPerformance from '@/components/HistoricPerformance';

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

  // INCOME 자산에서 배당 카운트다운 계산
  const incomeAssets = state.assets.filter(a => a.type === 'INCOME');
  const getDividendCountdown = (ticker: string) => {
    // 매주 목요일 배당 가정
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
    return `D-${daysUntilThursday}`;
  };

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
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onAuthChange={() => {}} />
      <FreedomModal isOpen={freedomOpen} onClose={() => setFreedomOpen(false)} />

      {/* Header */}
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenFreedom={() => setFreedomOpen(true)}
      />

      {/* Strategy Bar */}
      <StrategyBar />

      {/* Row 1: Stellar Assets (StarCore + Sidebar 가로) + Simulation */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Stellar Assets (4/5) - StarCore + Sidebar 가로 배치 */}
        <div className="xl:col-span-4 glass-card glass-card-primary p-6">
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
                  onClick={() => refreshPrices()}
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

          {/* Stellar Assets 내부: 1/4 + 3/4 세로 분할 */}
          <div className="flex flex-col h-[600px]">
            {/* StarCore + Sidebar 가로 배치 (1/4 = 150px) */}
            <div className="flex flex-col lg:flex-row gap-4 items-center h-[150px] flex-shrink-0">
              {/* Star Core */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <StarCore />
              </div>

              {/* Sidebar - 가로로 확장 */}
              <div className="flex-1 min-w-0">
                <Sidebar horizontal />
              </div>
            </div>

            {/* Asset Table (3/4 = 나머지 공간) */}
            <div className="flex-1 border-t border-white/10 pt-4 mt-4 min-h-0">
              <div className="overflow-y-auto custom-scrollbar h-full">
                <AssetTable />
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Hub (1/5) */}
        <div className="glass-card p-5 border-accent-success flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3 flex-shrink-0">
            <h2 className="text-base font-semibold text-white font-display tracking-widest flex items-center gap-2">
              <i className="fas fa-flask text-v64-success" /> SIMULATION
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            <SimulationHub />
          </div>
        </div>
      </div>

      {/* Row 2: Risk Analytics (가로 배치) */}
      <RiskAnalytics horizontal />

      {/* Row 3: Income Stream (통합) */}
      <div className="glass-card p-5 border-accent-gold">
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

      {/* Row 4: Performance Arena (1/4) + Historic Performance (3/4) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="xl:col-span-1">
          <PerformanceArena compact />
        </div>
        <div className="xl:col-span-3">
          <HistoricPerformance />
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] opacity-30 py-4 tracking-[0.3em]">
        CELESTIAL NEXUS V65.3 // NEXT.JS EDITION
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
