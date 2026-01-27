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
import PortfolioTimeline from '@/components/charts/PortfolioTimeline';
import { BottomNavigation, DEFAULT_NAV_ITEMS } from '@/components/ui/BottomNavigation';
import { useTabNavigation } from '@/lib/hooks/useKeyboardNavigation';

type TabType = 'stellar' | 'income' | 'analytics' | 'performance' | 'simulation';
type ViewMode = 'table' | 'heatmap';

const TAB_IDS: TabType[] = ['stellar', 'income', 'analytics', 'performance', 'simulation'];

const TAB_CONFIG = {
  stellar: { label: 'Stellar', icon: 'fas fa-star', color: '#22d3ee' },
  income: { label: 'Income', icon: 'fas fa-coins', color: '#ffd700' },
  analytics: { label: 'Analytics', icon: 'fas fa-shield-alt', color: '#a855f7' },
  performance: { label: 'Performance', icon: 'fas fa-chart-line', color: '#4ade80' },
  simulation: { label: 'Simulation', icon: 'fas fa-flask', color: '#f97316' },
} as const;

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

  // Keyboard navigation for tabs
  const { handleKeyDown: handleTabKeyDown } = useTabNavigation(
    TAB_IDS,
    activeTab,
    (tab) => setActiveTab(tab as TabType),
    'vertical'
  );

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
      <div className="grid grid-cols-1 lg:grid-cols-12 glass-card overflow-hidden relative pb-16 lg:pb-0">
        {/* Left Sidebar Tabs - 데스크톱 전용 (모바일은 하단 네비게이션 사용) */}
        <div className="hidden lg:flex lg:col-span-2 p-2 md:p-4 flex-col h-full relative z-10">
          <div className="text-[10px] tracking-[0.15em] text-white/50 mb-3 uppercase font-medium text-center">Navigation</div>
          <div
            role="tablist"
            aria-label="대시보드 탭 네비게이션"
            aria-orientation="vertical"
            className="flex flex-col flex-1 gap-0 relative"
            onKeyDown={handleTabKeyDown}
          >
            {TAB_IDS.map((tabId) => {
              const config = TAB_CONFIG[tabId];
              const isActive = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  role="tab"
                  id={`tab-${tabId}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${tabId}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(tabId)}
                  className={`w-full whitespace-nowrap px-4 py-3 transition-all duration-300 flex items-center justify-center relative focus-visible-ring ${
                    isActive
                      ? 'border-l-[3px] bg-current/10'
                      : 'text-white/70 hover:bg-white/5 border-l-[3px] border-transparent'
                  }`}
                  style={{
                    color: isActive ? config.color : undefined,
                    borderColor: isActive ? config.color : undefined
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <i className={`${config.icon} text-xs`} aria-hidden="true" />
                    <span className="text-[13px] font-medium tracking-wide">{config.label}</span>
                  </div>
                </button>
              );
            })}
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
            <div
              role="tabpanel"
              id="panel-stellar"
              aria-labelledby="tab-stellar"
              tabIndex={0}
              className="h-full min-h-[500px] md:min-h-[800px] tab-panel-enter">
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
            <div
              role="tabpanel"
              id="panel-income"
              aria-labelledby="tab-income"
              tabIndex={0}
              className="min-h-[800px] space-y-6 tab-panel-enter">
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
            <div
              role="tabpanel"
              id="panel-analytics"
              aria-labelledby="tab-analytics"
              tabIndex={0}
              className="min-h-[800px] space-y-6 tab-panel-enter">
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
            <div
              role="tabpanel"
              id="panel-performance"
              aria-labelledby="tab-performance"
              tabIndex={0}
              className="space-y-5 min-h-[800px] tab-panel-enter">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
                <div className="xl:col-span-1">
                  <PerformanceArena compact />
                </div>
                <div className="xl:col-span-3">
                  <HistoricPerformance />
                </div>
              </div>
              {/* Portfolio Timeline */}
              <PortfolioTimeline />
              {/* Monthly Report */}
              <div className="inner-glass p-4 rounded-lg">
                <MonthlyReport />
              </div>
            </div>
          )}

          {/* Simulation Tab */}
          {activeTab === 'simulation' && (
            <div
              role="tabpanel"
              id="panel-simulation"
              aria-labelledby="tab-simulation"
              tabIndex={0}
              className="flex flex-col min-h-[800px] tab-panel-enter">
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

      {/* Footer - Desktop */}
      <footer className="hidden lg:block text-center text-[10px] opacity-30 py-4 tracking-[0.3em]">
        NEXUS DASHBOARD v1.0 // NEXT.JS EDITION
      </footer>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation
        items={DEFAULT_NAV_ITEMS}
        activeItem={activeTab}
        onItemChange={(id) => setActiveTab(id as TabType)}
        className="lg:hidden"
      />
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
