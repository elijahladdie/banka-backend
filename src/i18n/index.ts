import type { Request } from "express";
import path from "path";
import i18n from "i18n";

type Locale = "en" | "fr" | "kin";
type Params = Record<string, string | number>;
type RequestLike = {
  headers?: Request["headers"];
  user?: { preferredLanguage?: string | null };
};

const supportedLocales: Locale[] = ["en", "fr", "kin"];

i18n.configure({
  locales: supportedLocales,
  defaultLocale: "en",
  directory: path.resolve(process.cwd(), "locales"),
  objectNotation: true,
  updateFiles: false,
  syncFiles: false
});

export const i18nMiddleware = i18n.init;

function isLocale(value: string): value is Locale {
  return supportedLocales.includes(value as Locale);
}

function normalizeLocale(value?: string | null): Locale {
  if (!value) return "en";
  const raw = value.trim().toLowerCase();
  const normalized = raw.split(",")[0]?.split(";")[0]?.split("-")[0] ?? "en";

  if (normalized === "rw") return "kin";
  if (isLocale(normalized)) return normalized;
  return "en";
}

function localeFromRequest(req?: RequestLike): Locale {
  if (!req) return "en";

  if (typeof req.user?.preferredLanguage === "string") {
    return normalizeLocale(req.user.preferredLanguage);
  }

  const acceptLanguageHeader = req.headers?.["accept-language"];
  const acceptLanguage = Array.isArray(acceptLanguageHeader)
    ? acceptLanguageHeader[0]
    : acceptLanguageHeader;

  return normalizeLocale(acceptLanguage);
}

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => {
    if (!(key in params)) return `{${key}}`;
    return String(params[key]);
  });
}

function translate(locale: Locale, key: string): string {
  const localized = i18n.__({ phrase: key, locale });
  if (localized !== key) {
    return localized;
  }

  return i18n.__({ phrase: key, locale: "en" });
}

export function t(req: RequestLike | Request, key: string, params?: Params): string {
  const locale = localeFromRequest(req);
  const message = translate(locale, key);
  return interpolate(message || key, params);
}
