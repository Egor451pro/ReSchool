import { describe, expect, it } from "vitest";
import {
  canAccess,
  isDonorInstitutionType,
  roleHome,
  safeNextPath,
  sectionsForRole,
} from "./roles";

describe("access roles", () => {
  it("фрилансер видит биржу, заказы и кошелёк", () => {
    expect(canAccess("FREELANCER", "/workshop")).toBe(true);
    expect(canAccess("FREELANCER", "/orders")).toBe(true);
    expect(canAccess("FREELANCER", "/wallet")).toBe(true);
    expect(canAccess("FREELANCER", "/cabinet")).toBe(false);
    expect(roleHome("FREELANCER")).toBe("/workshop");
  });

  it("завхоз видит кабинет, каталог и кошелёк", () => {
    expect(canAccess("DONOR_STAFF", "/cabinet")).toBe(true);
    expect(canAccess("DONOR_STAFF", "/catalog")).toBe(true);
    expect(canAccess("DONOR_STAFF", "/wallet")).toBe(true);
    expect(canAccess("DONOR_STAFF", "/workshop")).toBe(false);
    expect(roleHome("DONOR_STAFF")).toBe("/cabinet");
  });

  it("администратор видит сводку", () => {
    expect(canAccess("PLATFORM_ADMIN", "/admin")).toBe(true);
    expect(sectionsForRole("PLATFORM_ADMIN").map((s) => s.href)).toContain("/admin");
  });

  it("safeNextPath не пускает чужие разделы", () => {
    expect(safeNextPath("/admin", "FREELANCER")).toBe("/workshop");
    expect(safeNextPath(null, "DONOR_STAFF")).toBe("/cabinet");
  });

  it("типы учреждений для саморегистрации завхоза", () => {
    expect(isDonorInstitutionType("SCHOOL")).toBe(true);
    expect(isDonorInstitutionType("COLLEGE")).toBe(true);
    expect(isDonorInstitutionType("DEPARTMENT")).toBe(false);
  });
});
