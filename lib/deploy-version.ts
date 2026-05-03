import { SITE_BUILD_NUMBER } from "./build-version";

/** Label shown after “build ” on the deploy badge (SSR / build-time). */
export function getDeployVersionLabel(): string {
  const explicit = process.env.NEXT_PUBLIC_DEPLOY_VERSION?.trim();
  if (explicit) return explicit;

  return String(SITE_BUILD_NUMBER);
}
