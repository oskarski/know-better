export function formatScore(score: number) {
  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 2,
  }).format(score);
}
