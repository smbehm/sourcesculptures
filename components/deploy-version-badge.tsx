import { getDeployVersionLabel } from "@/lib/deploy-version";

/** On-screen deploy id (commit + Vercel deployment), auto from env at build time. */
export function DeployVersionBadge() {
  const label = getDeployVersionLabel();

  return (
    <div
      className="pointer-events-none fixed bottom-3 left-3 z-[90] select-none font-mono text-[10px] tracking-wide text-white/45"
      aria-hidden
    >
      <span className="rounded border border-white/15 bg-black/65 px-2 py-1 backdrop-blur-sm tabular-nums">
        build {label}
      </span>
    </div>
  );
}
