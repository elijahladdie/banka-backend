import type { NotificationType } from "@prisma/client";

export type NotificationLanguage = "en" | "fr" | "kin";

type TranslateFn = (metadata: Record<string, unknown>) => { title: string; message: string };

type NotificationTranslations = Record<NotificationType, Record<NotificationLanguage, TranslateFn>>;

const toNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatAmount = (value: unknown): string => toNumber(value).toLocaleString();

const translations: NotificationTranslations = {
  ACCOUNT_APPROVED: {
    en: (m) => ({
      title: "Account Approved",
      message: `Your ${String(m.accountType ?? "account")} account ${String(m.accountNumber ?? "")} has been approved and is now active.`
    }),
    fr: (m) => ({
      title: "Compte approuvé",
      message: `Votre compte ${String(m.accountType ?? "")} ${String(m.accountNumber ?? "")} a été approuvé et est maintenant actif.`
    }),
    kin: (m) => ({
      title: "Konti Yemejwe",
      message: `Konti yawe ya ${String(m.accountType ?? "")} ${String(m.accountNumber ?? "")} yemejwe kandi ubu irakora.`
    })
  },
  ACCOUNT_REJECTED: {
    en: (m) => ({
      title: "Account Request Rejected",
      message: `Your account request ${String(m.accountNumber ?? "")} was rejected. Reason: ${String(m.reason ?? "N/A")}`
    }),
    fr: (m) => ({
      title: "Demande de compte refusée",
      message: `Votre demande de compte ${String(m.accountNumber ?? "")} a été refusée. Raison: ${String(m.reason ?? "N/A")}`
    }),
    kin: (m) => ({
      title: "Konti Yanze",
      message: `Ubusabe bwa konti ${String(m.accountNumber ?? "")} bwanze. Impamvu: ${String(m.reason ?? "N/A")}`
    })
  },
  ACCOUNT_FROZEN: {
    en: (m) => ({
      title: "Account Frozen",
      message: `Your account ${String(m.accountNumber ?? "")} has been temporarily frozen. Reason: ${String(m.reason ?? "N/A")}`
    }),
    fr: (m) => ({
      title: "Compte gelé",
      message: `Votre compte ${String(m.accountNumber ?? "")} a été temporairement gelé. Raison: ${String(m.reason ?? "N/A")}`
    }),
    kin: (m) => ({
      title: "Konti Yarafunzwe",
      message: `Konti yawe ${String(m.accountNumber ?? "")} yarafunzwe by'agateganyo. Impamvu: ${String(m.reason ?? "N/A")}`
    })
  },
  ACCOUNT_DORMANT: {
    en: (m) => ({
      title: "Account Marked Dormant",
      message: `Your account ${String(m.accountNumber ?? "")} has been marked dormant due to inactivity.`
    }),
    fr: (m) => ({
      title: "Compte marqué dormant",
      message: `Votre compte ${String(m.accountNumber ?? "")} a été marqué dormant en raison de l'inactivité.`
    }),
    kin: (m) => ({
      title: "Konti Isinziritse",
      message: `Konti yawe ${String(m.accountNumber ?? "")} yabaye isinziritse kubera kudakoreshwa.`
    })
  },
  ACCOUNT_CLOSED: {
    en: (m) => ({
      title: "Account Closed",
      message: `Your account ${String(m.accountNumber ?? "")} has been permanently closed. Reason: ${String(m.reason ?? "N/A")}`
    }),
    fr: (m) => ({
      title: "Compte fermé",
      message: `Votre compte ${String(m.accountNumber ?? "")} a été définitivement fermé. Raison: ${String(m.reason ?? "N/A")}`
    }),
    kin: (m) => ({
      title: "Konti Yafunzwe",
      message: `Konti yawe ${String(m.accountNumber ?? "")} yafunzwe burundu. Impamvu: ${String(m.reason ?? "N/A")}`
    })
  },
  DEPOSIT_RECEIVED: {
    en: (m) => ({
      title: "Deposit Received",
      message: `${String(m.currency ?? "RWF")} ${formatAmount(m.amount)} has been deposited into account ${String(m.accountNumber ?? "")}. New balance: ${String(m.currency ?? "RWF")} ${formatAmount(m.balanceAfter)}.`
    }),
    fr: (m) => ({
      title: "Dépôt reçu",
      message: `${String(m.currency ?? "RWF")} ${formatAmount(m.amount)} a été déposé sur le compte ${String(m.accountNumber ?? "")}. Nouveau solde: ${String(m.currency ?? "RWF")} ${formatAmount(m.balanceAfter)}.`
    }),
    kin: (m) => ({
      title: "Amafaranga Yaguye",
      message: `${String(m.currency ?? "RWF")} ${formatAmount(m.amount)} yashyizwe muri konti ${String(m.accountNumber ?? "")}. Amafaranga asigaye: ${String(m.currency ?? "RWF")} ${formatAmount(m.balanceAfter)}.`
    })
  },
  WITHDRAWAL_PROCESSED: {
    en: (m) => ({
      title: "Withdrawal Processed",
      message: `${String(m.currency ?? "RWF")} ${formatAmount(m.amount)} has been withdrawn from account ${String(m.accountNumber ?? "")}. New balance: ${String(m.currency ?? "RWF")} ${formatAmount(m.balanceAfter)}.`
    }),
    fr: (m) => ({
      title: "Retrait traité",
      message: `${String(m.currency ?? "RWF")} ${formatAmount(m.amount)} a été retiré du compte ${String(m.accountNumber ?? "")}. Nouveau solde: ${String(m.currency ?? "RWF")} ${formatAmount(m.balanceAfter)}.`
    }),
    kin: (m) => ({
      title: "Amafaranga Yakuwe",
      message: `${String(m.currency ?? "RWF")} ${formatAmount(m.amount)} yakuwe muri konti ${String(m.accountNumber ?? "")}. Amafaranga asigaye: ${String(m.currency ?? "RWF")} ${formatAmount(m.balanceAfter)}.`
    })
  },
  TRANSFER_SENT: {
    en: (m) => ({
      title: "Transfer Sent",
      message: `${String(m.currency ?? "RWF")} ${formatAmount(m.amount)} transferred from ${String(m.fromAccountNumber ?? "")} to ${String(m.toAccountNumber ?? "")}. Reference: ${String(m.reference ?? "")}.`
    }),
    fr: (m) => ({
      title: "Transfert envoyé",
      message: `${String(m.currency ?? "RWF")} ${formatAmount(m.amount)} transféré de ${String(m.fromAccountNumber ?? "")} vers ${String(m.toAccountNumber ?? "")}. Référence: ${String(m.reference ?? "")}.`
    }),
    kin: (m) => ({
      title: "Amafaranga Yoherejwe",
      message: `${String(m.currency ?? "RWF")} ${formatAmount(m.amount)} yoherejwe uhereye ${String(m.fromAccountNumber ?? "")} ujya ${String(m.toAccountNumber ?? "")}. Numero: ${String(m.reference ?? "")}.`
    })
  },
  TRANSFER_RECEIVED: {
    en: (m) => ({
      title: "Transfer Received",
      message: `${String(m.currency ?? "RWF")} ${formatAmount(m.amount)} received in account ${String(m.toAccountNumber ?? "")}. New balance: ${String(m.currency ?? "RWF")} ${formatAmount(m.balanceAfter)}.`
    }),
    fr: (m) => ({
      title: "Transfert reçu",
      message: `${String(m.currency ?? "RWF")} ${formatAmount(m.amount)} reçu sur le compte ${String(m.toAccountNumber ?? "")}. Nouveau solde: ${String(m.currency ?? "RWF")} ${formatAmount(m.balanceAfter)}.`
    }),
    kin: (m) => ({
      title: "Amafaranga Yabonywe",
      message: `${String(m.currency ?? "RWF")} ${formatAmount(m.amount)} yabonywe muri konti ${String(m.toAccountNumber ?? "")}. Amafaranga asigaye: ${String(m.currency ?? "RWF")} ${formatAmount(m.balanceAfter)}.`
    })
  },
  PASSWORD_CHANGED: {
    en: () => ({
      title: "Password Changed",
      message: "Your account password was changed successfully. If you did not do this, contact support immediately."
    }),
    fr: () => ({
      title: "Mot de passe modifié",
      message: "Votre mot de passe a été changé avec succès. Si vous n'avez pas effectué cette action, contactez le support immédiatement."
    }),
    kin: () => ({
      title: "Ijambo Ryibanga Ryahinduwe",
      message: "Ijambo ryibanga rya konti yawe ryahinduwe neza. Niba utabikoze, hamagara ubufasha ako kanya."
    })
  },
  PROFILE_UPDATED: {
    en: () => ({
      title: "Profile Updated",
      message: "Your profile information has been updated successfully."
    }),
    fr: () => ({
      title: "Profil mis à jour",
      message: "Vos informations de profil ont été mises à jour avec succès."
    }),
    kin: () => ({
      title: "Umwirondoro Wahindutse",
      message: "Amakuru y'umwirondoro wawe yahindutse neza."
    })
  },
  USER_ACTIVATED: {
    en: () => ({
      title: "Account Activated",
      message: "Your BANKA account has been activated. You can now log in and access all features."
    }),
    fr: () => ({
      title: "Compte activé",
      message: "Votre compte BANKA a été activé. Vous pouvez maintenant vous connecter et accéder à toutes les fonctionnalités."
    }),
    kin: () => ({
      title: "Konti Yafunguwe",
      message: "Konti yawe ya BANKA yafunguwe. Ubu ushobora kwinjira no gukoresha serivisi zose."
    })
  },
  USER_DEACTIVATED: {
    en: (m) => ({
      title: "Account Deactivated",
      message: `Your BANKA account has been deactivated.${m.reason ? ` Reason: ${String(m.reason)}` : ""} Please contact support for assistance.`
    }),
    fr: (m) => ({
      title: "Compte désactivé",
      message: `Votre compte BANKA a été désactivé.${m.reason ? ` Raison: ${String(m.reason)}` : ""} Veuillez contacter le support.`
    }),
    kin: (m) => ({
      title: "Konti Yafunzwe",
      message: `Konti yawe ya BANKA yafunzwe.${m.reason ? ` Impamvu: ${String(m.reason)}` : ""} Vugana na serivisi yacu kugirango ufashwe.`
    })
  },
  BANK_ACCOUNT_CREATED: {
    en: (m) => ({
      title: "Bank Account Created",
      message: `Your ${String(m.accountType ?? "account")} account ${String(m.accountNumber ?? "")} (${String(m.currency ?? "RWF")}) has been created and is pending approval.`
    }),
    fr: (m) => ({
      title: "Compte bancaire créé",
      message: `Votre compte ${String(m.accountType ?? "")} ${String(m.accountNumber ?? "")} (${String(m.currency ?? "RWF")}) a été créé et est en attente d'approbation.`
    }),
    kin: (m) => ({
      title: "Konti ya Banki Yafunguwe",
      message: `Konti yawe ya ${String(m.accountType ?? "")} ${String(m.accountNumber ?? "")} (${String(m.currency ?? "RWF")}) yafunguwe kandi itegereje kwemezwa.`
    })
  },
  WELCOME: {
    en: () => ({
      title: "Welcome to BANKA!",
      message: "Your account has been created and is pending approval by a manager. You will be notified once approved."
    }),
    fr: () => ({
      title: "Bienvenue chez BANKA!",
      message: "Votre compte a été créé et attend l'approbation d'un gestionnaire. Vous serez notifié une fois approuvé."
    }),
    kin: () => ({
      title: "Murakaza muri BANKA!",
      message: "Konti yawe yafunguwe kandi itegereje kwemezwa n'umuyobozi. Uzamenyeshwa igihe yemejwe."
    })
  }
};

export function getUserLanguage(preferredLanguage?: string | null): NotificationLanguage {
  if (preferredLanguage === "fr" || preferredLanguage === "kin") {
    return preferredLanguage;
  }
  return "en";
}

export function translateNotification(
  type: NotificationType,
  language: string,
  metadata: Record<string, unknown>
): { title: string; message: string } {
  const resolvedLanguage = getUserLanguage(language);
  const translator = translations[type]?.[resolvedLanguage];

  if (!translator) {
    return {
      title: String(type).replace(/_/g, " "),
      message: ""
    };
  }

  return translator(metadata);
}