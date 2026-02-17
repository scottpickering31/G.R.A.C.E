import { supabase } from "@/services/supabase";
import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { queryClient } from "../lib/queryclient";

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
    const { data } = await supabase.auth.getSession();
    const session = data.session ?? null;

    // If we have a session locally, verify it on the server
    if (session) {
      const { data: userData, error } = await supabase.auth.getUser();

      // Token invalid / user deleted / session stale
      if (error || !userData?.user) {
        await supabase.auth.signOut();
        set({ session: null, hydrated: true });
        return;
      }
    }

    set({ session, hydrated: true });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session: session ?? null, hydrated: true });
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    set({ session: null, hydrated: true });
  },
}));

export const useIsLoggedIn = () => Boolean(useAuthStore((s) => s.session));
