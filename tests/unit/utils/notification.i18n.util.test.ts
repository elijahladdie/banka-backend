import { NotificationType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { getUserLanguage, translateNotification } from "../../../src/utils/notification.i18n";

describe("notification i18n util", () => {
  describe("getUserLanguage", () => {
    it("should resolve supported languages", () => {
      expect(getUserLanguage("fr")).toBe("fr");
      expect(getUserLanguage("kin")).toBe("kin");
    });

    it("should fall back to english for unsupported language", () => {
      expect(getUserLanguage("sw")).toBe("en");
    });
  });

  describe("translateNotification", () => {
    it("should translate known notification type", () => {
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

    it("should return safe fallback for unknown notification type", () => {
      expect(translateNotification("UNKNOWN" as NotificationType, "sw", {})).toEqual({
        title: "UNKNOWN",
        message: ""
      });
    });
  });
});
