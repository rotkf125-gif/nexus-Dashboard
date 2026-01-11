// ═══════════════════════════════════════════════════════════════
// NEXUS V65.8 - Stock Info API Route
// Yahoo Finance chart API를 통해 종목 정보 조회
// (quoteSummary는 Crumb 인증 필요로 chart API 사용)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

// 주요 종목별 섹터 매핑 (Yahoo Finance에서 섹터 정보를 직접 얻기 어려워짐)
// 개별 주식은 이 테이블로 매핑, ETF는 Analytics의 ETF_SECTOR_DATA 사용
const TICKER_SECTOR_MAP: Record<string, string> = {
  // === Big Tech ===
  'AAPL': 'Technology',
  'MSFT': 'Technology',
  'GOOGL': 'Communication',
  'GOOG': 'Communication',
  'AMZN': 'Consumer',
  'NVDA': 'Technology',
  'TSLA': 'Consumer',
  'META': 'Communication',
  'AVGO': 'Technology',
  'AMD': 'Technology',
  'INTC': 'Technology',
  'CRM': 'Technology',
  'ORCL': 'Technology',
  'ADBE': 'Technology',
  'CSCO': 'Technology',
  'IBM': 'Technology',
  'QCOM': 'Technology',
  'TXN': 'Technology',
  'MU': 'Technology',
  'AMAT': 'Technology',
  'LRCX': 'Technology',
  'KLAC': 'Technology',
  'SNPS': 'Technology',
  'CDNS': 'Technology',
  'MRVL': 'Technology',
  'ON': 'Technology',
  'NXPI': 'Technology',
  'ADI': 'Technology',

  // === 금융 ===
  'JPM': 'Finance',
  'BAC': 'Finance',
  'WFC': 'Finance',
  'GS': 'Finance',
  'MS': 'Finance',
  'C': 'Finance',
  'USB': 'Finance',
  'PNC': 'Finance',
  'TFC': 'Finance',
  'V': 'Finance',
  'MA': 'Finance',
  'AXP': 'Finance',
  'COF': 'Finance',
  'BLK': 'Finance',
  'SCHW': 'Finance',
  'CME': 'Finance',
  'ICE': 'Finance',
  'SPGI': 'Finance',
  'MCO': 'Finance',
  'MMC': 'Finance',
  'AON': 'Finance',
  'AIG': 'Finance',
  'MET': 'Finance',
  'PRU': 'Finance',
  'ALL': 'Finance',
  'TRV': 'Finance',

  // === 헬스케어 ===
  'JNJ': 'Healthcare',
  'UNH': 'Healthcare',
  'PFE': 'Healthcare',
  'MRK': 'Healthcare',
  'ABBV': 'Healthcare',
  'LLY': 'Healthcare',
  'TMO': 'Healthcare',
  'ABT': 'Healthcare',
  'DHR': 'Healthcare',
  'BMY': 'Healthcare',
  'AMGN': 'Healthcare',
  'GILD': 'Healthcare',
  'VRTX': 'Healthcare',
  'REGN': 'Healthcare',
  'ISRG': 'Healthcare',
  'MDT': 'Healthcare',
  'SYK': 'Healthcare',
  'BSX': 'Healthcare',
  'ZBH': 'Healthcare',
  'EW': 'Healthcare',
  'CVS': 'Healthcare',
  'CI': 'Healthcare',
  'HUM': 'Healthcare',
  'ELV': 'Healthcare',
  'CNC': 'Healthcare',
  'MCK': 'Healthcare',
  'CAH': 'Healthcare',
  'ABC': 'Healthcare',

  // === 에너지 ===
  'XOM': 'Energy',
  'CVX': 'Energy',
  'COP': 'Energy',
  'EOG': 'Energy',
  'SLB': 'Energy',
  'MPC': 'Energy',
  'PSX': 'Energy',
  'VLO': 'Energy',
  'OXY': 'Energy',
  'PXD': 'Energy',
  'DVN': 'Energy',
  'HES': 'Energy',
  'HAL': 'Energy',
  'BKR': 'Energy',
  'KMI': 'Energy',
  'WMB': 'Energy',
  'OKE': 'Energy',
  'TRGP': 'Energy',

  // === 소비재 (Consumer) ===
  'KO': 'Consumer',
  'PEP': 'Consumer',
  'WMT': 'Consumer',
  'COST': 'Consumer',
  'HD': 'Consumer',
  'MCD': 'Consumer',
  'NKE': 'Consumer',
  'SBUX': 'Consumer',
  'TGT': 'Consumer',
  'LOW': 'Consumer',
  'TJX': 'Consumer',
  'ROST': 'Consumer',
  'PG': 'Consumer',
  'CL': 'Consumer',
  'KMB': 'Consumer',
  'EL': 'Consumer',
  'MDLZ': 'Consumer',
  'GIS': 'Consumer',
  'K': 'Consumer',
  'CPB': 'Consumer',
  'SJM': 'Consumer',
  'HSY': 'Consumer',
  'KHC': 'Consumer',
  'STZ': 'Consumer',
  'MO': 'Consumer',
  'PM': 'Consumer',
  'CMG': 'Consumer',
  'YUM': 'Consumer',
  'DPZ': 'Consumer',
  'DRI': 'Consumer',
  'MAR': 'Consumer',
  'HLT': 'Consumer',
  'BKNG': 'Consumer',
  'ABNB': 'Consumer',
  'EXPE': 'Consumer',
  'F': 'Consumer',
  'GM': 'Consumer',

  // === 통신/미디어 (Communication) ===
  'DIS': 'Communication',
  'NFLX': 'Communication',
  'CMCSA': 'Communication',
  'T': 'Communication',
  'VZ': 'Communication',
  'TMUS': 'Communication',
  'CHTR': 'Communication',
  'WBD': 'Communication',
  'PARA': 'Communication',
  'FOX': 'Communication',
  'EA': 'Communication',
  'TTWO': 'Communication',
  'ATVI': 'Communication',
  'MTCH': 'Communication',
  'SNAP': 'Communication',
  'PINS': 'Communication',
  'SPOT': 'Communication',
  'ROKU': 'Communication',
  'ZG': 'Communication',
  'RBLX': 'Communication',

  // === 산업재 (Industrial) ===
  'CAT': 'Industrial',
  'BA': 'Industrial',
  'HON': 'Industrial',
  'UPS': 'Industrial',
  'UNP': 'Industrial',
  'RTX': 'Industrial',
  'LMT': 'Industrial',
  'GE': 'Industrial',
  'MMM': 'Industrial',
  'DE': 'Industrial',
  'EMR': 'Industrial',
  'ITW': 'Industrial',
  'ETN': 'Industrial',
  'PH': 'Industrial',
  'ROK': 'Industrial',
  'CMI': 'Industrial',
  'PCAR': 'Industrial',
  'NSC': 'Industrial',
  'CSX': 'Industrial',
  'FDX': 'Industrial',
  'GD': 'Industrial',
  'NOC': 'Industrial',
  'LHX': 'Industrial',
  'TDG': 'Industrial',
  'WM': 'Industrial',
  'RSG': 'Industrial',
  'VRSK': 'Industrial',
  'CARR': 'Industrial',
  'OTIS': 'Industrial',
  'IR': 'Industrial',

  // === 유틸리티 (Utilities) ===
  'NEE': 'Utilities',
  'DUK': 'Utilities',
  'SO': 'Utilities',
  'D': 'Utilities',
  'AEP': 'Utilities',
  'EXC': 'Utilities',
  'SRE': 'Utilities',
  'XEL': 'Utilities',
  'ED': 'Utilities',
  'WEC': 'Utilities',
  'ES': 'Utilities',
  'AWK': 'Utilities',
  'DTE': 'Utilities',
  'PPL': 'Utilities',
  'FE': 'Utilities',

  // === 부동산 (RealEstate) ===
  'PLD': 'RealEstate',
  'AMT': 'RealEstate',
  'CCI': 'RealEstate',
  'EQIX': 'RealEstate',
  'PSA': 'RealEstate',
  'O': 'RealEstate',
  'SPG': 'RealEstate',
  'WELL': 'RealEstate',
  'DLR': 'RealEstate',
  'AVB': 'RealEstate',
  'EQR': 'RealEstate',
  'VTR': 'RealEstate',
  'ARE': 'RealEstate',
  'MAA': 'RealEstate',
  'UDR': 'RealEstate',
  'ESS': 'RealEstate',
  'INVH': 'RealEstate',
  'SUI': 'RealEstate',
  'ELS': 'RealEstate',

  // === 소재 (Materials) ===
  'LIN': 'Materials',
  'APD': 'Materials',
  'SHW': 'Materials',
  'ECL': 'Materials',
  'DD': 'Materials',
  'DOW': 'Materials',
  'NUE': 'Materials',
  'FCX': 'Materials',
  'NEM': 'Materials',
  'VMC': 'Materials',
  'MLM': 'Materials',
  'PPG': 'Materials',
  'ALB': 'Materials',
  'IFF': 'Materials',
  'FMC': 'Materials',
  'CF': 'Materials',
  'MOS': 'Materials',
  'CTVA': 'Materials',
};

