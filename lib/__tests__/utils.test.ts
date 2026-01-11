import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isDST,
  utcToKST,
  kstToUTC,
  getKSTNow,
  formatKST,
  toKSTISOString,
  getMarketState,
} from '../utils'

describe('Utility Functions', () => {
  describe('isDST', () => {
    it('should return true during DST period (summer)', () => {
      // July 15, 2024 (in DST period)
      const summerDate = new Date('2024-07-15T12:00:00Z')
      expect(isDST(summerDate)).toBe(true)
    })

    it('should return false outside DST period (winter)', () => {
      // January 15, 2024 (outside DST period)
      const winterDate = new Date('2024-01-15T12:00:00Z')
      expect(isDST(winterDate)).toBe(false)
    })

    it('should return true on DST start date', () => {
      // March 10, 2024 (DST starts - second Sunday of March)
      const dstStart = new Date('2024-03-10T12:00:00Z')
      expect(isDST(dstStart)).toBe(true)
    })

    it('should return false on DST end date', () => {
      // November 3, 2024 (DST ends - first Sunday of November)
      const dstEnd = new Date('2024-11-03T12:00:00Z')
      expect(isDST(dstEnd)).toBe(false)
    })
  })

  describe('utcToKST', () => {
    it('should convert UTC to KST by adding 9 hours', () => {
      const utcDate = new Date('2024-01-15T12:00:00Z')
      const kstDate = utcToKST(utcDate)

      // UTC 12:00 should become KST 21:00
      expect(kstDate.getUTCHours()).toBe(21)
      expect(kstDate.getUTCDate()).toBe(15)
    })

    it('should handle day rollover when adding 9 hours', () => {
      const utcDate = new Date('2024-01-15T20:00:00Z')
      const kstDate = utcToKST(utcDate)

      // UTC 20:00 should become KST 05:00 next day
      expect(kstDate.getUTCHours()).toBe(5)
      expect(kstDate.getUTCDate()).toBe(16)
    })
  })

  describe('kstToUTC', () => {
    it('should convert KST to UTC by subtracting 9 hours', () => {
      const kstDate = new Date('2024-01-15T21:00:00')
      const utcDate = kstToUTC(kstDate)

      expect(utcDate.getHours()).toBe(12)
    })

    it('should handle day rollover when subtracting 9 hours', () => {
      const kstDate = new Date('2024-01-16T05:00:00')
      const utcDate = kstToUTC(kstDate)

      expect(utcDate.getHours()).toBe(20)
      expect(utcDate.getDate()).toBe(15)
    })
  })

  describe('getKSTNow', () => {
    it('should return current time in KST', () => {
      const beforeUTC = new Date()
      const kstNow = getKSTNow()
      const afterUTC = new Date()

      // KST should be 9 hours ahead of UTC
      const expectedKSTHour = (beforeUTC.getUTCHours() + 9) % 24
      const actualKSTHour = kstNow.getUTCHours()

      // Allow 1 hour difference for test execution time
      expect(Math.abs(actualKSTHour - expectedKSTHour)).toBeLessThanOrEqual(1)
    })
  })

  describe('formatKST', () => {
    it('should format KST date with seconds', () => {
      const date = new Date('2024-01-15T12:00:30Z')
      const formatted = formatKST(date, true)

      // UTC 12:00:30 -> KST 21:00:30
      expect(formatted).toMatch(/2024-01-15 21:00:30 KST/)
    })

    it('should format KST date without seconds', () => {
      const date = new Date('2024-01-15T12:00:30Z')
      const formatted = formatKST(date, false)

      expect(formatted).toMatch(/2024-01-15 21:00 KST/)
      expect(formatted).not.toContain(':30')
    })

    it('should pad single digit months and days', () => {
      const date = new Date('2024-03-05T12:00:00Z')
      const formatted = formatKST(date)

      expect(formatted).toContain('2024-03-05')
    })
  })

  describe('toKSTISOString', () => {
    it('should return ISO string in KST timezone', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const isoString = toKSTISOString(date)

      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(isoString).toContain('T21:00:00') // UTC 12:00 -> KST 21:00
    })
  })

  describe('getMarketState', () => {
    beforeEach(() => {
      // Reset time mocks
      vi.restoreAllMocks()
    })

    it('should return CLOSED on weekends during non-trading hours', () => {
      // Saturday, 5:00 AM KST (not in DAY trading hours)
      vi.setSystemTime(new Date('2024-01-13T20:00:00Z')) // UTC 20:00 = KST 05:00 (Sat)

      const state = getMarketState()
      expect(state).toBe('CLOSED')
    })

    it('should return DAY on weekends during Korean trading hours (10-17 KST)', () => {
      // Saturday, 12:00 PM KST
      vi.setSystemTime(new Date('2024-01-13T03:00:00Z')) // UTC 03:00 = KST 12:00 (Sat)

      const state = getMarketState()
      expect(state).toBe('DAY')
    })

    it('should return PRE during pre-market hours on weekdays', () => {
      // Monday, 8:00 PM KST (pre-market during DST: 20:00-23:30 KST)
      vi.setSystemTime(new Date('2024-07-15T11:00:00Z')) // UTC 11:00 = KST 20:00 (Mon, DST)

      const state = getMarketState()
      expect(state).toBe('PRE')
    })

    it('should return REGULAR during regular trading hours', () => {
      // Monday, 11:00 PM KST (regular market during DST: 23:30-06:00 KST)
      vi.setSystemTime(new Date('2024-07-15T14:00:00Z')) // UTC 14:00 = KST 23:00 (Mon, DST)

      const state = getMarketState()
      expect(state).toBe('REGULAR')
    })

    it('should return POST during after-market hours', () => {
      // Tuesday, 6:30 AM KST (post-market during DST: 06:00-08:00 KST)
      vi.setSystemTime(new Date('2024-07-16T21:30:00Z')) // UTC 21:30 = KST 06:30 (Tue, DST)

      const state = getMarketState()
      expect(state).toBe('POST')
    })

    it('should handle DST vs non-DST correctly', () => {
      // Winter (non-DST): PRE market is 21:00-00:30 KST
      vi.setSystemTime(new Date('2024-01-15T12:30:00Z')) // UTC 12:30 = KST 21:30 (Mon, no DST)

      const winterState = getMarketState()
      expect(winterState).toBe('PRE')

      // Summer (DST): PRE market is 20:00-23:30 KST
      vi.setSystemTime(new Date('2024-07-15T11:30:00Z')) // UTC 11:30 = KST 20:30 (Mon, DST)

      const summerState = getMarketState()
      expect(summerState).toBe('PRE')
    })
  })
})
