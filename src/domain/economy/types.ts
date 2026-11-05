/** Целые копейки. 100 копеек = 1 BYN. */
export type Kopecks = number;

export type ItemEconomyInput = {
  quantity: number;
  newUnitPriceKop: Kopecks;
  materialsKop: Kopecks;
  transportKop: Kopecks;
  /** Гонорар фрилансера за заказ. */
  freelancerFeeKop: Kopecks;
  disposalPerUnitKop: Kopecks;
  practiceConsumableKop: Kopecks;
  /** 0..1000, где 1000 = коэффициент замещения 1. */
  substitutionMilli: number;
};

export type RepairAdvice = "repair" | "review" | "dispose";

export type ItemEconomy = {
  newPriceKop: Kopecks;
  restorationKop: Kopecks;
  procurementSavingKop: Kopecks;
  avoidedDisposalKop: Kopecks;
  propertyBudgetKop: Kopecks;
  practiceSavingKop: Kopecks;
  freelancerFeeKop: Kopecks;
  combinedKop: Kopecks;
  worthRepairing: boolean;
  advice: RepairAdvice;
};

export type YearProjectionInput = {
  expectedListedPerYear: number;
  avgNewPriceKop: Kopecks;
  avgMaterialsKop: Kopecks;
  avgDisposalKop: Kopecks;
  defaultTransportKop: Kopecks;
  freelancerAvgFeeKop: Kopecks;
  practiceConsumableKop: Kopecks;
  substitutionMilli: number;
  completionMilli: number;
  hostingKopAnnual: Kopecks;
  supportKopAnnual: Kopecks;
};

export type YearProjection = {
  completedOrders: number;
  perItem: ItemEconomy;
  propertyBudgetKop: Kopecks;
  practiceSavingKop: Kopecks;
  combinedKop: Kopecks;
  platformCostKop: Kopecks;
  /** Годы. null, если экономия бюджета имущества не положительная. */
  paybackYears: number | null;
};

export type SnapshotRow = {
  procurementSavingKop: Kopecks;
  avoidedDisposalKop: Kopecks;
  propertyBudgetKop: Kopecks;
  practiceSavingKop: Kopecks;
  freelancerFeeKop: Kopecks;
  minutes: number;
};

export type SnapshotTotals = {
  orders: number;
  procurementSavingKop: Kopecks;
  avoidedDisposalKop: Kopecks;
  propertyBudgetKop: Kopecks;
  practiceSavingKop: Kopecks;
  freelancerFeeKop: Kopecks;
  combinedKop: Kopecks;
  minutes: number;
};
