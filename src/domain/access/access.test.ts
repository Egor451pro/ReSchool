import { describe, expect, it } from "vitest";
import {
  canAccess,
  isDonorInstitutionType,
  roleHome,
  safeNextPath,
  sectionForPath,
  sectionsForRole,
} from "./roles";

describe("access roles", () => {
  it("фрилансер видит биржу, заказы и кошелёк; каталог доступен без пункта меню", () => {
    expect(canAccess("FREELANCER", "/workshop")).toBe(true);
    expect(canAccess("FREELANCER", "/orders")).toBe(true);
    expect(canAccess("FREELANCER", "/wallet")).toBe(true);
    expect(canAccess("FREELANCER", "/catalog")).toBe(true);
    expect(canAccess("FREELANCER", "/cabinet")).toBe(false);
    expect(roleHome("FREELANCER")).toBe("/workshop");
    expect(sectionsForRole("FREELANCER").map((s) => s.href)).not.toContain("/catalog");
    expect(sectionsForRole("FREELANCER").map((s) => s.href)).toContain("/workshop");
  });

  it("завхоз видит кабинет, каталог и кошелёк", () => {
    expect(canAccess("DONOR_STAFF", "/cabinet")).toBe(true);
    expect(canAccess("DONOR_STAFF", "/catalog")).toBe(true);
    expect(canAccess("DONOR_STAFF", "/wallet")).toBe(true);
    expect(canAccess("DONOR_STAFF", "/workshop")).toBe(false);
    expect(roleHome("DONOR_STAFF")).toBe("/cabinet");
  });

  it("аналитик видит район и калькулятор", () => {
    expect(canAccess("DISTRICT_ANALYST", "/district")).toBe(true);
    expect(canAccess("DISTRICT_ANALYST", "/district/calculator")).toBe(true);
    expect(canAccess("DISTRICT_ANALYST", "/admin")).toBe(false);
    expect(roleHome("DISTRICT_ANALYST")).toBe("/district");
    expect(sectionsForRole("DISTRICT_ANALYST").map((s) => s.href)).toEqual([
      "/district",
      "/district/calculator",
    ]);
  });

  it("администратор видит сводку, район и каталог", () => {
    expect(canAccess("PLATFORM_ADMIN", "/admin")).toBe(true);
    expect(canAccess("PLATFORM_ADMIN", "/district")).toBe(true);
    expect(canAccess("PLATFORM_ADMIN", "/district/calculator")).toBe(true);
    expect(canAccess("PLATFORM_ADMIN", "/catalog")).toBe(true);
    expect(sectionsForRole("PLATFORM_ADMIN").map((s) => s.href)).toContain("/district");
  });

  it("sectionForPath выбирает самый длинный префикс", () => {
    expect(sectionForPath("/district/calculator")?.href).toBe("/district/calculator");
    expect(sectionForPath("/district")?.href).toBe("/district");
  });

  it("safeNextPath не пускает чужие разделы", () => {
    expect(safeNextPath("/admin", "FREELANCER")).toBe("/workshop");
    expect(safeNextPath("/district", "DISTRICT_ANALYST")).toBe("/district");
    expect(safeNextPath(null, "DONOR_STAFF")).toBe("/cabinet");
  });

  it("типы учреждений для саморегистрации завхоза", () => {
    expect(isDonorInstitutionType("SCHOOL")).toBe(true);
    expect(isDonorInstitutionType("COLLEGE")).toBe(true);
    expect(isDonorInstitutionType("DEPARTMENT")).toBe(false);
  });
});
