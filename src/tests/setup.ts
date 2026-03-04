import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from './msw/server';

// ─── localStorage mock (Zustand persist uses it) ──────────────────────────────
const localStorageMock = (() => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// ─── Suppress window.location.href redirects (interceptor calls this on 401) ─
Object.defineProperty(window, 'location', {
  value: { ...window.location, assign: vi.fn(), replace: vi.fn(), href: '' },
  writable: true,
});

// ─── Force axios to use Node.js http adapter so MSW can intercept requests ───
import axios from 'axios';
axios.defaults.adapter = 'http';

// ─── Silence sonner toasts in tests ──────────────────────────────────────────
vi.mock('sonner', () => ({ toast: { error: vi.fn(), warning: vi.fn(), success: vi.fn() } }));

// ─── MSW ─────────────────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());


