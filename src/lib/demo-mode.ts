/** Локальный пилот / стенд для жюри. В production оставьте DEMO_MODE пустым или false. */
export function isDemoMode(): boolean {
  const value = process.env.DEMO_MODE?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}
