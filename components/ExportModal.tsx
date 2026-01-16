'use client';

// ═══════════════════════════════════════════════════════════════
// Export Modal - Gems 최적화 Export UI
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { EXPORT_OPTIONS, ExportFormat, generateExport } from '@/lib/export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { state, toast } = useNexus();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('gems-full');
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // 미리보기 생성
  const preview = useMemo(() => {
    if (!showPreview) return '';
    const full = generateExport(state, selectedFormat);
    // 미리보기는 앞부분만
    return full.length > 1500 ? full.slice(0, 1500) + '\n\n... (truncated)' : full;
  }, [state, selectedFormat, showPreview]);

  // 전체 Export 텍스트 길이
  const exportLength = useMemo(() => {
    const full = generateExport(state, selectedFormat);
    return full.length;
  }, [state, selectedFormat]);

  const handleExport = () => {
    const exportText = generateExport(state, selectedFormat);
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    toast('클립보드에 복사됨 - Gems에 붙여넣기 하세요', 'success');
    
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedOption = EXPORT_OPTIONS.find(o => o.id === selectedFormat);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="glass-card w-[520px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h3 className="font-semibold text-white text-base tracking-widest font-display flex items-center gap-2">
            <i className="fas fa-share-from-square text-celestial-cyan" />
            EXPORT TO GEMS
          </h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {/* Format Selection */}
          <div className="space-y-2 mb-5">
            <div className="text-[10px] text-white/50 tracking-widest font-medium mb-3">
              EXPORT FORMAT
            </div>
            {EXPORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedFormat(option.id)}
                className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                  selectedFormat === option.id
                    ? `bg-${option.color}/20 border border-${option.color}/50`
                    : 'bg-white/5 border border-transparent hover:bg-white/10'
                }`}
                style={{
                  backgroundColor: selectedFormat === option.id 
                    ? option.color === 'celestial-cyan' ? 'rgba(34,211,238,0.15)'
                    : option.color === 'celestial-gold' ? 'rgba(251,191,36,0.15)'
                    : option.color === 'v64-success' ? 'rgba(105,240,174,0.15)'
                    : option.color === 'celestial-purple' ? 'rgba(168,85,247,0.15)'
                    : 'rgba(255,255,255,0.05)'
                    : undefined,
                  borderColor: selectedFormat === option.id
                    ? option.color === 'celestial-cyan' ? 'rgba(34,211,238,0.5)'
                    : option.color === 'celestial-gold' ? 'rgba(251,191,36,0.5)'
                    : option.color === 'v64-success' ? 'rgba(105,240,174,0.5)'
                    : option.color === 'celestial-purple' ? 'rgba(168,85,247,0.5)'
                    : 'rgba(255,255,255,0.2)'
                    : undefined,
                }}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: option.color === 'celestial-cyan' ? 'rgba(34,211,238,0.2)'
                      : option.color === 'celestial-gold' ? 'rgba(251,191,36,0.2)'
                      : option.color === 'v64-success' ? 'rgba(105,240,174,0.2)'
                      : option.color === 'celestial-purple' ? 'rgba(168,85,247,0.2)'
                      : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <i 
                    className={`fas fa-${option.icon}`}
                    style={{
                      color: option.color === 'celestial-cyan' ? '#22d3ee'
                        : option.color === 'celestial-gold' ? '#fbbf24'
                        : option.color === 'v64-success' ? '#69F0AE'
                        : option.color === 'celestial-purple' ? '#a855f7'
                        : 'rgba(255,255,255,0.5)',
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{option.name}</div>
                  <div className="text-[11px] text-white/50">{option.description}</div>
                </div>
                {selectedFormat === option.id && (
                  <i className="fas fa-check text-celestial-cyan" />
                )}
              </button>
            ))}
          </div>

          {/* Selected Format Info */}
          <div className="inner-glass p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-white/50 tracking-widest font-medium">
                SELECTED: {selectedOption?.name.toUpperCase()}
              </div>
              <div className="text-[10px] text-white/40">
                ~{(exportLength / 1000).toFixed(1)}K chars
              </div>
            </div>
            <div className="text-[11px] text-white/70">
              {selectedFormat === 'gems-full' && (
                <>전체 포트폴리오 데이터를 Markdown 테이블 형식으로 내보냅니다. Freedom V30 Gems에서 종합 분석에 적합합니다.</>
              )}
              {selectedFormat === 'gems-quick' && (
                <>핵심 지표만 포함한 간략한 형식입니다. 빠른 요약이나 간단한 질문에 적합합니다.</>
              )}
              {selectedFormat === 'gems-income' && (
                <>배당/인컴 관련 데이터에 집중합니다. 배당 안전성, 월별 흐름 분석에 적합합니다.</>
              )}
              {selectedFormat === 'gems-rebalance' && (
                <>자산 배분 및 비중 데이터에 집중합니다. 리밸런싱 계획 수립에 적합합니다.</>
              )}
              {selectedFormat === 'json-raw' && (
                <>원본 JSON 형식입니다. 개발/디버깅 또는 다른 도구와 연동 시 사용합니다.</>
              )}
            </div>
          </div>

          {/* Preview Toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full text-left text-[10px] text-white/50 hover:text-white/70 transition-colors mb-2 flex items-center gap-2"
          >
            <i className={`fas fa-chevron-${showPreview ? 'down' : 'right'} text-[8px]`} />
            {showPreview ? '미리보기 숨기기' : '미리보기 보기'}
          </button>

          {/* Preview */}
          {showPreview && (
            <div className="inner-glass p-3 rounded-lg max-h-[250px] overflow-y-auto custom-scrollbar">
              <pre className="text-[10px] text-white/60 whitespace-pre-wrap font-mono leading-relaxed">
                {preview}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-black/20">
          {/* Usage Guide */}
          <div className="flex items-start gap-2 mb-4 p-3 bg-celestial-cyan/10 rounded-lg border border-celestial-cyan/20">
            <i className="fas fa-lightbulb text-celestial-cyan text-sm mt-0.5" />
            <div className="text-[10px] text-white/70 leading-relaxed">
              <strong className="text-celestial-cyan">사용 방법:</strong> 복사 후 Gemini의 Freedom V30 Gems에 붙여넣기 하세요.
              Gems가 데이터를 분석하여 맞춤형 인사이트를 제공합니다.
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="celestial-btn flex-1 border-white/20 text-white/50"
            >
              취소
            </button>
            <button
              onClick={handleExport}
              className={`celestial-btn flex-1 ${
                copied 
                  ? 'border-v64-success/50 text-v64-success bg-v64-success/10' 
                  : 'celestial-btn-gold'
              }`}
            >
              {copied ? (
                <>
                  <i className="fas fa-check mr-2" />
                  복사됨!
                </>
              ) : (
                <>
                  <i className="fas fa-copy mr-2" />
                  클립보드에 복사
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
