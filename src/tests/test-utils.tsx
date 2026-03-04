import type { ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

/** Creates a fresh QueryClient per test to avoid cross-test cache pollution. */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

interface WrapperOptions extends RenderOptions {
  initialEntries?: string[];
  route?: string;
}

/** Renders `ui` wrapped in MemoryRouter + QueryClientProvider. */
export function renderWithProviders(
  ui: ReactNode,
  { initialEntries = ['/'], route = '/', ...options }: WrapperOptions = {}
) {
  const queryClient = createTestQueryClient();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path={route} element={children} />
          {/* Catch-all for navigation targets */}
          <Route path="*" element={<div data-testid="navigated-page" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}
