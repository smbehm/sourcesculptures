import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProjects, type ProjectRow } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, ExternalLink, Pencil } from "lucide-react";
import { toast } from "sonner";

type EditableField = "title" | "homepage_subtitle" | "slug" | "client" | "year" | "brief_description";

interface CellProps {
  project: ProjectRow;
  field: EditableField;
  onSaved: () => void;
  type?: "text" | "number";
  placeholder?: string;
  className?: string;
}

const InlineCell = ({ project, field, onSaved, type = "text", placeholder, className }: CellProps) => {
  const initial = (project[field] ?? "") as string | number;
  const [value, setValue] = useState<string>(initial === null || initial === undefined ? "" : String(initial));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(initial === null || initial === undefined ? "" : String(initial));
  }, [initial]);

  const commit = async () => {
    const original = initial === null || initial === undefined ? "" : String(initial);
    if (value === original) return;
    setSaving(true);
    const payload: Record<string, unknown> = {};
    if (type === "number") {
      payload[field] = value === "" ? null : Number(value);
    } else {
      payload[field] = value === "" ? null : value;
    }
    const { error } = await supabase.from("projects").update(payload).eq("id", project.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      setValue(original);
    } else {
      onSaved();
    }
  };

  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setValue(initial === null || initial === undefined ? "" : String(initial));
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={`w-full bg-transparent border border-transparent hover:border-border focus:border-accent focus:bg-background/60 outline-none rounded-sm px-2 py-1.5 text-sm transition-colors ${saving ? "opacity-60" : ""} ${className ?? ""}`}
    />
  );
};

const AdminProjectsList = () => {
  const { data: projects = [], refetch } = useProjects({ adminView: true });
  const [filter, setFilter] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    document.title = "Projects — Admin";
  }, []);

  const rows = useMemo(
    () =>
      projects.filter((p) =>
        [p.title, p.slug, p.client, p.brief_description, p.homepage_subtitle]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(filter.toLowerCase())
      ),
    [projects, filter]
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

  // Framer-style fixed widths so columns line up with horizontal scroll
  const cols = "80px 90px 260px 280px 200px 180px 100px 320px 140px";

  return (
    <div className="px-8 py-6">
      <header className="flex items-center justify-between mb-6 gap-4">
        <h1 className="font-display uppercase text-2xl font-bold">Projects</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search…" className="pl-8 w-64" />
          </div>
          <Button onClick={onCreate}><Plus className="h-4 w-4 mr-1" /> New project</Button>
        </div>
      </header>

      <p className="text-xs text-muted-foreground mb-3">
        Click any cell to edit. Changes save when you tab out or press Enter. Scroll horizontally to see all fields.
      </p>

      <div className="border border-border rounded-md overflow-x-auto">
        <div style={{ minWidth: "1650px" }}>
          <div
            className="grid text-[11px] uppercase tracking-cinema text-muted-foreground bg-secondary/40 px-3 py-3 border-b border-border sticky top-0 z-10"
            style={{ gridTemplateColumns: cols }}
          >
            <div>Featured</div>
            <div>Status</div>
            <div>Title</div>
            <div>Subtitle</div>
            <div>Slug</div>
            <div>Client</div>
            <div>Year</div>
            <div>Brief</div>
            <div className="text-right pr-2">Actions</div>
          </div>
          {rows.map((p) => (
            <div
              key={p.id}
              className="grid items-center px-3 py-2 border-b border-border last:border-0 hover:bg-secondary/20"
              style={{ gridTemplateColumns: cols }}
            >
              <div className="px-2"><Switch checked={p.featured} onCheckedChange={() => toggleFeatured(p)} /></div>
              <div className="px-2">
                <button
                  onClick={() => toggleStatus(p)}
                  className={`text-xs px-2 py-1 rounded w-fit ${p.status === "live" ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}
                >
                  {p.status}
                </button>
              </div>
              <InlineCell project={p} field="title" onSaved={refetch} placeholder="Untitled" className="font-medium" />
              <InlineCell project={p} field="homepage_subtitle" onSaved={refetch} placeholder="2024 · Short Film" />
              <InlineCell project={p} field="slug" onSaved={refetch} placeholder="slug" className="text-muted-foreground" />
              <InlineCell project={p} field="client" onSaved={refetch} placeholder="—" />
              <InlineCell project={p} field="year" onSaved={refetch} type="number" placeholder="—" />
              <InlineCell project={p} field="brief_description" onSaved={refetch} placeholder="Short brief…" className="text-muted-foreground" />
              <div className="flex items-center gap-1 justify-end pr-2">
                <Link to={`/admin/projects/${p.id}`} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-foreground hover:text-accent">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
                <a href={`/projects/${p.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /></a>
                <button onClick={() => onDelete(p)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="px-4 py-12 text-center text-sm text-muted-foreground">No projects.</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminProjectsList;
