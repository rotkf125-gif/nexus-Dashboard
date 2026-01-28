'use client';

import { AgentContribution, AgentStatus, AgentConsensus } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════
// FREEDOM v31.0 - Agent Status Panel
// Agent Mesh 아키텍처의 에이전트 상태 시각화
// ═══════════════════════════════════════════════════════════════

interface AgentStatusPanelProps {
  agents: AgentContribution[];
  consensus?: AgentConsensus[];
  crossValidation?: {
    consistencyScore: number;
    conflictsResolved: number;
    resolutionMethod: string;
  };
  compact?: boolean;
}

const STATUS_CONFIG: Record<AgentStatus, { color: string; icon: string; label: string }> = {
  active: { color: '#81C784', icon: 'fa-check-circle', label: 'Active' },
  warning: { color: '#FFB74D', icon: 'fa-exclamation-triangle', label: 'Warning' },
  inactive: { color: '#90A4AE', icon: 'fa-minus-circle', label: 'Inactive' },
  error: { color: '#E57373', icon: 'fa-times-circle', label: 'Error' },
};

// 에이전트 카테고리 분류
const AGENT_CATEGORIES: Record<string, { name: string; color: string }> = {
  Head: { name: 'Analysis Heads', color: '#BB86FC' },
  Macro: { name: 'Macro Agents', color: '#64B5F6' },
  Market: { name: 'Market Agents', color: '#81C784' },
  Sector: { name: 'Sector Agents', color: '#FFB74D' },
  Risk: { name: 'Risk Agents', color: '#E57373' },
};

function getAgentCategory(agentId: string): string {
  if (agentId.includes('Head')) return 'Head';
  if (agentId.includes('Macro') || agentId.includes('CentralBank')) return 'Macro';
  if (agentId.includes('Stock') || agentId.includes('Bond') || agentId.includes('Forex')) return 'Market';
  if (agentId.includes('Sector')) return 'Sector';
  if (agentId.includes('Risk') || agentId.includes('Geopolitical')) return 'Risk';
  return 'Head';
}

