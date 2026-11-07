import { describe, expect, it } from "vitest";
import { canPublishItems, canUpdateRepairBudget, itemManageState } from "./access";
import { readCatalogQuery } from "./filters";
import { detectPhotoKind } from "./image-file";
import { itemsCountLabel } from "./labels";
import { itemPhotoSrc } from "./photo";

const donor = { id: "u1", role: "DONOR_STAFF" as const, institutionId: "school" };
const freelancer = { id: "u3", role: "FREELANCER" as const, institutionId: null };
const admin = { id: "u2", role: "PLATFORM_ADMIN" as const, institutionId: null };

describe("карточка предмета", () => {
  it("считает склонение количества", () => {
    expect(itemsCountLabel(1)).toBe("1 предмет");
    expect(itemsCountLabel(4)).toBe("4 предмета");
    expect(itemsCountLabel(7)).toBe("7 предметов");
    expect(itemsCountLabel(21)).toBe("21 предмет");
    expect(itemsCountLabel(11)).toBe("11 предметов");
  });

  it("пускает публиковать и править только завхоза своего учреждения", () => {
    expect(canPublishItems(donor)).toBe(true);
    expect(canPublishItems(freelancer)).toBe(false);
    expect(canPublishItems(admin)).toBe(false);
    expect(itemManageState(donor, { institutionId: "school", status: "LISTED" })).toBe("edit");
    expect(itemManageState(freelancer, { institutionId: "school", status: "LISTED" })).toBe(
      "foreign",
    );
    expect(itemManageState(donor, { institutionId: "gym", status: "LISTED" })).toBe("foreign");
    expect(itemManageState(donor, { institutionId: "school", status: "IN_REPAIR" })).toBe("locked");
    expect(itemManageState(admin, { institutionId: "gym", status: "LISTED" })).toBe("locked");
    expect(canUpdateRepairBudget(donor, { institutionId: "school", status: "LISTED" })).toBe(true);
    expect(canUpdateRepairBudget(donor, { institutionId: "school", status: "REQUESTED" })).toBe(
      false,
    );
  });

  it("оставляет в адресе каталога только известные фильтры", () => {
    expect(
      readCatalogQuery({
        district: " Пилотный район ",
        category: "furniture",
        condition: "REPAIRABLE",
        status: "LISTED",
      }),
    ).toEqual({
      district: "Пилотный район",
      category: "furniture",
      condition: "REPAIRABLE",
      status: "LISTED",
    });
    expect(readCatalogQuery({ condition: "BROKEN", status: "DONE", category: "../x" })).toEqual({});
  });

  it("не подставляет в картинку произвольный путь", () => {
    expect(itemPhotoSrc({ id: "p1", path: "/placeholders/furniture.svg" })).toBe(
      "/placeholders/furniture.svg",
    );
    expect(itemPhotoSrc({ id: "p1", path: "file.jpg" })).toBe("/catalog/photos/p1");
    expect(itemPhotoSrc({ id: "p1", path: "/etc/passwd" })).toBe("/catalog/photos/p1");
  });

  it("узнаёт фото по сигнатуре, а не по имени файла", () => {
    expect(detectPhotoKind(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))).toBe("jpg");
    expect(
      detectPhotoKind(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe("png");
    const webp = new Uint8Array(12);
    webp.set([0x52, 0x49, 0x46, 0x46], 0);
    webp.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(detectPhotoKind(webp)).toBe("webp");
    expect(detectPhotoKind(Uint8Array.from([0x00, 0x01]))).toBeNull();
  });
});
