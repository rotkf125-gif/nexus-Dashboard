'use client';

import { useState } from 'react';
import WhatIfSimulator from './WhatIfSimulator';
import RebalanceSimulator from './RebalanceSimulator';
import CorrelationInsight from './CorrelationInsight';

type TabType = 'whatif' | 'rebalance' | 'correlation';

export default function SimulationHub() {
  const [activeTab, setActiveTab] = useState<TabType>('whatif');

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'whatif', label: 'WHAT-IF', icon: 'flask' },
    { id: 'rebalance', label: 'REBAL', icon: 'balance-scale' },
    { id: 'correlation', label: 'CORREL', icon: 'project-diagram' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tab Headers */}
      <div className="flex border-b border-white/10 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-[9px] tracking-widest transition-all ${
              activeTab === tab.id
                ? 'text-v64-success border-b-2 border-v64-success bg-v64-success/5'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <i className={`fas fa-${tab.icon} mr-1`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'whatif' && <WhatIfSimulator />}
        {activeTab === 'rebalance' && <RebalanceSimulator />}
        {activeTab === 'correlation' && <CorrelationInsight />}
      </div>
    </div>
  );
}
