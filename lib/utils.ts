// ═══════════════════════════════════════════════════════════════
// NEXUS V65.1 - Utility Functions
// KST Timezone & Market State Utilities
// ═══════════════════════════════════════════════════════════════

/**
 * 서머타임(DST) 여부 확인
 * 미국 서머타임: 3월 둘째 일요일 02:00 ~ 11월 첫째 일요일 02:00
 */
export function isDST(date: Date = new Date()): boolean {
  const year = date.getFullYear();

  // 3월 둘째 일요일
  const marchSecondSunday = new Date(year, 2, 8);
  marchSecondSunday.setDate(marchSecondSunday.getDate() + (7 - marchSecondSunday.getDay()) % 7);

  // 11월 첫째 일요일
  const novFirstSunday = new Date(year, 10, 1);
  novFirstSunday.setDate(novFirstSunday.getDate() + (7 - novFirstSunday.getDay()) % 7);

  return date >= marchSecondSunday && date < novFirstSunday;
}

/**
 * UTC 시간을 KST로 변환
 * @param utcDate UTC Date 객체
 * @returns KST Date 객체
 */
export function utcToKST(utcDate: Date): Date {
  const kst = new Date(utcDate);
  kst.setHours(kst.getUTCHours() + 9);
  return kst;
}

/**
 * KST 시간을 UTC로 변환
 * @param kstDate KST Date 객체
 * @returns UTC Date 객체
 */
export function kstToUTC(kstDate: Date): Date {
  const utc = new Date(kstDate);
  utc.setHours(utc.getHours() - 9);
  return utc;
}

/**
 * 현재 KST 시간 가져오기
 * @returns KST Date 객체
 */
export function getKSTNow(): Date {
  return utcToKST(new Date());
}

/**
 * KST 기준으로 포맷팅된 문자열 반환
 * @param date Date 객체 (UTC 또는 KST)
 * @param includeSeconds 초 포함 여부
 * @returns "YYYY-MM-DD HH:mm:ss KST" 형식
 */
export function formatKST(date: Date, includeSeconds: boolean = true): string {
  const kst = utcToKST(date);
  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  const hours = String(kst.getHours()).padStart(2, '0');
  const minutes = String(kst.getMinutes()).padStart(2, '0');
  const seconds = String(kst.getSeconds()).padStart(2, '0');

  if (includeSeconds) {
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} KST`;
  }
  return `${year}-${month}-${day} ${hours}:${minutes} KST`;
}

/**
 * KST ISO 문자열 생성 (Supabase 저장용)
 * @param date Date 객체
 * @returns ISO 8601 형식 문자열 (KST 기준)
 */
export function toKSTISOString(date: Date = new Date()): string {
  const kst = utcToKST(date);
  return kst.toISOString();
}

/**
 * 미국 주식 시장 상태 계산 (KST 기준)
 * @returns 'PRE' | 'REGULAR' | 'POST' | 'DAY' | 'CLOSED'
 */
export type MarketState = 'PRE' | 'REGULAR' | 'POST' | 'DAY' | 'CLOSED';

export function getMarketState(): MarketState {
  const now = new Date();
  const kstHour = now.getUTCHours() + 9;
  const kstHourNormalized = kstHour >= 24 ? kstHour - 24 : kstHour;
  const kstMinute = now.getUTCMinutes();
  const kstDay = now.getUTCDay(); // 0=일요일, 6=토요일

  const isWeekend = kstDay === 0 || kstDay === 6;
  const dst = isDST(now);

  // 주말 한국 주간 거래 시간 (10:00~17:00 KST)
  if (isWeekend && kstHourNormalized >= 10 && kstHourNormalized < 17) {
    return 'DAY';
  }

  // 평일 미국 시장 시간 계산
  if (!isWeekend) {
    if (dst) {
      // 서머타임 (DST) - 미국 동부 EDT = UTC-4, KST = UTC+9 → 13시간 차이
      // 프리마켓: 04:00-09:30 EDT = 17:00-22:30 KST
      if ((kstHourNormalized === 17 && kstMinute >= 0) ||
          (kstHourNormalized > 17 && kstHourNormalized < 22) ||
          (kstHourNormalized === 22 && kstMinute < 30)) {
        return 'PRE';
      }
      // 정규장: 09:30-16:00 EDT = 22:30-05:00 KST (다음날)
      if ((kstHourNormalized === 22 && kstMinute >= 30) ||
          kstHourNormalized === 23 ||
          kstHourNormalized < 5) {
        return 'REGULAR';
      }
      // 애프터마켓: 16:00-18:00 EDT = 05:00-07:00 KST
      if (kstHourNormalized >= 5 && kstHourNormalized < 7) {
        return 'POST';
      }
    } else {
      // 표준시 (STD) - 미국 동부 EST = UTC-5, KST = UTC+9 → 14시간 차이
      // 프리마켓: 04:00-09:30 EST = 18:00-23:30 KST
      if ((kstHourNormalized === 18 && kstMinute >= 0) ||
          (kstHourNormalized > 18 && kstHourNormalized < 23) ||
          (kstHourNormalized === 23 && kstMinute < 30)) {
        return 'PRE';
      }
      // 정규장: 09:30-16:00 EST = 23:30-06:00 KST (다음날)
      if ((kstHourNormalized === 23 && kstMinute >= 30) ||
          kstHourNormalized < 6) {
        return 'REGULAR';
      }
      // 애프터마켓: 16:00-18:00 EST = 06:00-08:00 KST
      if (kstHourNormalized >= 6 && kstHourNormalized < 8) {
        return 'POST';
      }
    }
  }

  // 그 외 모든 시간은 CLOSED
  return 'CLOSED';
}

/**
 * 시장 상태에 따른 표시 정보 반환
 */
export function getMarketStateInfo(state: MarketState) {
  const dst = isDST();

  const marketTimes = dst ? {
    pre: '17:00-22:30',
    regular: '22:30-05:00',
    post: '05:00-07:00',
    day: '10:00-17:00',
  } : {
    pre: '18:00-23:30',
    regular: '23:30-06:00',
    post: '06:00-08:00',
    day: '10:00-17:00',
  };

  const stateInfo = {
    PRE: {
      label: '🔵 프리마켓',
      time: marketTimes.pre,
      color: 'blue',
    },
    REGULAR: {
      label: '🟢 정규장',
      time: marketTimes.regular,
      color: 'green',
    },
    POST: {
      label: '🟣 애프터',
      time: marketTimes.post,
      color: 'purple',
    },
    DAY: {
      label: '🟠 주간거래',
      time: marketTimes.day,
      color: 'orange',
    },
    CLOSED: {
      label: '⚫ 휴장',
      time: '---',
      color: 'gray',
    },
  };

  return stateInfo[state] || stateInfo.CLOSED;
}

/**
 * Supabase timestamp 문자열을 KST Date로 변환
 * @param supabaseTimestamp Supabase의 timestamptz 문자열
 * @returns KST Date 객체
 */
export function parseSupabaseTimestamp(supabaseTimestamp: string): Date {
  const utcDate = new Date(supabaseTimestamp);
  return utcToKST(utcDate);
}

/**
 * 두 날짜 간의 시간 차이를 사람이 읽기 쉬운 형식으로 반환
 * @param date1 비교할 날짜 1
 * @param date2 비교할 날짜 2 (기본값: 현재)
 * @returns "N분 전", "N시간 전" 등
 */
export function getTimeAgo(date1: Date, date2: Date = new Date()): string {
  const diff = date2.getTime() - date1.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return `${seconds}초 전`;
}
