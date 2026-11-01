export const MIN_BAR_WIDTH = 3;

export function getPassRateColor(passRate) {
  if (passRate === null || passRate === undefined) return "#cbd5e1";
  if (passRate >= 80) return "#059669";
  if (passRate >= 50) return "#d97706";
  return "#dc2626";
}

export function getBarDisplayWidth(passRate) {
  if (passRate === null || passRate === undefined) return MIN_BAR_WIDTH;
  return Math.max(passRate, MIN_BAR_WIDTH);
}
