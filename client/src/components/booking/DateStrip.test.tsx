import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DateStrip } from './DateStrip';
import { weekdayOf } from '../../utils/format';
import type { OpeningHours } from '../../types';

// shop closed on Sunday, open the rest of the week
const hours: OpeningHours[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: '09:00',
  close: '17:00',
  closed: day === 0,
}));

describe('DateStrip', () => {
  it('shows two weeks and disables days the shop is closed or the barber is off', () => {
    // barber works Monday to Friday
    render(
      <DateStrip
        value={null}
        onChange={vi.fn()}
        openingHours={hours}
        workingDays={[1, 2, 3, 4, 5]}
      />,
    );
    const chips = within(screen.getByRole('radiogroup')).getAllByRole('radio');
    expect(chips).toHaveLength(14);

    // every disabled chip falls on a Saturday or Sunday
    const disabled = chips.filter((c) => (c as HTMLButtonElement).disabled);
    expect(disabled.length).toBe(4);
    for (const chip of disabled) {
      expect(['Sat', 'Sun', 'Today']).toContain(chip.firstChild?.textContent);
    }
  });

  it('reports the picked day and marks it selected', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DateStrip
        value={null}
        onChange={onChange}
        openingHours={hours}
        workingDays={[0, 1, 2, 3, 4, 5, 6]}
      />,
    );
    const firstOpen = screen.getAllByRole('radio').find((c) => !(c as HTMLButtonElement).disabled)!;
    await userEvent.setup().click(firstOpen);

    const picked = onChange.mock.calls[0][0] as string;
    expect(picked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(weekdayOf(picked)).not.toBe(0); // never a Sunday, the shop is closed

    rerender(
      <DateStrip
        value={picked}
        onChange={onChange}
        openingHours={hours}
        workingDays={[0, 1, 2, 3, 4, 5, 6]}
      />,
    );
    expect(screen.getByRole('radio', { checked: true })).toBe(firstOpen);
  });
});
