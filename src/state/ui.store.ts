import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

type UIState = {
  isLoading: boolean;
  loadingMessage?: string;
  toastMessage?: string;
  toastType: ToastType;
  toastVisible: boolean;
  showLoading: (loadingMessage?: string) => void;
  hideLoading: () => void;
  showToast: (toastMessage: string, toastType?: ToastType) => void;
  hideToast: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  loadingMessage: undefined,
  toastMessage: undefined,
  toastType: "info",
  toastVisible: false,
  showLoading: (loadingMessage) => set({ isLoading: true, loadingMessage }),
  hideLoading: () => set({ isLoading: false, loadingMessage: undefined }),
  showToast: (toastMessage, toastType = "info") =>
    set({ toastVisible: true, toastMessage, toastType }),
  hideToast: () => set({ toastVisible: false, toastMessage: undefined }),
}));