export default function AgentStatusPanel({
  agents,
  consensus,
  crossValidation,
  compact = false,
}: AgentStatusPanelProps) {
  // 에이전트를 카테고리별로 그룹화
  const groupedAgents = agents.reduce((acc, agent) => {
    const category = getAgentCategory(agent.id);
    if (!acc[category]) acc[category] = [];
    acc[category].push(agent);
    return acc;
  }, {} as Record<string, AgentContribution[]>);

  // 전체 통계
  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    avgContribution: agents.reduce((sum, a) => sum + a.contribution, 0) / agents.length || 0,
    avgDataQuality: agents.reduce((sum, a) => sum + a.dataQuality, 0) / agents.length || 0,
  };

  if (compact) {
    return (
      <div className="inner-glass p-3 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] text-celestial-purple tracking-widest flex items-center">
            <i className="fas fa-robot mr-2" />
            AGENT MESH
          </div>
          <span className="text-[9px] text-white/70">
            {stats.active}/{stats.total} active
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {agents.slice(0, 6).map((agent, idx) => {
            const statusConfig = STATUS_CONFIG[agent.status];
            return (
              <span
                key={idx}
                className="px-2 py-0.5 text-[8px] rounded flex items-center gap-1"
                style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}
              >
                <i className={`fas ${statusConfig.icon} text-[6px]`} />
                {agent.name.split('.').pop()}
              </span>
            );
          })}
          {agents.length > 6 && (
            <span className="px-2 py-0.5 text-[8px] rounded bg-white/10 text-white/70">
              +{agents.length - 6} more
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] text-white/70 tracking-widest font-medium flex items-center">
          <i className="fas fa-robot mr-2 text-celestial-purple" />
          AGENT MESH STATUS
          <span className="ml-2 text-[9px] px-2 py-0.5 rounded bg-celestial-purple/20 text-celestial-purple">
            v31.0
          </span>
        </h3>
        <div className="flex items-center gap-3 text-[9px]">
          <span className="text-v64-success">
            <i className="fas fa-check-circle mr-1" />
            {stats.active} Active
          </span>
          <span className="text-white/70">
            {stats.total} Total
          </span>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="inner-glass p-3 rounded-lg text-center">
          <div className="text-[8px] text-white/70 uppercase mb-1">Avg Contribution</div>
          <div className="text-lg font-bold text-celestial-purple">
            {(stats.avgContribution * 100).toFixed(0)}%
          </div>
        </div>
        <div className="inner-glass p-3 rounded-lg text-center">
          <div className="text-[8px] text-white/70 uppercase mb-1">Data Quality</div>
          <div className="text-lg font-bold text-celestial-cyan">
            {(stats.avgDataQuality * 100).toFixed(0)}%
          </div>
        </div>
        {crossValidation && (
          <div className="inner-glass p-3 rounded-lg text-center">
            <div className="text-[8px] text-white/70 uppercase mb-1">Consistency</div>
            <div className="text-lg font-bold text-v64-success">
              {crossValidation.consistencyScore}%
            </div>
          </div>
        )}
      </div>

      {/* Agents by Category */}
      <div className="space-y-3">
        {Object.entries(groupedAgents).map(([category, categoryAgents]) => {
          const categoryConfig = AGENT_CATEGORIES[category] || { name: category, color: '#90A4AE' };
          return (
            <div key={category} className="inner-glass p-3 rounded-lg">
              <div 
                className="text-[9px] tracking-widest mb-2 flex items-center"
                style={{ color: categoryConfig.color }}
              >
                <span 
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: categoryConfig.color }}
                />
                {categoryConfig.name}
              </div>
              <div className="space-y-2">
                {categoryAgents.map((agent, idx) => {
                  const statusConfig = STATUS_CONFIG[agent.status];
                  return (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <i 
                          className={`fas ${statusConfig.icon} text-[10px]`}
                          style={{ color: statusConfig.color }}
                        />
                        <span className="text-[10px] text-white/80">{agent.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${agent.contribution * 100}%`,
                              backgroundColor: categoryConfig.color,
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-white/70 w-8 text-right">
                          {(agent.contribution * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Consensus Section */}
      {consensus && consensus.length > 0 && (
        <div className="mt-4 inner-glass p-3 rounded-lg">
          <div className="text-[9px] text-celestial-cyan tracking-widest mb-2 flex items-center">
            <i className="fas fa-handshake mr-2" />
            AGENT CONSENSUS
          </div>
          <div className="space-y-2">
            {consensus.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-[10px] text-white/70">{item.topic}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded ${
                    item.agreementLevel === 'full' ? 'bg-v64-success/20 text-v64-success' :
                    item.agreementLevel === 'partial' ? 'bg-celestial-gold/20 text-celestial-gold' :
                    'bg-v64-danger/20 text-v64-danger'
                  }`}>
                    {item.agreementLevel === 'full' ? '완전 합의' :
                     item.agreementLevel === 'partial' ? '부분 합의' : '의견 불일치'}
                  </span>
                  <span className="text-[8px] text-white/60">
                    {item.agentCount}/{item.totalAgents}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross Validation */}
      {crossValidation && (
        <div className="mt-4 inner-glass p-3 rounded-lg border border-celestial-cyan/20">
          <div className="text-[9px] text-celestial-cyan tracking-widest mb-2 flex items-center">
            <i className="fas fa-check-double mr-2" />
            CROSS-AGENT VALIDATION
          </div>
          <div className="grid grid-cols-3 gap-2 text-[9px]">
            <div>
              <span className="text-white/70">일관성</span>
              <div className="text-white font-medium">{crossValidation.consistencyScore}%</div>
            </div>
            <div>
              <span className="text-white/70">충돌 해결</span>
              <div className="text-white font-medium">{crossValidation.conflictsResolved}건</div>
            </div>
            <div>
              <span className="text-white/70">해결 방식</span>
              <div className="text-white font-medium">{crossValidation.resolutionMethod}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 간단한 에이전트 상태 표시 컴포넌트
export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px]"
      style={{ backgroundColor: `${config.color}20`, color: config.color }}
    >
      <i className={`fas ${config.icon} text-[8px]`} />
      {config.label}
    </span>
  );
}
