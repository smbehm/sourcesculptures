import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProjects, type ProjectRow } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const AdminProjectsList = () => {
  const { data: projects = [], refetch } = useProjects({ adminView: true });
  const [filter, setFilter] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    document.title = "Projects — Admin";
  }, []);

  const rows = projects.filter((p) =>
    [p.title, p.slug, p.client, p.brief_description].filter(Boolean).join(" ").toLowerCase().includes(filter.toLowerCase())
  );

  const toggleFeatured = async (p: ProjectRow) => {
    const { error } = await supabase.from("projects").update({ featured: !p.featured }).eq("id", p.id);
    if (error) toast.error(error.message); else refetch();
  };

  const toggleStatus = async (p: ProjectRow) => {
    const next = p.status === "live" ? "draft" : "live";
    const { error } = await supabase.from("projects").update({ status: next }).eq("id", p.id);
    if (error) toast.error(error.message); else refetch();
  };

  const onDelete = async (p: ProjectRow) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); refetch(); }
  };

  const onCreate = async () => {
    const slug = `untitled-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from("projects")
      .insert({ title: "Untitled Project", slug, status: "draft", sort_order: (projects.at(-1)?.sort_order ?? 0) + 1 })
      .select()
      .single();
    if (error) return toast.error(error.message);
    nav(`/admin/projects/${data.id}`);
  };

  return (
    <div className="px-8 py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-display uppercase text-2xl font-bold">Projects</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search…" className="pl-8 w-64" />
          </div>
          <Button onClick={onCreate}><Plus className="h-4 w-4 mr-1" /> New project</Button>
        </div>
      </header>

      <div className="border border-border rounded-md overflow-hidden">
        <div className="grid grid-cols-[80px_90px_1fr_1.2fr_180px_90px_60px] text-[11px] uppercase tracking-cinema text-muted-foreground bg-secondary/40 px-4 py-3 border-b border-border">
          <div>Featured</div>
          <div>Status</div>
          <div>Title</div>
          <div>Slug</div>
          <div>Client</div>
          <div>Year</div>
          <div></div>
        </div>
        {rows.map((p) => (
          <div key={p.id} className="grid grid-cols-[80px_90px_1fr_1.2fr_180px_90px_60px] items-center px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/30">
            <div><Switch checked={p.featured} onCheckedChange={() => toggleFeatured(p)} /></div>
            <button onClick={() => toggleStatus(p)} className={`text-xs px-2 py-1 rounded w-fit ${p.status === "live" ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
              {p.status}
            </button>
            <Link to={`/admin/projects/${p.id}`} className="font-medium hover:text-accent truncate">{p.title}</Link>
            <div className="text-sm text-muted-foreground truncate">{p.slug}</div>
            <div className="text-sm truncate">{p.client ?? "—"}</div>
            <div className="text-sm">{p.year ?? "—"}</div>
            <div className="flex items-center gap-1 justify-end">
              <a href={`/projects/${p.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /></a>
              <button onClick={() => onDelete(p)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="px-4 py-12 text-center text-sm text-muted-foreground">No projects.</div>}
      </div>
    </div>
  );
};

export default AdminProjectsList;
