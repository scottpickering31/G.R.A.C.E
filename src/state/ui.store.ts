import { create } from "zustand";

export type ToastType = "success" | "error" | "info";
export type MedicationsWindowHours = 1 | 24 | 168;

type UIState = {
  isLoading: boolean;
  loadingMessage?: string;
  toastMessage?: string;
  toastType: ToastType;
  toastVisible: boolean;
  medicationsWindowHours: MedicationsWindowHours;
  showLoading: (loadingMessage?: string) => void;
  hideLoading: () => void;
  showToast: (toastMessage: string, toastType?: ToastType) => void;
  hideToast: () => void;
  setMedicationsWindowHours: (
    hours:
      | MedicationsWindowHours
      | ((prev: MedicationsWindowHours) => MedicationsWindowHours),
  ) => void;
};

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  loadingMessage: undefined,
  toastMessage: undefined,
  toastType: "info",
  toastVisible: false,
  medicationsWindowHours: 24,
  showLoading: (loadingMessage) => set({ isLoading: true, loadingMessage }),
  hideLoading: () => set({ isLoading: false, loadingMessage: undefined }),
  showToast: (toastMessage, toastType = "info") =>
    set({ toastVisible: true, toastMessage, toastType }),
  hideToast: () => set({ toastVisible: false, toastMessage: undefined }),
  setMedicationsWindowHours: (hours) =>
    set((state) => ({
      medicationsWindowHours:
        typeof hours === "function"
          ? hours(state.medicationsWindowHours)
          : hours,
    })),
}));
