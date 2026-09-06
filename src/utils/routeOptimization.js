export function optimizeRoute(stops) {
  return stops.map((stop, index) => ({
    ...stop,
    routeOrder: index + 1,
  }));
}
