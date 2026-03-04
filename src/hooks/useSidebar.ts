import { create } from 'zustand';

interface SidebarState {
  /** Mobile: whether the overlay drawer is open */
  isOpen: boolean;
  /** Desktop: whether sidebar is collapsed to icon-only (w-16) */
  isCollapsed: boolean;
  /** Toggle mobile drawer */
  toggle: () => void;
  /** Close mobile drawer */
  close: () => void;
  /** Toggle desktop collapse */
  collapse: () => void;
}

export const useSidebarStore = create<SidebarState>()((set) => ({
  isOpen: false,
  isCollapsed: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
  collapse: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
}));
