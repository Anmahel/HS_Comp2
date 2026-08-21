import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../Header';

describe('Header Component Tests', () => {
  it('renders application title and action buttons without brand pills', () => {
    render(
      <Header
        onOpenCreate={() => {}}
      />
    );

    expect(screen.getByText('HC_comp')).toBeInTheDocument();
    expect(screen.queryByText('Todas as Marcas')).not.toBeInTheDocument();
    expect(screen.getByText('Cadastrar Item')).toBeInTheDocument();
  });

  it('shows login button when no user is authenticated', () => {
    const handleOpenLogin = vi.fn();
    render(
      <Header
        onOpenCreate={() => {}}
        user={null}
        onOpenLogin={handleOpenLogin}
        onLogout={() => {}}
      />
    );

    const loginBtn = screen.getByTestId('login-btn');
    expect(loginBtn).toBeInTheDocument();
    fireEvent.click(loginBtn);
    expect(handleOpenLogin).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('user-session-badge')).not.toBeInTheDocument();
  });

  it('shows user session badge with clear user type and triggers logout', () => {
    const handleLogout = vi.fn();
    render(
      <Header
        onOpenCreate={() => {}}
        user={{ role: 'admin', name: 'Administrador Principal' }}
        onOpenLogin={() => {}}
        onLogout={handleLogout}
      />
    );

    expect(screen.getByTestId('user-session-badge')).toBeInTheDocument();
    expect(screen.getByText('Administrador Principal')).toBeInTheDocument();
    expect(screen.getByText(/Tipo:/i)).toBeInTheDocument();
    expect(screen.getByText(/Administrador \/ Eng/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('logout-btn'));
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });
});
