export function rankByPopularity(items) {
  return [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
}
