import { create } from "zustand";

type UIState = {
  isLoading: boolean;
  message?: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  message: undefined,
  showLoading: (message) => set({ isLoading: true, message }),
  hideLoading: () => set({ isLoading: false, message: undefined }),
}));
