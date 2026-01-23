'use client';

import { useState, useMemo, useCallback } from 'react';
import { NexusProvider, useNexus } from '@/lib/context';
import Header from '@/components/Header';
import PortfolioHealthAlert from '@/components/PortfolioHealthAlert';
import StrategyBar from '@/components/StrategyBar';
import AssetTable from '@/components/AssetTable';
import PortfolioHeatmap from '@/components/PortfolioHeatmap';
import SimulationHub from '@/components/SimulationHub';
import Analytics from '@/components/Analytics';
import AssetModal from '@/components/AssetModal';
import DividendModal from '@/components/DividendModal';
import TradeJournal from '@/components/TradeJournal';
import SettingsModal from '@/components/SettingsModal';
import AuthModal from '@/components/AuthModal';
import FreedomModal from '@/components/FreedomModal';
import ExportModal from '@/components/ExportModal';
import IncomeStream from '@/components/IncomeStream';
import DividendOptimizer from '@/components/DividendOptimizer';
import PortfolioInsight from '@/components/PortfolioInsight';
import RebalanceSuggestion from '@/components/RebalanceSuggestion';
import MonthlyReport from '@/components/MonthlyReport';
import StressTest from '@/components/StressTest';
import PerformanceArena from '@/components/PerformanceArena';
import HistoricPerformance from '@/components/HistoricPerformance';

