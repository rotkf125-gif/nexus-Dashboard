// ═══════════════════════════════════════════════════════════════
// NEXUS V65.2 - Market Data Constants
// ═══════════════════════════════════════════════════════════════

export const ETF_SECTOR_DATA: Record<string, Record<string, number>> = {
  // === 주간 배당 ETF (Income ETFs) ===
  'PLTY': { Technology: 0.25, Finance: 0.20, Healthcare: 0.15, Consumer: 0.15, Energy: 0.10, Industrial: 0.10, Other: 0.05 },
  'HOOY': { Technology: 0.30, Finance: 0.18, Healthcare: 0.12, Consumer: 0.12, Energy: 0.10, Industrial: 0.10, Communication: 0.08 },
  'QYLD': { Technology: 0.50, Communication: 0.15, Consumer: 0.12, Healthcare: 0.10, Finance: 0.08, Other: 0.05 },
  'QDTE': { Technology: 0.50, Communication: 0.16, Consumer: 0.14, Healthcare: 0.07, Industrial: 0.05, Finance: 0.03, Other: 0.05 }, // NASDAQ-100 0DTE Covered Call
  'XYLD': { Technology: 0.30, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Communication: 0.09, Industrial: 0.08, Energy: 0.05, Other: 0.10 },
  'RYLD': { Healthcare: 0.16, Finance: 0.15, Industrial: 0.15, Technology: 0.14, Consumer: 0.12, RealEstate: 0.08, Energy: 0.08, Other: 0.12 },

  // === JP Morgan 배당 ETF ===
  'JEPI': { Technology: 0.20, Healthcare: 0.15, Finance: 0.15, Industrial: 0.12, Consumer: 0.12, Energy: 0.10, Other: 0.16 },
  'JEPQ': { Technology: 0.45, Communication: 0.18, Consumer: 0.15, Healthcare: 0.10, Finance: 0.07, Other: 0.05 },

  // === 배당 성장 ETF ===
  'SCHD': { Finance: 0.20, Healthcare: 0.18, Industrial: 0.15, Consumer: 0.15, Technology: 0.12, Energy: 0.10, Other: 0.10 },
  'VIG': { Technology: 0.22, Finance: 0.18, Healthcare: 0.16, Industrial: 0.14, Consumer: 0.14, Communication: 0.06, Materials: 0.05, Other: 0.05 },
  'VYM': { Finance: 0.22, Healthcare: 0.15, Consumer: 0.13, Industrial: 0.12, Energy: 0.10, Technology: 0.10, Utilities: 0.08, Communication: 0.05, Other: 0.05 },
  'SPYD': { RealEstate: 0.20, Utilities: 0.18, Finance: 0.15, Energy: 0.12, Healthcare: 0.10, Consumer: 0.10, Industrial: 0.08, Other: 0.07 },
  'HDV': { Healthcare: 0.22, Energy: 0.20, Consumer: 0.15, Communication: 0.12, Utilities: 0.10, Finance: 0.10, Technology: 0.06, Other: 0.05 },
  'DIVO': { Technology: 0.18, Healthcare: 0.16, Finance: 0.15, Consumer: 0.14, Industrial: 0.12, Communication: 0.10, Energy: 0.08, Other: 0.07 },

  // === 주요 지수 ETF ===
  'SPY': { Technology: 0.30, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Communication: 0.09, Industrial: 0.08, Energy: 0.05, Other: 0.10 },
  'VOO': { Technology: 0.30, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Communication: 0.09, Industrial: 0.08, Energy: 0.05, Other: 0.10 },
  'IVV': { Technology: 0.30, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Communication: 0.09, Industrial: 0.08, Energy: 0.05, Other: 0.10 },
  'SSO': { Technology: 0.30, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Communication: 0.09, Industrial: 0.08, Energy: 0.05, Other: 0.10 },
  'SPYM': { Technology: 0.30, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Communication: 0.09, Industrial: 0.08, Energy: 0.05, Other: 0.10 },
  'QQQ': { Technology: 0.50, Communication: 0.16, Consumer: 0.14, Healthcare: 0.07, Industrial: 0.05, Finance: 0.03, Other: 0.05 },
  'QQQM': { Technology: 0.50, Communication: 0.16, Consumer: 0.14, Healthcare: 0.07, Industrial: 0.05, Finance: 0.03, Other: 0.05 },
  'TQQQ': { Technology: 0.50, Communication: 0.16, Consumer: 0.14, Healthcare: 0.07, Industrial: 0.05, Finance: 0.03, Other: 0.05 },
  'DIA': { Finance: 0.22, Healthcare: 0.18, Technology: 0.18, Industrial: 0.15, Consumer: 0.12, Energy: 0.08, Other: 0.07 },
  'IWM': { Healthcare: 0.16, Finance: 0.15, Industrial: 0.15, Technology: 0.14, Consumer: 0.12, RealEstate: 0.08, Energy: 0.08, Other: 0.12 },
  'VTI': { Technology: 0.28, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Industrial: 0.10, Communication: 0.08, Energy: 0.05, Other: 0.11 },

  // === 섹터 ETF ===
  'XLK': { Technology: 0.95, Communication: 0.03, Other: 0.02 },
  'XLF': { Finance: 0.95, RealEstate: 0.03, Other: 0.02 },
  'XLE': { Energy: 0.95, Industrial: 0.03, Other: 0.02 },
  'XLV': { Healthcare: 0.95, Consumer: 0.03, Other: 0.02 },
  'XLY': { Consumer: 0.95, Communication: 0.03, Other: 0.02 },
  'XLI': { Industrial: 0.95, Materials: 0.03, Other: 0.02 },
  'XLP': { Consumer: 0.95, Healthcare: 0.03, Other: 0.02 },
  'XLU': { Utilities: 0.95, Industrial: 0.03, Other: 0.02 },
  'XLRE': { RealEstate: 0.95, Finance: 0.03, Other: 0.02 },
  'XLB': { Materials: 0.95, Industrial: 0.03, Other: 0.02 },
  'XLC': { Communication: 0.95, Technology: 0.03, Other: 0.02 },

  // === 개별 주식 (Big Tech & 주요 종목) ===
  'AAPL': { Technology: 1.0 },
  'MSFT': { Technology: 1.0 },
  'GOOGL': { Communication: 1.0 },
  'GOOG': { Communication: 1.0 },
  'AMZN': { Consumer: 1.0 },
  'NVDA': { Technology: 1.0 },
  'TSLA': { Consumer: 1.0 },
  'META': { Communication: 1.0 },
  'AVGO': { Technology: 1.0 },
  'AMD': { Technology: 1.0 },
  'INTC': { Technology: 1.0 },
  'CRM': { Technology: 1.0 },
  'ORCL': { Technology: 1.0 },
  'ADBE': { Technology: 1.0 },

  // === 금융 ===
  'JPM': { Finance: 1.0 },
  'BAC': { Finance: 1.0 },
  'WFC': { Finance: 1.0 },
  'GS': { Finance: 1.0 },
  'MS': { Finance: 1.0 },
  'V': { Finance: 1.0 },
  'MA': { Finance: 1.0 },

  // === 헬스케어 ===
  'JNJ': { Healthcare: 1.0 },
  'UNH': { Healthcare: 1.0 },
  'PFE': { Healthcare: 1.0 },
  'MRK': { Healthcare: 1.0 },
  'ABBV': { Healthcare: 1.0 },
  'LLY': { Healthcare: 1.0 },

  // === 에너지 ===
  'XOM': { Energy: 1.0 },
  'CVX': { Energy: 1.0 },
  'COP': { Energy: 1.0 },

  // === 소비재/통신 ===
  'KO': { Consumer: 1.0 },
  'PEP': { Consumer: 1.0 },
  'WMT': { Consumer: 1.0 },
  'COST': { Consumer: 1.0 },
  'HD': { Consumer: 1.0 },
  'MCD': { Consumer: 1.0 },
  'DIS': { Communication: 1.0 },
  'NFLX': { Communication: 1.0 },
  'T': { Communication: 1.0 },
  'VZ': { Communication: 1.0 },

  // === 산업재 ===
  'CAT': { Industrial: 1.0 },
  'BA': { Industrial: 1.0 },
  'HON': { Industrial: 1.0 },
  'UPS': { Industrial: 1.0 },
  'UNP': { Industrial: 1.0 },
};

