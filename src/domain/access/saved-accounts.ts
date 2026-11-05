import type { UserRole } from "@/domain/access/roles";

export const SAVED_ACCOUNTS_KEY = "reschool_saved_accounts";

export type SavedAccount = {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
};

/** Сидовые учётки из seed — не показываем в быстром входе. */
export function isSeedDemoEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(".demo");
}

export function readSavedAccounts(): SavedAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row): row is SavedAccount => {
        if (!row || typeof row !== "object") return false;
        const item = row as Record<string, unknown>;
        return (
          typeof item.userId === "string" &&
          typeof item.email === "string" &&
          typeof item.fullName === "string" &&
          typeof item.role === "string" &&
          !isSeedDemoEmail(item.email)
        );
      })
      .filter((account, index, list) => list.findIndex((row) => row.email === account.email) === index);
  } catch {
    return [];
  }
}

export function upsertSavedAccount(account: SavedAccount): void {
  if (typeof window === "undefined") return;
  if (isSeedDemoEmail(account.email)) return;
  const existing = readSavedAccounts().filter((row) => row.email !== account.email);
  const next = [account, ...existing].slice(0, 12);
  try {
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

export function removeSavedAccount(email: string): void {
  if (typeof window === "undefined") return;
  const next = readSavedAccounts().filter((row) => row.email !== email);
  try {
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearSavedAccounts(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SAVED_ACCOUNTS_KEY);
  } catch {
    /* ignore */
  }
}
