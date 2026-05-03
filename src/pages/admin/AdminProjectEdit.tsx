import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2, Plus } from "lucide-react";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

// Extracts youtube id from common URL formats or returns the raw id.
const extractYoutubeId = (input: string): string => {
  if (!input) return "";
  const m = input.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/))([\w-]{11})/);
  return m ? m[1] : input.trim();
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border border-border rounded-md p-6 space-y-4">
    <h2 className="font-display uppercase text-xs tracking-cinema text-muted-foreground">{title}</h2>
    {children}
  </section>
);

const Field = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={`space-y-1.5 ${className}`}>
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const AdminProjectEdit = () => {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const [p, setP] = useState<ProjectRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Edit Project — Admin";
    (async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
      if (error) toast.error(error.message);
      setP(data);
      setLoading(false);
    })();
  }, [id]);

  const update = <K extends keyof ProjectRow>(key: K, value: ProjectRow[K]) =>
    setP((prev) => (prev ? { ...prev, [key]: value } : prev));

  const save = async () => {
    if (!p) return;
    setSaving(true);
    const { id: _id, created_at, updated_at, ...rest } = p;
    const payload = {
      ...rest,
      slug: rest.slug || slugify(rest.title),
      preview_video_youtube_id: rest.preview_video_youtube_id ? extractYoutubeId(rest.preview_video_youtube_id) : null,
      main_video_youtube_id: rest.main_video_youtube_id ? extractYoutubeId(rest.main_video_youtube_id) : null,
      video_2_youtube_id: rest.video_2_youtube_id ? extractYoutubeId(rest.video_2_youtube_id) : null,
      video_3_youtube_id: rest.video_3_youtube_id ? extractYoutubeId(rest.video_3_youtube_id) : null,
    };
    const { error } = await supabase.from("projects").update(payload).eq("id", p.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const onDelete = async () => {
    if (!p || !confirm(`Delete "${p.title}"?`)) return;
    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); nav("/admin"); }
  };

  const credits = useMemo(() => [1, 2, 3, 4, 5, 6] as const, []);

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!p) return <div className="p-8">Project not found. <Link to="/admin" className="underline">Back</Link></div>;

  return (
    <div className="px-8 py-6 max-w-5xl">
      <header className="flex items-center justify-between mb-6 sticky top-0 bg-background/95 backdrop-blur py-3 z-10">
        <Link to="/admin" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Projects
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
          <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" /> {saving ? "Saving…" : "Save"}</Button>
        </div>
      </header>

      <div className="space-y-6">
        <Section title="General">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Project title" className="col-span-2">
              <Input value={p.title} onChange={(e) => update("title", e.target.value)} />
            </Field>
            <Field label="Slug">
              <Input value={p.slug} onChange={(e) => update("slug", slugify(e.target.value))} />
            </Field>
            <Field label="Status">
              <Select value={p.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Client">
              <Input value={p.client ?? ""} onChange={(e) => update("client", e.target.value)} />
            </Field>
            <Field label="Year">
              <Input type="number" value={p.year ?? ""} onChange={(e) => update("year", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Categories (comma separated)" className="col-span-2">
              <Input
                value={p.categories.join(", ")}
                onChange={(e) => update("categories", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              />
            </Field>
            <Field label="Sort order">
              <Input type="number" value={p.sort_order} onChange={(e) => update("sort_order", Number(e.target.value) || 0)} />
            </Field>
            <Field label="Featured">
              <div className="h-10 flex items-center"><Switch checked={p.featured} onCheckedChange={(v) => update("featured", v)} /></div>
            </Field>
            <Field label="Brief description" className="col-span-2">
              <Input value={p.brief_description ?? ""} onChange={(e) => update("brief_description", e.target.value)} />
            </Field>
            <Field label="Overview" className="col-span-2">
              <Textarea rows={4} value={p.overview ?? ""} onChange={(e) => update("overview", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Preview (used in homepage scrolling reel)">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Preview YouTube URL or ID">
              <Input value={p.preview_video_youtube_id ?? ""} onChange={(e) => update("preview_video_youtube_id", e.target.value)} placeholder="dQw4w9WgXcQ" />
            </Field>
            <Field label="Preview image URL (poster fallback)">
              <Input value={p.preview_image_url ?? ""} onChange={(e) => update("preview_image_url", e.target.value)} />
            </Field>
            <Field label="Preview video URL (mp4, optional)" className="col-span-2">
              <Input value={p.preview_video_url ?? ""} onChange={(e) => update("preview_video_url", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Main video (project detail page)">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Main YouTube URL or ID">
              <Input value={p.main_video_youtube_id ?? ""} onChange={(e) => update("main_video_youtube_id", e.target.value)} />
            </Field>
            <Field label="Main image URL">
              <Input value={p.main_image_url ?? ""} onChange={(e) => update("main_image_url", e.target.value)} />
            </Field>
            <Field label="Main video URL (mp4, optional)">
              <Input value={p.main_video_url ?? ""} onChange={(e) => update("main_video_url", e.target.value)} />
            </Field>
            <Field label="Show controls on main video">
              <div className="h-10 flex items-center"><Switch checked={p.show_main_video_controls} onCheckedChange={(v) => update("show_main_video_controls", v)} /></div>
            </Field>
          </div>
        </Section>

        {[2, 3].map((n) => {
          const showKey = `show_video_${n}` as keyof ProjectRow;
          const ytKey = `video_${n}_youtube_id` as keyof ProjectRow;
          const urlKey = `video_${n}_url` as keyof ProjectRow;
          const ctrlKey = `show_video_${n}_controls` as keyof ProjectRow;
          return (
            <Section key={n} title={`Extra video ${n}`}>
              <div className="grid grid-cols-2 gap-4">
                <Field label={`Show video ${n} on page`}>
                  <div className="h-10 flex items-center"><Switch checked={p[showKey] as boolean} onCheckedChange={(v) => update(showKey, v as never)} /></div>
                </Field>
                <Field label="Show controls">
                  <div className="h-10 flex items-center"><Switch checked={p[ctrlKey] as boolean} onCheckedChange={(v) => update(ctrlKey, v as never)} /></div>
                </Field>
                <Field label="YouTube URL or ID">
                  <Input value={(p[ytKey] as string) ?? ""} onChange={(e) => update(ytKey, e.target.value as never)} />
                </Field>
                <Field label="Video URL (mp4, optional)">
                  <Input value={(p[urlKey] as string) ?? ""} onChange={(e) => update(urlKey, e.target.value as never)} />
                </Field>
              </div>
            </Section>
          );
        })}

        <Section title="Credits">
          <div className="grid grid-cols-2 gap-4">
            {credits.map((n) => {
              const tKey = `credit_title_${n}` as keyof ProjectRow;
              const nKey = `credit_name_${n}` as keyof ProjectRow;
              return (
                <div key={n} className="grid grid-cols-2 gap-2">
                  <Input placeholder={`Title ${n} (e.g. Director)`} value={(p[tKey] as string) ?? ""} onChange={(e) => update(tKey, e.target.value as never)} />
                  <Input placeholder={`Credit ${n} (e.g. Jo Maren)`} value={(p[nKey] as string) ?? ""} onChange={(e) => update(nKey, e.target.value as never)} />
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Gallery (image URLs)">
          <div className="space-y-2">
            {p.gallery.map((url, i) => (
              <div key={i} className="flex gap-2">
                <Input value={url} onChange={(e) => {
                  const next = [...p.gallery]; next[i] = e.target.value; update("gallery", next);
                }} />
                <Button variant="ghost" size="icon" onClick={() => update("gallery", p.gallery.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => update("gallery", [...p.gallery, ""])}>
              <Plus className="h-4 w-4 mr-1" /> Add image
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default AdminProjectEdit;
