'use client';

import { NexusProvider } from '@/lib/context';
import Header from '@/components/Header';
import AssetTable from '@/components/AssetTable';
import StarCore from '@/components/StarCore';

export default function Home() {
  return (
    <NexusProvider>
      <div className="max-w-[1900px] mx-auto p-4 md:p-6 space-y-5">
        {/* Header */}
        <Header />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          {/* Star Core - 1/4 */}
          <div className="glass-card p-5 border-accent-gold">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <h2 className="text-base font-semibold font-display tracking-widest flex items-center gap-2 text-white">
                <i className="fas fa-sun text-celestial-gold text-xs" /> STAR CORE
              </h2>
              <span className="text-[9px] opacity-40">{new Date().toLocaleDateString('ko-KR')}</span>
            </div>
            <StarCore />
            
            {/* Weight Bars Placeholder */}
            <div className="mt-4 space-y-2">
              <div className="text-[9px] tracking-widest opacity-50">WEIGHT</div>
              {/* TODO: Weight bars */}
            </div>
          </div>

          {/* Asset Table - 3/4 */}
          <div className="xl:col-span-3 glass-card glass-card-primary p-5" id="asset-card">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <h2 className="text-lg font-display tracking-widest flex items-center gap-3 text-white">
                <i className="fas fa-meteor text-white/60 text-xs" /> CONSTELLATIONS
              </h2>
              <div className="flex items-center gap-4">
                <button className="celestial-btn celestial-btn-gold text-[10px]">
                  <i className="fas fa-plus mr-1" /> IGNITE STAR
                </button>
              </div>
            </div>
            
            <div className="flex gap-4">
              {/* Sidebar (sectors, rankings) placeholder */}
              <div className="w-[240px] flex-shrink-0 space-y-3">
                <div className="inner-glass p-3 rounded">
                  <div className="text-[9px] tracking-widest opacity-60 mb-2">
                    <i className="fas fa-chart-pie text-celestial-purple text-[8px] mr-1" /> SECTOR
                  </div>
                  <div className="text-[10px] opacity-40 text-center py-4">섹터 분석</div>
                </div>
                
                {/* Top/Bottom Rankings */}
                <div className="flex gap-3">
                  <div className="ranking-section flex-1">
                    <div className="ranking-title">
                      <i className="fas fa-trophy text-celestial-gold" /> TOP 3
                    </div>
                    <div className="text-[10px] opacity-40">--</div>
                  </div>
                  <div className="ranking-section flex-1">
                    <div className="ranking-title">
                      <i className="fas fa-exclamation-triangle text-v64-danger" /> BOTTOM 3
                    </div>
                    <div className="text-[10px] opacity-40">--</div>
                  </div>
                </div>
              </div>
              
              {/* Table */}
              <div className="flex-1 flex flex-col rounded bg-white/5 border border-white/5 min-h-[500px]">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <AssetTable />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row - Placeholder sections */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          {/* Income Stream */}
          <div className="xl:col-span-2 glass-card p-5 border-accent-gold">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <h2 className="text-lg font-display tracking-widest flex items-center gap-3 text-white">
                <i className="fas fa-coins text-celestial-gold text-xs" /> INCOME STREAM
              </h2>
            </div>
            <div className="text-center py-8 opacity-40">
              <i className="fas fa-chart-line text-2xl mb-2" />
              <p className="text-sm">배당 분석 섹션</p>
              <p className="text-[10px] mt-1">추후 구현 예정</p>
            </div>
          </div>

          {/* What-If Simulator */}
          <div className="glass-card p-5 border-accent-success">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <h2 className="text-base font-semibold font-display tracking-widest flex items-center gap-2 text-white">
                <i className="fas fa-flask text-celestial-success" /> WHAT-IF
              </h2>
            </div>
            <div className="text-center py-8 opacity-40">
              <i className="fas fa-sliders-h text-2xl mb-2" />
              <p className="text-sm">시나리오 시뮬레이터</p>
              <p className="text-[10px] mt-1">추후 구현 예정</p>
            </div>
          </div>

          {/* DPS Trend */}
          <div className="xl:col-span-2 glass-card p-5 border-accent-purple">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <h2 className="text-lg font-display tracking-widest flex items-center gap-3 text-white">
                <i className="fas fa-chart-area text-celestial-purple text-xs" /> DPS TREND
              </h2>
            </div>
            <div className="text-center py-8 opacity-40">
              <i className="fas fa-chart-bar text-2xl mb-2" />
              <p className="text-sm">DPS 트렌드 차트</p>
              <p className="text-[10px] mt-1">추후 구현 예정</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-[10px] opacity-30 py-4">
          NEXUS CELESTIAL V64.2 · Next.js Edition · Powered by Vercel
        </footer>
      </div>
    </NexusProvider>
  );
}
