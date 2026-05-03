import packageJson from "../package.json";

/** Single string for the deploy badge (SSR / build-time env). */
export function getDeployVersionLabel(): string {
  const explicit = process.env.NEXT_PUBLIC_DEPLOY_VERSION?.trim();
  if (explicit) return explicit;

  const sha =
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_SHA;
  if (sha && sha.length >= 7) return sha.slice(0, 7);

  return packageJson.version;
}
