// Hide development copy and missing-value labels instead of inventing details.
export function visiblePlaceDetail(value) {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (!text || /\b(sample|placeholder|mock|prototype)\b/i.test(text)
    || /^(not provided|not listed|not connected|rate tbd)$/i.test(text)) return '';
  return text;
}
