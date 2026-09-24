/**
 * Calendar Utilities
 *
 * Lays out a year as month grids for the CalendarYear component, placing dated
 * entries (posts, books, whatever) on their days. Weeks start on Monday.
 *
 * All date maths is in UTC: content dates are date-only strings, which
 * `z.coerce.date()` parses as UTC midnight, so local getters would put entries
 * on the wrong day west of Greenwich.
 */

/** Something that happened on a day, shown as a mark on the calendar. */
export interface CalendarEntry {
  date: Date
  title: string
  href: string
  /** Shown beside the title in the day's popover, e.g. "Note". */
  label?: string
  /** A day whose entries are all minor gets a smaller mark. */
  minor?: boolean
}

interface CalendarDay {
  /** Day of the month, from 1. */
  day: number
  /** `YYYY-MM-DD`, unique within a calendar. */
  iso: string
  future: boolean
  entries: CalendarEntry[]
}

export interface CalendarMonth {
  /** Short month name, e.g. "Jan". */
  name: string
  /** Grid column (1 = Monday … 7 = Sunday) of the 1st. */
  startColumn: number
  days: CalendarDay[]
}

const monthName = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' })

const isoDay = (date: Date) => date.toISOString().slice(0, 10)

/**
 * Build the twelve months of `year`, with each entry placed on its UTC day.
 * Entries outside the year are ignored, and each day keeps its entries in the
 * order given. Days after `today` are marked future.
 */
export function calendarYear(
  year: number,
  entries: CalendarEntry[],
  today: Date = new Date(),
): CalendarMonth[] {
  const byDay = Map.groupBy(entries, entry => isoDay(entry.date))
  const todayIso = isoDay(today)

  return Array.from({ length: 12 }, (_, month) => {
    const first = new Date(Date.UTC(year, month, 1))
    const length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

    const days = Array.from({ length }, (_, index) => {
      const iso = isoDay(new Date(Date.UTC(year, month, index + 1)))
      return { day: index + 1, iso, future: iso > todayIso, entries: byDay.get(iso) ?? [] }
    })

    return {
      name: monthName.format(first),
      // getUTCDay() is 0 for Sunday; shift so Monday is column 1.
      startColumn: ((first.getUTCDay() + 6) % 7) + 1,
      days,
    }
  })
}
