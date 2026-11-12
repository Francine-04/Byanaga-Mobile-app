import { regions, provinces, citiesMunicipalities } from 'ph-locations';

export { regions, provinces, citiesMunicipalities };
export const nagaLocation = {
  regionCode: 'PH-05', provinceCode: 'PH-CAS', city: 'Naga City',
};
export function normalizeHomeLocation(value = {}) {
  value = value || {};
  const region = regions.find((item) => item.code === value.regionCode);
  const province = provinces.find((item) => item.code === value.provinceCode && item.region === region?.code);
  const city = citiesMunicipalities.find((item) => item.province === province?.code && item.fullName === value.city);
  return { regionCode: region?.code || '', provinceCode: province?.code || '', city: city?.fullName || '' };
}
