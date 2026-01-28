'use client';

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { formatUSD } from '@/lib/utils';
import { CHART_COLORS, TAX_CONFIG } from '@/lib/config';

// 날짜 유틸리티
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export default function DividendCalendar() {
  const { state } = useNexus();
  const { dividends } = state;

  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // 해당 월의 배당 데이터 필터링 및 날짜별 그룹화
  const monthlyData = useMemo(() => {
    const data: Record<number, { total: number; items: any[] }> = {};
    
    dividends.forEach(d => {
      const dDate = new Date(d.date);
      if (dDate.getFullYear() === year && dDate.getMonth() === month) {
        const day = dDate.getDate();
        if (!data[day]) data[day] = { total: 0, items: [] };
        
        const amount = d.qty * d.dps * TAX_CONFIG.AFTER_TAX_RATE; // 세후
        data[day].total += amount;
        data[day].items.push({ ...d, amount });
      }
    });
    return data;
  }, [dividends, year, month]);

  // 달력 그리드 생성
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const totalSlots = Math.ceil((daysInMonth + firstDay) / 7) * 7;

  const days = Array.from({ length: totalSlots }, (_, i) => {
    const dayNumber = i - firstDay + 1;
    const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
    return isValidDay ? dayNumber : null;
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const monthTotal = Object.values(monthlyData).reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-display font-bold text-white">
            {year}. {String(month + 1).padStart(2, '0')}
          </h3>
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
            <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-white/70">
              <i className="fas fa-chevron-left text-xs" />
            </button>
            <button onClick={goToday} className="px-2 h-6 flex items-center justify-center hover:bg-white/10 rounded text-[10px] text-white/70 font-medium">
              TODAY
            </button>
            <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-white/70">
              <i className="fas fa-chevron-right text-xs" />
            </button>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-white/70 uppercase">MONTHLY TOTAL</div>
          <div className="text-sm font-bold text-celestial-gold">{formatUSD(monthTotal)}</div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (
            <div key={day} className={`text-center py-2 text-[9px] font-medium ${i === 0 ? 'text-rose-400' : i === 6 ? 'text-blue-400' : 'text-white/70'}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 auto-rows-[80px]">
          {days.map((day, i) => {
            if (!day) return <div key={i} className="border-b border-r border-white/5 bg-white/[0.02]" />;
            
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const data = monthlyData[day];
            
            return (
              <div 
                key={i} 
                className={`border-b border-r border-white/10 p-1.5 relative transition-colors hover:bg-white/5 ${isToday ? 'bg-celestial-purple/10' : ''}`}
              >
                <div className={`text-[10px] font-medium mb-1 ${isToday ? 'text-celestial-purple' : 'text-white/60'}`}>
                  {day}
                </div>
                
                {data && (
                  <div className="space-y-1">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-celestial-gold bg-celestial-gold/10 px-1.5 py-0.5 rounded">
                        +{formatUSD(data.total, 0)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {data.items.slice(0, 3).map((item, idx) => (
                        <div 
                          key={idx} 
                          className="w-1.5 h-1.5 rounded-full" 
                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                          title={`${item.ticker}: ${formatUSD(item.amount)}`}
                        />
                      ))}
                      {data.items.length > 3 && (
                        <span className="text-[8px] text-white/30">+</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