type TabType = 'stellar' | 'income' | 'analytics' | 'performance' | 'simulation';
type ViewMode = 'table' | 'heatmap';

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
  const [exportOpen, setExportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('stellar');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isColSettingsOpen, setIsColSettingsOpen] = useState(false);

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
  const handleOpenExport = useCallback(() => setExportOpen(true), []);
  const handleCloseExport = useCallback(() => setExportOpen(false), []);

  return (
    <div className="max-w-[1900px] mx-auto p-2 md:p-4 lg:p-6 space-y-3 md:space-y-5">
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
      <ExportModal isOpen={exportOpen} onClose={handleCloseExport} />

      {/* Header */}
      <Header
        onOpenSettings={handleOpenSettings}
        onOpenAuth={handleOpenAuth}
        onOpenFreedom={handleOpenFreedom}
        onOpenExport={handleOpenExport}
      />

      {/* Portfolio Health Alerts */}
      <PortfolioHealthAlert />

      {/* Strategy Bar */}
      <StrategyBar />

      {/* Main Content with Left Sidebar Tabs - Seamless Connection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 glass-card overflow-hidden relative">
        {/* Left Sidebar Tabs - 모바일: 가로 스크롤, 데스크톱: 세로 */}
        <div className="lg:col-span-2 p-2 md:p-4 flex flex-col h-full relative z-10">
          <div className="hidden lg:block text-[10px] tracking-[0.15em] text-white/50 mb-3 uppercase font-medium text-center">Navigation</div>
          <div className="flex lg:flex-col flex-1 gap-0 relative overflow-x-auto lg:overflow-x-visible custom-scrollbar">
            {/* Stellar Assets - Cyan (핵심 자산) */}
            <button
              onClick={() => setActiveTab('stellar')}
              className={`flex-1 lg:w-full whitespace-nowrap px-3 md:px-4 py-2 md:py-3 transition-all duration-300 flex items-center justify-center relative ${
                activeTab === 'stellar'
                  ? 'text-celestial-cyan border-b-[3px] lg:border-b-0 lg:border-l-[3px] border-celestial-cyan bg-celestial-cyan/10'
                  : 'text-white/70 hover:bg-celestial-cyan/10 hover:text-celestial-cyan'
              }`}
            >
              <div className="flex items-center gap-1.5 md:gap-2.5">
                <i className="fas fa-star text-[10px] md:text-xs" />
                <span className="text-[11px] md:text-[13px] font-medium tracking-wide">Stellar</span>
              </div>
            </button>
            {/* Income Stream - Gold (배당/수익) */}
            <button
              onClick={() => setActiveTab('income')}
              className={`flex-1 lg:w-full whitespace-nowrap px-3 md:px-4 py-2 md:py-3 transition-all duration-300 flex items-center justify-center relative ${
                activeTab === 'income'
                  ? 'text-celestial-gold border-b-[3px] lg:border-b-0 lg:border-l-[3px] border-celestial-gold bg-celestial-gold/10'
                  : 'text-white/70 hover:bg-celestial-gold/10 hover:text-celestial-gold'
              }`}
            >
              <div className="flex items-center gap-1.5 md:gap-2.5">
                <i className="fas fa-coins text-[10px] md:text-xs" />
                <span className="text-[11px] md:text-[13px] font-medium tracking-wide">Income</span>
              </div>
            </button>
            {/* Analytics - Purple (분석/리스크) */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 lg:w-full whitespace-nowrap px-3 md:px-4 py-2 md:py-3 transition-all duration-300 flex items-center justify-center relative ${
                activeTab === 'analytics'
                  ? 'text-celestial-purple border-b-[3px] lg:border-b-0 lg:border-l-[3px] border-celestial-purple bg-celestial-purple/10'
                  : 'text-white/70 hover:bg-celestial-purple/10 hover:text-celestial-purple'
              }`}
            >
              <div className="flex items-center gap-1.5 md:gap-2.5">
                <i className="fas fa-shield-alt text-[10px] md:text-xs" />
                <span className="text-[11px] md:text-[13px] font-medium tracking-wide">Analytics</span>
              </div>
            </button>
            {/* Performance - Green (성과/수익률) */}
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex-1 lg:w-full whitespace-nowrap px-3 md:px-4 py-2 md:py-3 transition-all duration-300 flex items-center justify-center relative ${
                activeTab === 'performance'
                  ? 'text-v64-success border-b-[3px] lg:border-b-0 lg:border-l-[3px] border-v64-success bg-v64-success/10'
                  : 'text-white/70 hover:bg-v64-success/10 hover:text-v64-success'
              }`}
            >
              <div className="flex items-center gap-1.5 md:gap-2.5">
                <i className="fas fa-chart-line text-[10px] md:text-xs" />
                <span className="text-[11px] md:text-[13px] font-medium tracking-wide">Performance</span>
              </div>
            </button>
            {/* Simulation - Orange (시뮬레이션/실험) */}
            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex-1 lg:w-full whitespace-nowrap px-3 md:px-4 py-2 md:py-3 transition-all duration-300 flex items-center justify-center relative ${
                activeTab === 'simulation'
                  ? 'text-orange-400 border-b-[3px] lg:border-b-0 lg:border-l-[3px] border-orange-500 bg-orange-500/10'
                  : 'text-white/70 hover:bg-orange-500/10 hover:text-orange-400'
              }`}
            >
              <div className="flex items-center gap-1.5 md:gap-2.5">
                <i className="fas fa-flask text-[10px] md:text-xs" />
                <span className="text-[11px] md:text-[13px] font-medium tracking-wide">Simulation</span>
              </div>
            </button>
          </div>
        </div>

        {/* Main Content Area with Subtle Tab Color Connection */}
        <div
          className="lg:col-span-10 min-h-[500px] md:min-h-[800px] p-3 md:p-4 lg:p-5 relative transition-colors duration-300"
          style={{
            borderLeft: activeTab === 'stellar'
              ? '1px solid rgba(34,211,238,0.2)'
              : activeTab === 'income'
              ? '1px solid rgba(251,191,36,0.2)'
              : activeTab === 'analytics'
              ? '1px solid rgba(168,85,247,0.2)'
              : activeTab === 'performance'
              ? '1px solid rgba(105,240,174,0.2)'
              : '1px solid rgba(249,115,22,0.2)'
          }}
        >
          {/* Stellar Assets Tab */}
          {activeTab === 'stellar' && (
            <div className="h-full min-h-[500px] md:min-h-[800px]">
              <div className="flex justify-between items-end mb-4 pb-2 border-b border-white/10">
                <h2 className="text-lg font-display tracking-widest flex items-center gap-3 text-white">
                  <i className="fas fa-star text-celestial-gold text-xs" /> STELLAR ASSETS
                </h2>
                <div className="flex items-center gap-4">
                  {/* Column Settings Button */}
                  <button
                    onClick={() => setIsColSettingsOpen(!isColSettingsOpen)}
                    className="celestial-btn text-[9px] flex items-center gap-1.5"
                    title="컬럼 설정"
                  >
                    <i className="fas fa-columns" />
                    <span className="hidden sm:inline">컬럼</span>
                  </button>

                  {/* View Mode Toggle: Table / Heatmap */}
                  <div className="flex items-center gap-1 inner-glass rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1.5 rounded text-[10px] font-medium tracking-wide transition-all ${
                        viewMode === 'table'
                          ? 'bg-celestial-cyan/20 text-celestial-cyan border border-celestial-cyan/30'
                          : 'text-white/60 hover:text-white/80'
                      }`}
                    >
                      <i className="fas fa-table mr-1.5" />
                      TABLE
                    </button>
                    <button
                      onClick={() => setViewMode('heatmap')}
                      className={`px-3 py-1.5 rounded text-[10px] font-medium tracking-wide transition-all ${
                        viewMode === 'heatmap'
                          ? 'bg-celestial-purple/20 text-celestial-purple border border-celestial-purple/30'
                          : 'text-white/60 hover:text-white/80'
                      }`}
                    >
                      <i className="fas fa-th-large mr-1.5" />
                      HEATMAP
                    </button>
                  </div>
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
              {incomeAssets.length > 0 && viewMode === 'table' && (
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

              {/* Asset Table or Heatmap */}
              {viewMode === 'table' ? (
                <div className="flex flex-col h-[600px]">
                  <div className="flex-1 min-h-0">
                    <div className="overflow-y-auto custom-scrollbar h-full">
                      <AssetTable
                        isColSettingsOpen={isColSettingsOpen}
                        setIsColSettingsOpen={setIsColSettingsOpen}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[650px]">
                  <PortfolioHeatmap />
                </div>
              )}

              {/* Trade Journal Section */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <h3 className="text-base font-display tracking-widest flex items-center gap-3 text-white mb-4">
                  <i className="fas fa-receipt text-celestial-gold text-xs" /> TRADE JOURNAL
                </h3>
                <TradeJournal />
              </div>
            </div>
          )}

          {/* Income Stream Tab */}
          {activeTab === 'income' && (
            <div className="min-h-[800px] space-y-6">
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

              {/* Dividend Optimizer Only */}
              <div className="pt-4 border-t border-white/10">
                <div className="inner-glass p-4 rounded-lg">
                  <DividendOptimizer />
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="min-h-[800px] space-y-6">
              <Analytics horizontal />

              {/* Rebalance & Insight Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="inner-glass p-4 rounded-lg">
                  <RebalanceSuggestion />
                </div>
                <div className="inner-glass p-4 rounded-lg">
                  <PortfolioInsight />
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-5 min-h-[800px]">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
                <div className="xl:col-span-1">
                  <PerformanceArena compact />
                </div>
                <div className="xl:col-span-3">
                  <HistoricPerformance />
                </div>
              </div>
              {/* Monthly Report */}
              <div className="inner-glass p-4 rounded-lg">
                <MonthlyReport />
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
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 space-y-5">
                <SimulationHub />
                {/* Stress Test */}
                <div className="inner-glass p-4 rounded-lg">
                  <StressTest />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] opacity-30 py-4 tracking-[0.3em]">
        NEXUS DASHBOARD v1.0 // NEXT.JS EDITION
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
