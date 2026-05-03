import type { Database } from "@/integrations/supabase/types";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type MediaSource = "youtube" | "file" | "url";
export type MediaType = "video" | "image";

export type ResolvedProjectMedia = {
  type: MediaType;
  source: MediaSource | "image";
  url: string | null;
  youtubeId: string | null;
};

export const extractYoutubeId = (input?: string | null): string | null => {
  if (!input) return null;

  const trimmed = input.trim();
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/))([\w-]{11})/
  );

  if (match?.[1]) return match[1];
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  return null;
};

const resolveVideoBySource = (
  source: string | null | undefined,
  youtubeValue?: string | null,
  fileValue?: string | null,
  urlValue?: string | null
): ResolvedProjectMedia => {
  const normalizedSource = (source ?? "youtube") as MediaSource;

  if (normalizedSource === "file") {
    return { type: "video", source: "file", url: fileValue ?? null, youtubeId: null };
  }

  if (normalizedSource === "url") {
    return { type: "video", source: "url", url: urlValue ?? null, youtubeId: null };
  }

  const youtubeId = extractYoutubeId(youtubeValue);
  return {
    type: "video",
    source: "youtube",
    url: youtubeId ? `https://www.youtube-nocookie.com/embed/${youtubeId}` : null,
    youtubeId,
  };
};

export const resolvePreviewMedia = (project: ProjectRow): ResolvedProjectMedia => {
  if (project.preview_media_type === "image") {
    return {
      type: "image",
      source: "image",
      url: project.preview_image_url ?? null,
      youtubeId: null,
    };
  }

  return resolveVideoBySource(
    project.preview_video_source,
    project.preview_video_youtube_id,
    project.preview_video_file,
    project.preview_video_url
  );
};

export const resolveMainMedia = (project: ProjectRow): ResolvedProjectMedia => {
  if (project.main_media_type === "image") {
    return {
      type: "image",
      source: "image",
      url: project.main_image_url ?? null,
      youtubeId: null,
    };
  }

  return resolveVideoBySource(
    project.main_video_source,
    project.main_video_youtube_id,
    project.main_video_file,
    project.main_video_url
  );
};

export const resolveExtraVideo = (project: ProjectRow, slot: 2 | 3): ResolvedProjectMedia | null => {
  const enabled = slot === 2 ? project.show_video_2 : project.show_video_3;
  if (!enabled) return null;

  return slot === 2
    ? resolveVideoBySource(project.video_2_source, project.video_2_youtube_id, project.video_2_file, project.video_2_url)
    : resolveVideoBySource(project.video_3_source, project.video_3_youtube_id, project.video_3_file, project.video_3_url);
};

export const getMediaPoster = (media: ResolvedProjectMedia, fallbackTitle: string): string | undefined => {
  if (media.type === "image") return media.url ?? undefined;
  if (media.youtubeId) return `https://i.ytimg.com/vi/${media.youtubeId}/maxresdefault.jpg`;
  return undefined;
};

export const getMediaLabel = (media: ResolvedProjectMedia, fallbackTitle: string): string => {
  if (media.type === "image") return `${fallbackTitle} image`;
  return `${fallbackTitle} video`;
};