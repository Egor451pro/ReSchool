import type { PickerAccount } from "@/components/role-login-picker";
import type { UserRole } from "@/domain/access/roles";
import { isDemoMode } from "@/lib/demo-mode";
import { listRegisteredAccounts } from "@/server/repositories/user-repository";

/** Публичный список аккаунтов на / и /login — только в DEMO_MODE и только *.demo. */
export async function loadPickerAccounts(): Promise<PickerAccount[]> {
  if (!isDemoMode()) return [];
  try {
    const rows = await listRegisteredAccounts();
    return rows.map((row) => ({
      userId: row.id,
      email: row.email,
      fullName: row.fullName,
      role: row.role as UserRole,
      hint: row.institution?.name ?? null,
    }));
  } catch {
    // БД ещё не поднята / неверный DATABASE_URL — главная должна открываться.
    return [];
  }
}
