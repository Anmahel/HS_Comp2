import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginModal } from '../LoginModal';

describe('LoginModal Component Tests', () => {
  it('renders nothing when closed', () => {
    render(<LoginModal isOpen={false} onClose={vi.fn()} onLogin={vi.fn()} />);
    expect(screen.queryByTestId('login-username-input')).not.toBeInTheDocument();
  });

  it('submits credentials and closes on success', async () => {
    const onLogin = vi.fn().mockResolvedValue({ role: 'admin', name: 'Admin' });
    const onClose = vi.fn();

    render(<LoginModal isOpen={true} onClose={onClose} onLogin={onLogin} />);

    fireEvent.change(screen.getByTestId('login-username-input'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByTestId('login-password-input'), { target: { value: 'admin123' } });

    const submitBtn = screen.getByTestId('login-submit-btn');
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith('admin', 'admin123');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('shows error message when login fails and keeps modal open', async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error('Credenciais inválidas'));
    const onClose = vi.fn();

    render(<LoginModal isOpen={true} onClose={onClose} onLogin={onLogin} />);

    fireEvent.change(screen.getByTestId('login-username-input'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByTestId('login-password-input'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByTestId('login-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toHaveTextContent('Credenciais inválidas');
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('disables submit while submitting or when fields are empty', () => {
    render(<LoginModal isOpen={true} onClose={vi.fn()} onLogin={vi.fn()} />);

    const submitBtn = screen.getByTestId('login-submit-btn');
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByTestId('login-username-input'), { target: { value: 'admin' } });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByTestId('login-password-input'), { target: { value: 'x' } });
    expect(submitBtn).not.toBeDisabled();
  });
});