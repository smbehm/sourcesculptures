import { useEffect, useState } from "react";
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
import { ArrowLeft, Save, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type Credit = { title: string; name: string };
type GalleryItem = { type: "image" | "video"; url: string; caption?: string };

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

const SourceSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="youtube">YouTube</SelectItem>
      <SelectItem value="file">Uploaded file URL</SelectItem>
      <SelectItem value="url">External URL</SelectItem>
    </SelectContent>
  </Select>
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

  const credits: Credit[] = Array.isArray(p?.credits) ? (p!.credits as unknown as Credit[]) : [];
  const setCredits = (next: Credit[]) => update("credits", next as never);

  const gallery: GalleryItem[] = Array.isArray(p?.gallery_items) ? (p!.gallery_items as unknown as GalleryItem[]) : [];
  const setGallery = (next: GalleryItem[]) => update("gallery_items", next as never);

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
      // keep gallery (text[]) in sync from gallery_items image urls for back-compat
      gallery: gallery.filter((g) => g.type === "image" && g.url).map((g) => g.url),
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

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!p) return <div className="p-8">Project not found. <Link to="/admin" className="underline">Back</Link></div>;

  const moveGallery = (i: number, dir: -1 | 1) => {
    const next = [...gallery];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setGallery(next);
  };

  const moveCredit = (i: number, dir: -1 | 1) => {
    const next = [...credits];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setCredits(next);
  };

  return (
    <div className="px-8 py-6 max-w-5xl">
      <header className="flex items-center justify-between mb-6 sticky top-0 bg-background/95 backdrop-blur py-3 z-10">
        <Link to="/admin" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Projects
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </header>

      <div className="space-y-6">
        <Section title="General">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Featured">
              <div className="h-10 flex items-center"><Switch checked={p.featured} onCheckedChange={(v) => update("featured", v)} /></div>
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
            <Field label="Project title" className="col-span-2">
              <Input value={p.title} onChange={(e) => update("title", e.target.value)} />
            </Field>
            <Field label="Slug" className="col-span-2">
              <Input value={p.slug} onChange={(e) => update("slug", slugify(e.target.value))} />
            </Field>
            <Field label="Brief description" className="col-span-2">
              <Input value={p.brief_description ?? ""} onChange={(e) => update("brief_description", e.target.value)} />
            </Field>
            <Field label="Overview" className="col-span-2">
              <Textarea rows={5} value={p.overview ?? ""} onChange={(e) => update("overview", e.target.value)} />
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
          </div>
        </Section>

        <Section title="Credits (unlimited)">
          <div className="space-y-2">
            {credits.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder={`Title ${i + 1} (e.g. Director)`}
                  value={c.title}
                  onChange={(e) => {
                    const next = [...credits];
                    next[i] = { ...c, title: e.target.value };
                    setCredits(next);
                  }}
                />
                <Input
                  placeholder={`Credit ${i + 1} (e.g. Jo Maren)`}
                  value={c.name}
                  onChange={(e) => {
                    const next = [...credits];
                    next[i] = { ...c, name: e.target.value };
                    setCredits(next);
                  }}
                />
                <Button variant="ghost" size="icon" onClick={() => moveCredit(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => moveCredit(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setCredits(credits.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setCredits([...credits, { title: "", name: "" }])}>
              <Plus className="h-4 w-4 mr-1" /> Add credit
            </Button>
          </div>
        </Section>

        <Section title="Preview Video / Image (homepage scrolling reel)">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Preview media type">
              <Select value={p.preview_media_type} onValueChange={(v) => update("preview_media_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Preview video source">
              <SourceSelect value={p.preview_video_source} onChange={(v) => update("preview_video_source", v)} />
            </Field>
            <Field label="Preview image URL" className="col-span-2">
              <Input value={p.preview_image_url ?? ""} onChange={(e) => update("preview_image_url", e.target.value)} />
            </Field>
            <Field label="Preview YouTube URL or ID">
              <Input value={p.preview_video_youtube_id ?? ""} onChange={(e) => update("preview_video_youtube_id", e.target.value)} placeholder="dQw4w9WgXcQ" />
            </Field>
            <Field label="Preview video file (uploaded URL)">
              <Input value={p.preview_video_file ?? ""} onChange={(e) => update("preview_video_file", e.target.value)} />
            </Field>
            <Field label="Preview video URL (external)" className="col-span-2">
              <Input value={p.preview_video_url ?? ""} onChange={(e) => update("preview_video_url", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Main Video / Image (project detail page)">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Main media type">
              <Select value={p.main_media_type} onValueChange={(v) => update("main_media_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Main video source">
              <SourceSelect value={p.main_video_source} onChange={(v) => update("main_video_source", v)} />
            </Field>
            <Field label="Main image URL" className="col-span-2">
              <Input value={p.main_image_url ?? ""} onChange={(e) => update("main_image_url", e.target.value)} />
            </Field>
            <Field label="Main YouTube URL or ID">
              <Input value={p.main_video_youtube_id ?? ""} onChange={(e) => update("main_video_youtube_id", e.target.value)} />
            </Field>
            <Field label="Main video file (uploaded URL)">
              <Input value={p.main_video_file ?? ""} onChange={(e) => update("main_video_file", e.target.value)} />
            </Field>
            <Field label="Main video URL (external)" className="col-span-2">
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
          const fileKey = `video_${n}_file` as keyof ProjectRow;
          const srcKey = `video_${n}_source` as keyof ProjectRow;
          const ctrlKey = `show_video_${n}_controls` as keyof ProjectRow;
          return (
            <Section key={n} title={`Video ${n} (extra)`}>
              <div className="grid grid-cols-2 gap-4">
                <Field label={`Show video ${n} on page`}>
                  <div className="h-10 flex items-center"><Switch checked={p[showKey] as boolean} onCheckedChange={(v) => update(showKey, v as never)} /></div>
                </Field>
                <Field label="Show controls">
                  <div className="h-10 flex items-center"><Switch checked={p[ctrlKey] as boolean} onCheckedChange={(v) => update(ctrlKey, v as never)} /></div>
                </Field>
                <Field label={`Video ${n} source`}>
                  <SourceSelect value={p[srcKey] as string} onChange={(v) => update(srcKey, v as never)} />
                </Field>
                <div />
                <Field label="YouTube URL or ID">
                  <Input value={(p[ytKey] as string) ?? ""} onChange={(e) => update(ytKey, e.target.value as never)} />
                </Field>
                <Field label="Video file (uploaded URL)">
                  <Input value={(p[fileKey] as string) ?? ""} onChange={(e) => update(fileKey, e.target.value as never)} />
                </Field>
                <Field label="Video URL (external)" className="col-span-2">
                  <Input value={(p[urlKey] as string) ?? ""} onChange={(e) => update(urlKey, e.target.value as never)} />
                </Field>
              </div>
            </Section>
          );
        })}

        <Section title="Gallery (mixed media — image or YouTube video)">
          <div className="space-y-2">
            {gallery.map((item, i) => (
              <div key={i} className="grid grid-cols-[140px_1fr_1fr_auto] gap-2 items-center">
                <Select value={item.type} onValueChange={(v) => {
                  const next = [...gallery]; next[i] = { ...item, type: v as "image" | "video" }; setGallery(next);
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">YouTube video</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder={item.type === "image" ? "Image URL" : "YouTube URL or ID"}
                  value={item.url}
                  onChange={(e) => { const next = [...gallery]; next[i] = { ...item, url: e.target.value }; setGallery(next); }}
                />
                <Input
                  placeholder="Caption (optional)"
                  value={item.caption ?? ""}
                  onChange={(e) => { const next = [...gallery]; next[i] = { ...item, caption: e.target.value }; setGallery(next); }}
                />
                <div className="flex">
                  <Button variant="ghost" size="icon" onClick={() => moveGallery(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => moveGallery(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setGallery(gallery.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setGallery([...gallery, { type: "image", url: "" }])}>
                <Plus className="h-4 w-4 mr-1" /> Add image
              </Button>
              <Button variant="outline" size="sm" onClick={() => setGallery([...gallery, { type: "video", url: "" }])}>
                <Plus className="h-4 w-4 mr-1" /> Add video
              </Button>
            </div>
          </div>
        </Section>

        <Section title="Metadata">
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>Created: {new Date(p.created_at).toLocaleString()}</div>
            <div>Edited: {new Date(p.updated_at).toLocaleString()}</div>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default AdminProjectEdit;
