export const userRoles = [
  "DONOR_STAFF",
  "WORKSHOP_MASTER",
  "STUDENT",
  "DISTRICT_ANALYST",
  "PLATFORM_ADMIN",
] as const;

export type UserRole = (typeof userRoles)[number];

export const institutionTypes = [
  "SCHOOL",
  "GYMNASIUM",
  "LYCEUM",
  "COLLEGE",
  "VOCATIONAL",
  "DEPARTMENT",
] as const;

export type InstitutionType = (typeof institutionTypes)[number];

const roleSet = new Set<string>(userRoles);

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && roleSet.has(value);
}

export const roleLabels: Record<UserRole, string> = {
  DONOR_STAFF: "Школа",
  WORKSHOP_MASTER: "Мастерская",
  STUDENT: "Учащийся",
  DISTRICT_ANALYST: "Аналитик отдела образования",
  PLATFORM_ADMIN: "Администратор",
};

/** Короткие подписи MVP для шапки и демо-входа. */
export function mvpRoleLabel(role: UserRole): string {
  if (role === "DONOR_STAFF") return "Школа";
  if (role === "WORKSHOP_MASTER") return "Мастерская";
  if (role === "PLATFORM_ADMIN") return "Администратор";
  return roleLabels[role];
}

export const institutionTypeLabels: Record<InstitutionType, string> = {
  SCHOOL: "Школа",
  GYMNASIUM: "Гимназия",
  LYCEUM: "Лицей",
  COLLEGE: "Колледж",
  VOCATIONAL: "ПТУ",
  DEPARTMENT: "Отдел образования",
};

/** Саморегистрация не выдаёт роль учащегося, аналитика и администратора. */
export function roleForInstitutionType(type: InstitutionType): UserRole | null {
  if (type === "SCHOOL" || type === "GYMNASIUM" || type === "LYCEUM") {
    return "DONOR_STAFF";
  }
  if (type === "COLLEGE" || type === "VOCATIONAL") {
    return "WORKSHOP_MASTER";
  }
  return null;
}

export type AppSection = {
  href: string;
  label: string;
  hint: string;
  roles: readonly UserRole[];
};

/** MVP: школа публикует, мастерская чинит. Дашборд района скрыт из навигации. */
export const appSections: readonly AppSection[] = [
  {
    href: "/cabinet",
    label: "Кабинет",
    hint: "мои вещи",
    roles: ["DONOR_STAFF", "PLATFORM_ADMIN"],
  },
  {
    href: "/catalog",
    label: "Каталог",
    hint: "все предметы",
    roles: ["DONOR_STAFF", "WORKSHOP_MASTER", "PLATFORM_ADMIN"],
  },
  {
    href: "/workshop",
    label: "Биржа",
    hint: "взять в работу",
    roles: ["WORKSHOP_MASTER", "PLATFORM_ADMIN"],
  },
  {
    href: "/orders",
    label: "Заказы",
    hint: "ход ремонта",
    roles: ["WORKSHOP_MASTER", "PLATFORM_ADMIN"],
  },
  { href: "/admin", label: "Участники", hint: "учётки", roles: ["PLATFORM_ADMIN"] },
];

const homes: Record<UserRole, string> = {
  DONOR_STAFF: "/cabinet",
  WORKSHOP_MASTER: "/workshop",
  STUDENT: "/",
  DISTRICT_ANALYST: "/district",
  PLATFORM_ADMIN: "/admin",
};

export function roleHome(role: UserRole): string {
  return homes[role];
}

export function sectionsForRole(role: UserRole): AppSection[] {
  return appSections.filter((section) => section.roles.includes(role));
}

export function sectionForPath(pathname: string): AppSection | undefined {
  return appSections.find(
    (section) => pathname === section.href || pathname.startsWith(`${section.href}/`),
  );
}

export function canAccess(role: UserRole, pathname: string): boolean {
  const section = sectionForPath(pathname);
  return section !== undefined && section.roles.includes(role);
}

/** Оставляет только внутренний путь, который эта роль может открыть. */
export function safeNextPath(next: string | null | undefined, role: UserRole): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return roleHome(role);
  }
  const path = next.split("?")[0] ?? "";
  if (!canAccess(role, path)) return roleHome(role);
  return path;
}