// ETF 목록 (Analytics의 ETF_SECTOR_DATA와 동기화)
const KNOWN_ETFS = [
  'PLTY', 'HOOY', 'QYLD', 'XYLD', 'RYLD', 'JEPI', 'JEPQ',
  'SCHD', 'VIG', 'VYM', 'SPYD', 'HDV', 'DIVO',
  'SPY', 'VOO', 'IVV', 'SSO', 'SPYM', 'QQQ', 'QQQM', 'TQQQ',
  'DIA', 'IWM', 'VTI',
  'XLK', 'XLF', 'XLE', 'XLV', 'XLY', 'XLI', 'XLP', 'XLU', 'XLRE', 'XLB', 'XLC',
  'ARKK', 'ARKW', 'ARKG', 'ARKF', 'ARKQ',
  'VGT', 'VHT', 'VFH', 'VNQ', 'VDC', 'VPU',
  'GLD', 'SLV', 'USO', 'UNG',
  'TLT', 'IEF', 'SHY', 'BND', 'AGG', 'LQD', 'HYG', 'JNK',
  'EEM', 'VWO', 'EFA', 'VEA', 'IEMG',
];

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker required' }, { status: 400 });
  }

  try {
    // chart API로 기본 정보 조회
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 86400 }, // 24시간 캐시
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance responded with ${response.status}`);
    }

    const data = await response.json();
    const meta = data.chart?.result?.[0]?.meta;

    if (!meta) {
      throw new Error('No data found');
    }

    // 기본 정보 추출
    const name = meta.longName || meta.shortName || ticker;
    const instrumentType = meta.instrumentType || 'EQUITY';
    const isETF = instrumentType === 'ETF' || KNOWN_ETFS.includes(ticker);

    // 섹터 결정 로직:
    // 1. 하드코딩 테이블에 있으면 사용
    // 2. ETF면 'ETF' 반환 (Analytics에서 ETF_SECTOR_DATA 사용)
    // 3. 그 외 'Other'
    let sector = TICKER_SECTOR_MAP[ticker] || 'Other';
    if (isETF && !TICKER_SECTOR_MAP[ticker]) {
      sector = 'ETF';
    }

    return NextResponse.json({
      ticker,
      sector,
      name,
      instrumentType,
      isETF,
      exchange: meta.exchangeName || '',
      currency: meta.currency || 'USD',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error(`Error fetching info for ${ticker}:`, error);

    // 에러 시에도 하드코딩 데이터로 시도
    const sector = TICKER_SECTOR_MAP[ticker] || 'Other';
    const isETF = KNOWN_ETFS.includes(ticker);

    return NextResponse.json({
      ticker,
      sector: isETF ? 'ETF' : sector,
      name: ticker,
      instrumentType: isETF ? 'ETF' : 'EQUITY',
      isETF,
      exchange: '',
      currency: 'USD',
      error: `Failed to fetch from Yahoo Finance, using cached data`,
      timestamp: Date.now(),
    });
  }
}
