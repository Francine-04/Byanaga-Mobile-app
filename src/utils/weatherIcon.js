export function weatherIcon(condition, isDay) {
  const value = String(condition || '').toLowerCase();
  if (!value || value.includes('unavailable')) return { name: 'help-circle-outline', color: '#FFFFFF' };
  if (value.includes('storm')) return { name: 'thunderstorm', color: '#FFFFFF' };
  if (value.includes('snow')) return { name: 'snow', color: '#FFFFFF' };
  if (/rain|shower|drizzle/.test(value)) return { name: 'rainy', color: '#FFFFFF' };
  if (value.includes('partly')) return { name: isDay === false ? 'cloudy-night' : 'partly-sunny', color: isDay === false ? '#E5EDFF' : '#FFE082' };
  if (/cloud|fog/.test(value)) return { name: 'cloud', color: '#FFFFFF' };
  return { name: isDay === false ? 'moon' : 'sunny', color: isDay === false ? '#E5EDFF' : '#FFD329' };
}
