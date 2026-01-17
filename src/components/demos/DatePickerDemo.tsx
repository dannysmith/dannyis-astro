import { useState } from 'react';
import { DatePicker } from '@dannysmith/datepicker';
import '@dannysmith/datepicker/styles.css';
import { format } from 'date-fns';

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 'var(--space-s)',
    marginBlock: 'var(--space-m)',
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    maxWidth: '220px',
    marginInline: 'auto',
  },
  selectedDate: {
    margin: 0,
    fontWeight: 500,
    fontSize: '0.8rem',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-2xs)',
    borderRadius: 'var(--radius-sm)',
  },
};

export function DatePickerDemo() {
  const [date, setDate] = useState<Date | null>(new Date());

  return (
    <div style={styles.wrapper}>
      <p style={styles.selectedDate}>
        {date ? format(date, 'EEEE, d MMMM yyyy') : 'No date selected'}
      </p>
      <DatePicker value={date} onCommit={setDate} showClearButton />
    </div>
  );
}
