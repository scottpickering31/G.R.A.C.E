import { supabase } from "@/services/supabase";

export const getProfile = async (id: string) => {
  const { data } = await supabase.from("profiles").select("*").eq("id", id);
  return data;
};
