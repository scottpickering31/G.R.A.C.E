import { useQuery } from "@tanstack/react-query";
import { getProfile } from "./service";

export function useProfile(id: string) {
  return useQuery({
    queryKey: ["profile", id],
    queryFn: () => getProfile(id),
    enabled: !!id,
  });
}
