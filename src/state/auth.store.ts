import { supabase } from "@/services/supabase";
import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";

type AuthState = {
  session: Session | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  hydrated: false,

  hydrate: async () => {
    // 1) get existing session from storage
    const { data } = await supabase.auth.getSession();
    set({ session: data.session ?? null, hydrated: true });

    // 2) listen for changes (login/logout/token refresh)
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session: session ?? null, hydrated: true });
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },
}));

export const useIsLoggedIn = () => Boolean(useAuthStore((s) => s.session));
