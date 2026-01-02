'use client';

import { useState } from 'react';
import { NexusProvider, useNexus } from '@/lib/context';
import Header from '@/components/Header';
import StrategyBar from '@/components/StrategyBar';
import AssetTable from '@/components/AssetTable';
import StarCore from '@/components/StarCore';
import Sidebar from '@/components/Sidebar';
import SimulationHub from '@/components/SimulationHub';
import AssetModal from '@/components/AssetModal';
import DividendModal from '@/components/DividendModal';
import SettingsModal from '@/components/SettingsModal';
import IncomeStream from '@/components/IncomeStream';
import DividendAnalytics from '@/components/DividendAnalytics';
import PerformanceArena from '@/components/PerformanceArena';

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

      {/* Header */}
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      {/* Strategy Bar */}
      <StrategyBar />

      {/* Main Grid: Assets (4/5) + What-If (1/5) */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Assets Section (4/5) */}
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

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Panel: Star Core + Sidebar */}
            <div className="lg:w-[340px] flex-shrink-0 flex flex-col gap-4">
              {/* Star Core */}
              <div className="flex flex-col items-center">
                <StarCore />
              </div>
              
              {/* Sidebar: Weight, Sector, Type, Rankings */}
              <Sidebar />
            </div>

            {/* Table */}
            <div className="flex-1 flex flex-col rounded bg-white/5 border border-white/5 min-h-[500px]">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <AssetTable />
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Hub (1/5) - What-If, Rebalance, Correlation */}
        <div className="glass-card p-5 border-accent-success">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
            <h2 className="text-base font-semibold text-white font-display tracking-widest flex items-center gap-2">
              <i className="fas fa-flask text-v64-success" /> SIMULATION
            </h2>
          </div>
          <SimulationHub />
        </div>
      </div>

      {/* Second Row: Income Stream + Dividend Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Income Stream (2/5) */}
        <div className="xl:col-span-2 glass-card p-5 border-accent-gold">
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
          <IncomeStream />
        </div>

        {/* Dividend Analytics (3/5) - DPS Trend + Learning 통합 */}
        <div className="xl:col-span-3 glass-card p-5 border-accent-purple">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
            <h2 className="text-lg font-display tracking-widest flex items-center gap-3 text-white">
              <i className="fas fa-chart-area text-celestial-purple text-xs" /> DIVIDEND ANALYTICS
            </h2>
          </div>
          <DividendAnalytics />
        </div>
      </div>

      {/* Third Row: Performance Arena */}
      <PerformanceArena />

      {/* Footer */}
      <footer className="text-center text-[10px] opacity-30 py-4 tracking-[0.3em]">
        CELESTIAL NEXUS V65.1 // NEXT.JS EDITION
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
