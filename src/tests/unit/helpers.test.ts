import { NotificationType } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateAccountNumber } from "../../utils/generateAccountNumber";
import { getUserLanguage, translateNotification } from "../../utils/notification.i18n";
import { paginationMeta, parsePagination } from "../../utils/pagination";

describe("generateAccountNumber", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("builds a predictable account number from the year, national id suffix, and random suffix", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-05T00:00:00Z"));
    vi.spyOn(Math, "random").mockReturnValue(0);

    expect(generateAccountNumber("123456789")).toBe("2026678910000000");
  });
});

describe("pagination helpers", () => {
  it("normalizes page and limit values", () => {
    expect(parsePagination({ page: "0", limit: "500" })).toEqual({
      page: 1,
      limit: 100,
      skip: 0
    });
  });

  it("derives pagination metadata", () => {
    expect(paginationMeta(2, 10, 15)).toEqual({
      page: 2,
      limit: 10,
      total: 15,
      totalPages: 2,
      hasNext: false,
      hasPrev: true
    });
  });
});

describe("notification translation helpers", () => {
  it("resolves supported languages and falls back to english", () => {
    expect(getUserLanguage("fr")).toBe("fr");
    expect(getUserLanguage("kin")).toBe("kin");
    expect(getUserLanguage("en")).toBe("en");
    expect(getUserLanguage("es")).toBe("en");
    expect(getUserLanguage(undefined)).toBe("en");
  });

  it("translates withdrawal codes for french users", () => {
    expect(
      translateNotification(NotificationType.WITHDRAWAL_CODE_SENT, "fr", {
        code: "1234",
        accountNumber: "ACC-1001"
      })
    ).toEqual({
      title: "Code de confirmation du retrait",
      message: "Utilisez le code à 4 chiffres 1234 pour confirmer le retrait du compte ACC-1001."
    });
  });

  it("returns a safe fallback for unsupported notification types", () => {
    expect(translateNotification("UNKNOWN" as NotificationType, "en", {})).toEqual({
      title: "UNKNOWN",
      message: ""
    });
  });
});
