import { describe, it, expect } from 'vitest'
import { calendarYear, type CalendarEntry } from '@utils/calendar'

const entry = (date: string, title = date): CalendarEntry => ({
  date: new Date(date),
  title,
  href: `/${title}/`,
})

describe('calendarYear', () => {
  it('builds twelve months with the right number of days', () => {
    const months = calendarYear(2026, [])
    expect(months.map(m => m.name)).toEqual([
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sept',
      'Oct',
      'Nov',
      'Dec',
    ])
    expect(months.map(m => m.days.length)).toEqual([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31])
    expect(months[1]!.days.at(-1)!.iso).toBe('2026-02-28')
  })

  it('gives February 29 days in a leap year', () => {
    expect(calendarYear(2024, [])[1]!.days).toHaveLength(29)
  })

  it('starts each month in its weekday column, Monday first', () => {
    const months = calendarYear(2026, [])
    expect(months[0]!.startColumn).toBe(4) // 1 Jan 2026 is a Thursday
    expect(months[1]!.startColumn).toBe(7) // 1 Feb 2026 is a Sunday
    expect(months[5]!.startColumn).toBe(1) // 1 Jun 2026 is a Monday
  })

  it('places entries on their UTC day, in the order given', () => {
    const months = calendarYear(2026, [
      entry('2026-03-05', 'first'),
      entry('2026-03-05', 'second'),
      entry('2026-03-31T23:30:00Z', 'late'),
    ])
    expect(months[2]!.days[4]!.entries.map(e => e.title)).toEqual(['first', 'second'])
    expect(months[2]!.days[30]!.entries.map(e => e.title)).toEqual(['late'])
    expect(months[2]!.days[5]!.entries).toEqual([])
  })

  it('ignores entries from other years', () => {
    const months = calendarYear(2026, [entry('2025-03-05'), entry('2027-03-05')])
    expect(months.flatMap(m => m.days).some(d => d.entries.length > 0)).toBe(false)
  })

  it('marks days after today as future', () => {
    const september = calendarYear(2026, [], new Date('2026-09-24T12:00:00Z'))[8]!
    expect(september.days[23]!.future).toBe(false) // today
    expect(september.days[24]!.future).toBe(true)
  })
})
