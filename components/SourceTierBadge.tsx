'use client';

import { SourceTier, SourceReference } from '@/lib/types';
import { FREEDOM_CONFIG, getSourceTierInfo } from '@/lib/config';

// ═══════════════════════════════════════════════════════════════
// FREEDOM v31.0 - Source Tier Badge & Panel
// Truth Guardian의 Source Tier 시스템 시각화
// ═══════════════════════════════════════════════════════════════

interface SourceTierBadgeProps {
  tier: SourceTier;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SourceTierBadge({ tier, showLabel = false, size = 'md' }: SourceTierBadgeProps) {
  const tierInfo = getSourceTierInfo(tier);
  
  const sizeClasses = {
    sm: 'text-[7px] px-1 py-0.5',
    md: 'text-[9px] px-1.5 py-0.5',
    lg: 'text-[11px] px-2 py-1',
  };

  return (
    <span 
      className={`inline-flex items-center gap-1 rounded font-medium ${sizeClasses[size]}`}
      style={{ 
        backgroundColor: `${tierInfo.color}20`,
        color: tierInfo.color,
        borderColor: `${tierInfo.color}40`,
        borderWidth: 1,
      }}
      title={`${tierInfo.name} - ${(tierInfo.confidence * 100).toFixed(0)}% confidence`}
    >
      <span className="font-bold">{tierInfo.icon || `[${tier}]`}</span>
      {showLabel && <span>{tierInfo.name}</span>}
    </span>
  );
}

interface SourceReferencePanelProps {
  sources: SourceReference[];
  compact?: boolean;
}

export function SourceReferencePanel({ sources, compact = false }: SourceReferencePanelProps) {
  // 티어별로 그룹화
  const groupedSources = sources.reduce((acc, source) => {
    if (!acc[source.tier]) acc[source.tier] = [];
    acc[source.tier].push(source);
    return acc;
  }, {} as Record<SourceTier, SourceReference[]>);

  // 평균 신뢰도 계산
  const avgConfidence = sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length || 0;

  if (compact) {
    return (
      <div className="inner-glass p-3 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[9px] text-celestial-cyan tracking-widest flex items-center">
            <i className="fas fa-database mr-2" />
            DATA SOURCES
          </div>
          <span className="text-[9px] text-white/70">
            {sources.length} sources
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {(['S', 'A', 'B', 'C'] as SourceTier[]).map(tier => {
            const count = groupedSources[tier]?.length || 0;
            if (count === 0) return null;
            return (
              <div key={tier} className="flex items-center gap-1">
                <SourceTierBadge tier={tier} size="sm" />
                <span className="text-[8px] text-white/70">×{count}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[8px] text-white/70">Avg Confidence:</span>
          <span className={`text-[10px] font-medium ${
            avgConfidence >= 0.9 ? 'text-v64-success' :
            avgConfidence >= 0.7 ? 'text-celestial-gold' : 'text-v64-danger'
          }`}>
            {(avgConfidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] text-white/70 tracking-widest font-medium flex items-center">
          <i className="fas fa-database mr-2 text-celestial-cyan" />
          DATA SOURCES & CONFIDENCE
          <span className="ml-2 text-[9px] px-2 py-0.5 rounded bg-celestial-purple/20 text-celestial-purple">
            Truth Guardian
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-white/70">{sources.length} sources</span>
          <span className={`text-[11px] font-medium ${
            avgConfidence >= 0.9 ? 'text-v64-success' :
            avgConfidence >= 0.7 ? 'text-celestial-gold' : 'text-v64-danger'
          }`}>
            {(avgConfidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Tier Legend */}
      <div className="inner-glass p-3 rounded-lg mb-4">
        <div className="text-[9px] text-white/70 tracking-widest mb-2">SOURCE TIER SYSTEM</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['S', 'A', 'B', 'C'] as SourceTier[]).map(tier => {
            const tierInfo = getSourceTierInfo(tier);
            return (
              <div 
                key={tier}
                className="flex items-center gap-2 p-2 rounded"
                style={{ backgroundColor: `${tierInfo.color}10` }}
              >
                <SourceTierBadge tier={tier} size="sm" />
                <div className="text-[8px]">
                  <div className="text-white/70">{tierInfo.name}</div>
                  <div className="text-white/60">{(tierInfo.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sources by Tier */}
      <div className="space-y-3">
        {(['S', 'A', 'B', 'C'] as SourceTier[]).map(tier => {
          const tierSources = groupedSources[tier];
          if (!tierSources || tierSources.length === 0) return null;
          
          const tierInfo = getSourceTierInfo(tier);
          
          return (
            <div key={tier} className="inner-glass p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <SourceTierBadge tier={tier} />
                <span className="text-[10px] text-white/70">{tierInfo.name}</span>
                <span className="text-[9px] text-white/60">({tierSources.length})</span>
              </div>
              <div className="space-y-1.5">
                {tierSources.map((source, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/80">{source.name}</span>
                      <span className="text-[8px] text-white/60">{source.dataType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${source.confidence * 100}%`,
                            backgroundColor: tierInfo.color,
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-white/70 w-8 text-right">
                        {(source.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confidence Warning */}
      {avgConfidence < FREEDOM_CONFIG.CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE && (
        <div className="mt-4 inner-glass p-3 rounded-lg bg-v64-danger/10 border border-v64-danger/30">
          <div className="flex items-start gap-2">
            <i className="fas fa-exclamation-triangle text-v64-danger text-xs mt-0.5" />
            <div className="text-[9px] text-white/70">
              <span className="text-v64-danger font-medium">P27 경고:</span> 평균 신뢰도가 
              {(FREEDOM_CONFIG.CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE * 100).toFixed(0)}% 미만입니다.
              일부 분석 결과의 신뢰성이 제한될 수 있습니다.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 인라인 소스 표시 컴포넌트
export function InlineSourceBadge({ source }: { source: SourceReference }) {
  const tierInfo = getSourceTierInfo(source.tier);
  
  return (
    <span 
      className="inline-flex items-center gap-1 text-[8px] px-1 py-0.5 rounded cursor-help"
      style={{ 
        backgroundColor: `${tierInfo.color}15`,
        color: tierInfo.color,
      }}
      title={`${source.name} - ${source.dataType} (${(source.confidence * 100).toFixed(0)}% confidence)`}
    >
      {tierInfo.icon}
      <span className="text-white/60">{source.name}</span>
    </span>
  );
}

// 신뢰도 게이지 컴포넌트
interface ConfidenceGaugeProps {
  confidence: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceGauge({ confidence, label, size = 'md' }: ConfidenceGaugeProps) {
  const getColor = (value: number) => {
    if (value >= 0.9) return '#81C784';
    if (value >= 0.7) return '#FFD700';
    if (value >= 0.5) return '#FFB74D';
    return '#E57373';
  };

  const sizeConfig = {
    sm: { height: 'h-1', text: 'text-[9px]' },
    md: { height: 'h-1.5', text: 'text-[10px]' },
    lg: { height: 'h-2', text: 'text-[11px]' },
  };

  const config = sizeConfig[size];
  const color = getColor(confidence);

  return (
    <div className="flex items-center gap-2">
      {label && <span className={`${config.text} text-white/70`}>{label}</span>}
      <div className={`flex-1 ${config.height} bg-white/10 rounded-full overflow-hidden`}>
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${confidence * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className={`${config.text} font-medium`} style={{ color }}>
        {(confidence * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export default SourceTierBadge;
