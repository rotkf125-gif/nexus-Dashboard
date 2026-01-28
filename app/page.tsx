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
import SettingsModal from '@/components/SettingsModal';
import AuthModal from '@/components/AuthModal';
import FreedomModal from '@/components/FreedomModal';
import ExportModal from '@/components/ExportModal';
import IncomeStream from '@/components/IncomeStream';
import DividendOptimizer from '@/components/DividendOptimizer';
import PerformanceArena from '@/components/PerformanceArena';
import HistoricPerformance from '@/components/HistoricPerformance';
import { BottomNavigation, DEFAULT_NAV_ITEMS } from '@/components/ui/BottomNavigation';
import { useTabNavigation } from '@/lib/hooks/useKeyboardNavigation';
import QuickStats from '@/components/stellar/QuickStats';
import InsightsPanel from '@/components/stellar/InsightsPanel';
import { usePortfolioStats } from '@/lib/hooks/usePortfolioStats';

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
    'horizontal'
  );

  // 포트폴리오 통계 (Stellar 탭용)
  const portfolioStats = usePortfolioStats();

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

      {/* Horizontal Tab Navigation - 데스크톱 전용 */}
      <div className="hidden lg:block glass-card p-2">
        <div
          role="tablist"
          aria-label="대시보드 탭 네비게이션"
          aria-orientation="horizontal"
          className="flex items-center justify-center gap-1"
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
                className={`whitespace-nowrap px-5 py-2.5 transition-all duration-300 flex items-center justify-center relative focus-visible-ring rounded-lg ${
                  isActive
                    ? 'border-b-[3px] bg-current/10'
                    : 'text-white/70 hover:bg-white/5 border-b-[3px] border-transparent'
                }`}
                style={{
                  color: isActive ? config.color : undefined,
                  borderColor: isActive ? config.color : undefined
                }}
              >
                <div className="flex items-center gap-2">
                  <i className={`${config.icon} text-xs`} aria-hidden="true" />
                  <span className="text-[12px] font-medium tracking-wide">{config.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area - Full Width */}
      <div className="glass-card min-h-[500px] md:min-h-[800px] p-3 md:p-4 lg:p-5 relative pb-16 lg:pb-5">
          {/* Stellar Assets Tab */}
          {activeTab === 'stellar' && (
            <div
              role="tabpanel"
              id="panel-stellar"
              aria-labelledby="tab-stellar"
              tabIndex={0}
              className="h-full min-h-[500px] md:min-h-[800px] tab-panel-enter">
              {/* Header */}
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

              {/* Quick Stats */}
              <QuickStats stats={portfolioStats} />

              {/* 2-Column Layout: Assets (70%) + Insights (30%) - Full Width */}
              <div className="grid grid-cols-1 xl:grid-cols-[70%_30%] gap-4">
                {/* Left: Asset Table or Heatmap */}
                <div>
                  {viewMode === 'table' ? (
                    <div className="flex flex-col h-[650px]">
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
                </div>

                {/* Right: Insights Panel */}
                <div className="h-[650px]">
                  <InsightsPanel stats={portfolioStats} />
                </div>
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

              {/* Dividend Optimizer Only - Full Width */}
              <div className="pt-5 border-t border-white/10">
                <div className="inner-glass p-5 rounded-lg">
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
              className="min-h-[800px] tab-panel-enter">
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                <h2 className="text-lg font-display tracking-widest flex items-center gap-3 text-white">
                  <i className="fas fa-shield-alt text-purple-400 text-xs" /> RISK ANALYTICS
                </h2>
              </div>
              <Analytics horizontal />
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
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                <h2 className="text-lg font-display tracking-widest flex items-center gap-3 text-white">
                  <i className="fas fa-chart-line text-green-400 text-xs" /> PERFORMANCE ARENA
                </h2>
              </div>
              {/* 8:2 1-Row Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-10 gap-5" style={{ height: '480px' }}>
                <div className="xl:col-span-8 h-full">
                  <HistoricPerformance />
                </div>
                <div className="xl:col-span-2 h-full">
                  <PerformanceArena race />
                </div>
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
                <h2 className="text-lg font-display tracking-widest flex items-center gap-3 text-white">
                  <i className="fas fa-flask text-orange-400 text-xs" /> SIMULATION LAB
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                <SimulationHub />
              </div>
            </div>
          )}
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
