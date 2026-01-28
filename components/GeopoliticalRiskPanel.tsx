'use client';

import { useNexus } from '@/lib/context';
import { useGeopoliticalRisk } from '@/lib/hooks/useGeopoliticalRisk';
import { GeopoliticalRiskLevel } from '@/lib/types';
import { FREEDOM_CONFIG } from '@/lib/config';

// ═══════════════════════════════════════════════════════════════
// FREEDOM v31.0 - Geopolitical Risk Panel
// GeopoliticalRiskAgent 기반 지정학적 리스크 시각화
// ═══════════════════════════════════════════════════════════════

interface GeopoliticalRiskPanelProps {
  compact?: boolean;
}

export default function GeopoliticalRiskPanel({ compact = false }: GeopoliticalRiskPanelProps) {
  const { state } = useNexus();
  const riskAnalysis = useGeopoliticalRisk(state.assets, state.market);

  const getLevelIcon = (level: GeopoliticalRiskLevel) => {
    return FREEDOM_CONFIG.GEOPOLITICAL_RISK_LEVELS[level].emoji;
  };

  const getLevelColor = (level: GeopoliticalRiskLevel) => {
    return FREEDOM_CONFIG.GEOPOLITICAL_RISK_LEVELS[level].color;
  };

  if (compact) {
    return (
      <div className="inner-glass p-3 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getLevelIcon(riskAnalysis.overallLevel)}</span>
            <div>
              <div className="text-[10px] text-white/70 tracking-widest">GEOPOLITICAL RISK</div>
              <div 
                className="text-sm font-bold"
                style={{ color: getLevelColor(riskAnalysis.overallLevel) }}
              >
                {riskAnalysis.levelInfo.label}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-white/70">SCORE</div>
            <div className="text-lg font-bold text-white">{riskAnalysis.riskScore}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] text-white/70 tracking-widest font-medium flex items-center">
          <i className="fas fa-globe mr-2 text-celestial-cyan" />
          GEOPOLITICAL RISK MONITOR
          <span className="ml-2 text-[9px] px-2 py-0.5 rounded bg-celestial-purple/20 text-celestial-purple">
            v31.0
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getLevelIcon(riskAnalysis.overallLevel)}</span>
          <div 
            className="text-lg font-bold"
            style={{ color: getLevelColor(riskAnalysis.overallLevel) }}
          >
            {riskAnalysis.levelInfo.label}
          </div>
        </div>
      </div>

      {/* Risk Score Gauge */}
      <div className="inner-glass p-4 rounded-xl mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-white/70 tracking-widest">RISK SCORE</span>
          <span className="text-2xl font-bold text-white">{riskAnalysis.riskScore}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${riskAnalysis.riskScore}%`,
              backgroundColor: getLevelColor(riskAnalysis.overallLevel),
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[8px] text-white/30">
          <span>LOW</span>
          <span>MODERATE</span>
          <span>HIGH</span>
          <span>EXTREME</span>
        </div>
      </div>

      {/* Risk Levels Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="inner-glass p-3 rounded-lg">
          <div className="text-[9px] text-white/70 tracking-widest mb-1">VIX LEVEL</div>
          <div className="flex items-center gap-2">
            <span>{getLevelIcon(riskAnalysis.vixLevel)}</span>
            <span 
              className="text-sm font-medium"
              style={{ color: getLevelColor(riskAnalysis.vixLevel) }}
            >
              {state.market.vix?.toFixed(1) || 'N/A'}
            </span>
          </div>
        </div>
        <div className="inner-glass p-3 rounded-lg">
          <div className="text-[9px] text-white/70 tracking-widest mb-1">SENSITIVITY</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              {(riskAnalysis.portfolioSensitivity * 100).toFixed(0)}%
            </span>
            <span className="text-[9px] text-white/60">
              {riskAnalysis.portfolioSensitivity > 0.7 ? 'HIGH' : 
               riskAnalysis.portfolioSensitivity > 0.5 ? 'MODERATE' : 'LOW'}
            </span>
          </div>
        </div>
      </div>

      {/* Active Issues */}
      {riskAnalysis.issues.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] text-white/70 tracking-widest mb-2">ACTIVE ISSUES</div>
          <div className="space-y-2">
            {riskAnalysis.issues.map((issue, idx) => (
              <div 
                key={idx}
                className="inner-glass p-3 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span>{getLevelIcon(issue.status)}</span>
                  <div>
                    <div className="text-[11px] text-white/80">{issue.issue}</div>
                    <div className="text-[9px] text-white/60">
                      {issue.impactSectors.slice(0, 3).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div 
                    className="text-sm font-medium"
                    style={{ color: issue.portfolioExposure > 0.3 ? '#E57373' : '#FFB74D' }}
                  >
                    {(issue.portfolioExposure * 100).toFixed(0)}%
                  </div>
                  <div className="text-[8px] text-white/60">EXPOSURE</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sector Exposures */}
      <div className="mb-4">
        <div className="text-[10px] text-white/70 tracking-widest mb-2">SECTOR RISK CONTRIBUTION</div>
        <div className="space-y-2">
          {riskAnalysis.sectorExposures.slice(0, 5).map((sector, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-20 text-[10px] text-white/60 truncate">{sector.sector}</div>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${sector.riskContribution * 100}%`,
                    backgroundColor: sector.sensitivity > 0.7 ? '#E57373' : 
                                    sector.sensitivity > 0.5 ? '#FFB74D' : '#81C784',
                  }}
                />
              </div>
              <div className="w-12 text-[9px] text-white/70 text-right">
                {(sector.riskContribution * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {riskAnalysis.recommendations.length > 0 && (
        <div className="inner-glass p-3 rounded-xl border border-white/10">
          <div className="text-[10px] text-celestial-cyan tracking-widest mb-2 flex items-center">
            <i className="fas fa-lightbulb mr-2" />
            RECOMMENDATIONS
          </div>
          <ul className="space-y-1">
            {riskAnalysis.recommendations.map((rec, idx) => (
              <li key={idx} className="text-[10px] text-white/70 flex items-start gap-2">
                <span className="text-celestial-cyan mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Required */}
      <div 
        className="mt-4 p-3 rounded-lg text-center text-[11px] font-medium"
        style={{ 
          backgroundColor: `${getLevelColor(riskAnalysis.overallLevel)}20`,
          borderColor: `${getLevelColor(riskAnalysis.overallLevel)}50`,
          borderWidth: 1,
          color: getLevelColor(riskAnalysis.overallLevel),
        }}
      >
        {riskAnalysis.levelInfo.action}
      </div>
    </div>
  );
}
