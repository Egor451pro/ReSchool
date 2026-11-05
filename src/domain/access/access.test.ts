import { describe, expect, it } from "vitest";
import {
  canAccess,
  roleForInstitutionType,
  roleHome,
  safeNextPath,
  sectionsForRole,
} from "./roles";

describe("доступ по ролям", () => {
  it("пускает завхоза в кабинет и не открывает биржу", () => {
    expect(canAccess("DONOR_STAFF", "/cabinet")).toBe(true);
    expect(canAccess("DONOR_STAFF", "/cabinet/items")).toBe(true);
    expect(canAccess("DONOR_STAFF", "/workshop")).toBe(false);
    expect(canAccess("DONOR_STAFF", "/admin")).toBe(false);
  });

  it("не даёт учащемуся рабочих разделов MVP", () => {
    expect(sectionsForRole("STUDENT")).toEqual([]);
    expect(canAccess("STUDENT", "/cabinet")).toBe(false);
    expect(canAccess("STUDENT", "/catalog")).toBe(false);
    expect(canAccess("STUDENT", "/portfolio")).toBe(false);
    expect(roleHome("STUDENT")).toBe("/");
  });

  it("открывает администратору сводку и каталог без чужих кабинетов", () => {
    expect(canAccess("PLATFORM_ADMIN", "/admin")).toBe(true);
    expect(canAccess("PLATFORM_ADMIN", "/catalog")).toBe(true);
    expect(canAccess("PLATFORM_ADMIN", "/workshop")).toBe(false);
    expect(canAccess("PLATFORM_ADMIN", "/cabinet")).toBe(false);
    expect(canAccess("DISTRICT_ANALYST", "/district")).toBe(false);
    expect(roleHome("PLATFORM_ADMIN")).toBe("/admin");
  });

  it("даёт исполнителю кабинет заявок и биржу заказов", () => {
    expect(canAccess("WORKSHOP_MASTER", "/cabinet")).toBe(true);
    expect(canAccess("WORKSHOP_MASTER", "/workshop")).toBe(true);
    expect(canAccess("WORKSHOP_MASTER", "/orders")).toBe(true);
    expect(roleHome("WORKSHOP_MASTER")).toBe("/cabinet");
  });
});

describe("безопасный переход после входа", () => {
  it("отбрасывает чужой раздел и внешний адрес", () => {
    expect(safeNextPath("/admin", "STUDENT")).toBe("/");
    expect(safeNextPath("//evil.example", "DONOR_STAFF")).toBe("/cabinet");
    expect(safeNextPath("https://evil.example", "DONOR_STAFF")).toBe("/cabinet");
    expect(safeNextPath(null, "WORKSHOP_MASTER")).toBe("/cabinet");
  });

  it("сохраняет свой раздел", () => {
    expect(safeNextPath("/catalog?category=furniture", "DONOR_STAFF")).toBe("/catalog");
  });
});

describe("роль при регистрации", () => {
  it("даёт школе роль завхоза, а колледжу — исполнителя", () => {
    expect(roleForInstitutionType("SCHOOL")).toBe("DONOR_STAFF");
    expect(roleForInstitutionType("GYMNASIUM")).toBe("DONOR_STAFF");
    expect(roleForInstitutionType("COLLEGE")).toBe("WORKSHOP_MASTER");
    expect(roleForInstitutionType("VOCATIONAL")).toBe("WORKSHOP_MASTER");
    expect(roleForInstitutionType("DEPARTMENT")).toBeNull();
  });
});
