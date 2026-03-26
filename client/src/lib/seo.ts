import type { Language } from "@/lib/i18n";
import { getSeoForPath as getSharedSeoForPath, getSiteKeywords as getSharedSiteKeywords } from "@shared/seoMeta";

export function getSiteKeywords(language: Language) {
  return getSharedSiteKeywords(language);
}

export function getSeoForPath(path: string, language: Language) {
  return getSharedSeoForPath(path, language);
}
