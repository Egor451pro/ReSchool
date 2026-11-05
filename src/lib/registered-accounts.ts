import type { PickerAccount } from "@/components/role-login-picker";
import type { UserRole } from "@/domain/access/roles";
import { listRegisteredAccounts } from "@/server/repositories/user-repository";

export async function loadPickerAccounts(): Promise<PickerAccount[]> {
  const rows = await listRegisteredAccounts();
  return rows.map((row) => ({
    userId: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role as UserRole,
    hint: row.institution?.name ?? null,
  }));
}
