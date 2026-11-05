import type { UserRole } from "@/domain/access/roles";

/** Пароль сидовых учёток (только для seed / внутренних тестов). В UI быстрого входа не предлагаем. */
export const DEMO_PASSWORD = "demo1234";

export type LoginRoleChoice = "DONOR_STAFF" | "FREELANCER" | "DISTRICT_ANALYST";

export type DemoAccount = {
  email: string;
  fullName: string;
  role: UserRole;
  hint: string;
};
