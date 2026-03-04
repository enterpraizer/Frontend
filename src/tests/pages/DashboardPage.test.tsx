import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { renderWithProviders } from '../test-utils';
import { server } from '../msw/server';
import { mockResourceUsageExceeded, mockUser, mockTokens } from '../msw/handlers';
import { useAuthStore } from '@/store/authStore';
import DashboardPage from '@/pages/DashboardPage';

// Seed auth store with a logged-in user before each test
beforeEach(() => {
  useAuthStore.getState().login(mockTokens, mockUser);
});

describe('DashboardPage', () => {
  it('renders 4 ResourceGauge components', async () => {
    renderWithProviders(<DashboardPage />, {
      route: '/dashboard',
      initialEntries: ['/dashboard'],
    });

    await waitFor(() => {
      expect(screen.getByText('vCPU')).toBeInTheDocument();
      expect(screen.getByText('RAM')).toBeInTheDocument();
      expect(screen.getByText('Disk')).toBeInTheDocument();
      expect(screen.getByText('VMs')).toBeInTheDocument();
    });
  });

  it('shows StatCards with correct VM counts', async () => {
    renderWithProviders(<DashboardPage />, {
      route: '/dashboard',
      initialEntries: ['/dashboard'],
    });

    // mockVMSummary: total=5, running=3, stopped=2
    await waitFor(() => {
      expect(screen.getByText('Total VMs')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Stopped')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('shows "Quota Exceeded" banner when a resource pct = 100', async () => {
    // Override usage handler to return vcpu at 100%
    server.use(
      http.get('http://localhost:8000/dashboard/usage', () =>
        HttpResponse.json(mockResourceUsageExceeded)
      )
    );

    renderWithProviders(<DashboardPage />, {
      route: '/dashboard',
      initialEntries: ['/dashboard'],
    });

    await waitFor(() => {
      // AlertTitle: "Quota Exceeded" (capital E, differs from ResourceGauge's "Quota exceeded")
      expect(screen.getByText('Quota Exceeded')).toBeInTheDocument();
      // Description has <strong>vCPU</strong> — match against the alert container's textContent
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toMatch(/you have reached your vCPU quota/i);
    });
  });
});
