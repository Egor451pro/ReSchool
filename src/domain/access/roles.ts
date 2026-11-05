export const userRoles = [
  "DONOR_STAFF",
  "FREELANCER",
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
  DONOR_STAFF: "Завхоз",
  FREELANCER: "Фрилансер",
  DISTRICT_ANALYST: "Аналитик отдела образования",
  PLATFORM_ADMIN: "Администратор",
};

/** Подписи ролей в шапке и на входе — без ФИО. */
export function mvpRoleLabel(role: UserRole): string {
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

/** Типы учреждений, которые завхоз может зарегистрировать сам. */
export const donorInstitutionTypes = [
  "SCHOOL",
  "GYMNASIUM",
  "LYCEUM",
  "COLLEGE",
  "VOCATIONAL",
] as const satisfies readonly InstitutionType[];

export type DonorInstitutionType = (typeof donorInstitutionTypes)[number];

export function isDonorInstitutionType(value: unknown): value is DonorInstitutionType {
  return typeof value === "string" && (donorInstitutionTypes as readonly string[]).includes(value);
}

export type AppSection = {
  href: string;
  label: string;
  hint: string;
  roles: readonly UserRole[];
};

/**
 * Меню по ролям:
 * - завхоз — кабинет заявок, каталог, кошелёк;
 * - фрилансер — биржа, заказы, кошелёк;
 * - администратор — сводка и каталог.
 */
export const appSections: readonly AppSection[] = [
  { href: "/admin", label: "Сводка", hint: "экономия района", roles: ["PLATFORM_ADMIN"] },
  {
    href: "/cabinet",
    label: "Кабинет",
    hint: "мои заявки",
    roles: ["DONOR_STAFF"],
  },
  {
    href: "/catalog",
    label: "Каталог",
    hint: "объявления",
    roles: ["DONOR_STAFF", "FREELANCER", "PLATFORM_ADMIN"],
  },
  {
    href: "/workshop",
    label: "Биржа",
    hint: "взять в работу",
    roles: ["FREELANCER"],
  },
  {
    href: "/orders",
    label: "Заказы",
    hint: "ход ремонта",
    roles: ["FREELANCER"],
  },
  {
    href: "/wallet",
    label: "Кошелёк",
    hint: "выплаты",
    roles: ["DONOR_STAFF", "FREELANCER"],
  },
];

const homes: Record<UserRole, string> = {
  DONOR_STAFF: "/cabinet",
  FREELANCER: "/workshop",
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
