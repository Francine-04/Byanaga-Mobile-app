export function recommendByDistance(items) {
  return [...items].sort((a, b) => parseFloat(a.distance || '99') - parseFloat(b.distance || '99'));
}
