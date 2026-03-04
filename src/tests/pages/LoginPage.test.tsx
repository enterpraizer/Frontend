import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { renderWithProviders } from '../test-utils';
import { server } from '../msw/server';
import LoginPage from '@/pages/LoginPage';

// Mock useNavigate so we can assert navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('LoginPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('shows validation errors when submitted empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login', initialEntries: ['/login'] });

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // loginSchema: username & password both min(1, 'Required')
      expect(screen.getAllByText('Required').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('shows error alert on 401 response', async () => {
    server.use(
      http.post('http://localhost:8000/auth/token', () =>
        HttpResponse.json({ detail: 'Incorrect username or password' }, { status: 401 })
      )
    );

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login', initialEntries: ['/login'] });

    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /incorrect username or password/i
      );
    });
  });

  it('redirects to /dashboard on successful login', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login', initialEntries: ['/login'] });

    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'correctpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