export const SECTOR_CORRELATIONS: Record<string, Record<string, number>> = {
  Technology: { Technology: 1.0, Communication: 0.85, Consumer: 0.70, Healthcare: 0.55, Finance: 0.60, Industrial: 0.65, Energy: 0.30, RealEstate: 0.40, Utilities: 0.25, Materials: 0.50 },
  Communication: { Technology: 0.85, Communication: 1.0, Consumer: 0.75, Healthcare: 0.50, Finance: 0.55, Industrial: 0.60, Energy: 0.25, RealEstate: 0.35, Utilities: 0.20, Materials: 0.45 },
  Consumer: { Technology: 0.70, Communication: 0.75, Consumer: 1.0, Healthcare: 0.60, Finance: 0.65, Industrial: 0.70, Energy: 0.35, RealEstate: 0.50, Utilities: 0.40, Materials: 0.55 },
  Healthcare: { Technology: 0.55, Communication: 0.50, Consumer: 0.60, Healthcare: 1.0, Finance: 0.50, Industrial: 0.55, Energy: 0.30, RealEstate: 0.45, Utilities: 0.50, Materials: 0.45 },
  Finance: { Technology: 0.60, Communication: 0.55, Consumer: 0.65, Healthcare: 0.50, Finance: 1.0, Industrial: 0.70, Energy: 0.55, RealEstate: 0.60, Utilities: 0.35, Materials: 0.60 },
  Industrial: { Technology: 0.65, Communication: 0.60, Consumer: 0.70, Healthcare: 0.55, Finance: 0.70, Industrial: 1.0, Energy: 0.60, RealEstate: 0.55, Utilities: 0.40, Materials: 0.75 },
  Energy: { Technology: 0.30, Communication: 0.25, Consumer: 0.35, Healthcare: 0.30, Finance: 0.55, Industrial: 0.60, Energy: 1.0, RealEstate: 0.35, Utilities: 0.45, Materials: 0.65 },
  RealEstate: { Technology: 0.40, Communication: 0.35, Consumer: 0.50, Healthcare: 0.45, Finance: 0.60, Industrial: 0.55, Energy: 0.35, RealEstate: 1.0, Utilities: 0.60, Materials: 0.50 },
  Utilities: { Technology: 0.25, Communication: 0.20, Consumer: 0.40, Healthcare: 0.50, Finance: 0.35, Industrial: 0.40, Energy: 0.45, RealEstate: 0.60, Utilities: 1.0, Materials: 0.45 },
  Materials: { Technology: 0.50, Communication: 0.45, Consumer: 0.55, Healthcare: 0.45, Finance: 0.60, Industrial: 0.75, Energy: 0.65, RealEstate: 0.50, Utilities: 0.45, Materials: 1.0 },
  ETF: { Technology: 0.70, Communication: 0.65, Consumer: 0.65, Healthcare: 0.55, Finance: 0.60, Industrial: 0.65, Energy: 0.45, RealEstate: 0.50, Utilities: 0.40, Materials: 0.55 },
  Crypto: { Technology: 0.50, Communication: 0.45, Consumer: 0.40, Healthcare: 0.20, Finance: 0.35, Industrial: 0.30, Energy: 0.25, RealEstate: 0.20, Utilities: 0.10, Materials: 0.30 },
  Other: { Technology: 0.50, Communication: 0.50, Consumer: 0.50, Healthcare: 0.50, Finance: 0.50, Industrial: 0.50, Energy: 0.40, RealEstate: 0.45, Utilities: 0.40, Materials: 0.50 },
};
