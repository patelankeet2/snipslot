import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OutboxItem } from '../offline/db';

// control the two things the banner listens to
const state = vi.hoisted(() => ({ online: true, outbox: [] as OutboxItem[] }));
vi.mock('../hooks/useOnlineStatus', () => ({ useOnlineStatus: () => state.online }));
vi.mock('../hooks/useOutbox', () => ({ useOutbox: () => state.outbox }));

import { OfflineBanner } from './OfflineBanner';

const queued = (id: string): OutboxItem => ({
  id: 1,
  method: 'DELETE',
  path: `/bookings/${id}`,
  bookingId: id,
  kind: 'cancel',
  label: 'Cancel',
  createdAt: 0,
});

beforeEach(() => {
  state.online = true;
  state.outbox = [];
});

describe('OfflineBanner', () => {
  it('stays hidden when online with nothing waiting', () => {
    const { container } = render(<OfflineBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('tells the user they are offline', () => {
    state.online = false;
    render(<OfflineBanner />);
    expect(screen.getByRole('status')).toHaveTextContent('You are offline. Showing saved data.');
  });

  it('counts changes waiting to sync', () => {
    state.online = false;
    state.outbox = [queued('a'), queued('b')];
    render(<OfflineBanner />);
    expect(screen.getByRole('status')).toHaveTextContent('2 changes waiting to sync');
  });

  it('shows syncing once the connection is back', () => {
    state.outbox = [queued('a')];
    render(<OfflineBanner />);
    expect(screen.getByRole('status')).toHaveTextContent('Syncing 1 change...');
  });
});
