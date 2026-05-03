import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

export function useProjects(opts: { adminView?: boolean } = {}) {
  return useQuery({
    queryKey: ["projects", opts.adminView ? "all" : "live"],
    queryFn: async (): Promise<ProjectRow[]> => {
      let q = supabase.from("projects").select("*").order("sort_order", { ascending: true });
      if (!opts.adminView) q = q.eq("status", "live");
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProject(slug: string) {
  return useQuery({
    queryKey: ["project", slug],
    queryFn: async (): Promise<ProjectRow | null> => {
      const { data, error } = await supabase.from("projects").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}
