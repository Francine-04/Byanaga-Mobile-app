export function filterByOpeningHours(items) {
  return items.map((item) => ({
    ...item,
    availabilityNote: item.openingHours || 'Sample schedule',
  }));
}
