export function matchByPreferences(preferences, destinations) {
  const selected = [...(preferences.places || []), ...(preferences.activities || [])];
  if (!selected.length) {
    return destinations;
  }

  return [...destinations].sort((a, b) => {
    const aScore = (a.tags || []).filter((tag) => selected.includes(tag)).length;
    const bScore = (b.tags || []).filter((tag) => selected.includes(tag)).length;
    return bScore - aScore;
  });
}
