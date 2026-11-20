import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ServiceForm } from './ServiceForm';
import { ApiError } from '../../api/client';

describe('ServiceForm', () => {
  it('shows every problem and does not submit invalid data', async () => {
    const onSubmit = vi.fn();
    render(<ServiceForm onSubmit={onSubmit} onCancel={() => undefined} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Name'), 'X');
    await user.clear(screen.getByLabelText('Duration (minutes)'));
    await user.type(screen.getByLabelText('Duration (minutes)'), '33');
    await user.type(screen.getByLabelText('Price (NZD)'), '-5');
    await user.click(screen.getByRole('button', { name: 'Add service' }));

    expect(screen.getByText('Name is too short')).toBeInTheDocument();
    expect(screen.getByText('Use 5 minute steps (5, 10, 15...)')).toBeInTheDocument();
    expect(screen.getByText('Price cannot be negative')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits clean numbers when everything is valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ServiceForm onSubmit={onSubmit} onCancel={() => undefined} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Name'), '  Hot Towel Shave ');
    await user.type(screen.getByLabelText('Price (NZD)'), '30');
    await user.click(screen.getByRole('button', { name: 'Add service' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Hot Towel Shave',
      description: '',
      durationMin: 30,
      price: 30,
      photoUrl: '',
    });
  });

  it('shows the server field errors next to the right inputs', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        new ApiError(400, 'BAD_REQUEST', 'Some fields are invalid', [
          { field: 'name', message: 'That name is already used' },
        ]),
      );
    render(<ServiceForm onSubmit={onSubmit} onCancel={() => undefined} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Name'), 'Skin Fade');
    await user.type(screen.getByLabelText('Price (NZD)'), '45');
    await user.click(screen.getByRole('button', { name: 'Add service' }));

    expect(await screen.findByText('That name is already used')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Some fields are invalid');
  });

  it('fills in the existing values when editing', () => {
    render(
      <ServiceForm
        initial={{ id: '1', name: 'Skin Fade', durationMin: 45, price: 45, active: true }}
        onSubmit={vi.fn()}
        onCancel={() => undefined}
      />,
    );
    expect(screen.getByLabelText('Name')).toHaveValue('Skin Fade');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });
});
