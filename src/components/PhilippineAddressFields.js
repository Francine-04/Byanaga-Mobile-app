import React from 'react';
import { View, Text } from 'react-native';
import SelectField from './SelectField';
import { useApp } from '../context/AppContext';
import { regions, provinces, citiesMunicipalities } from '../data/philippineLocations';

export default function PhilippineAddressFields({ value = {}, onChange, disabled = false }) {
  value = value || {};
  const { theme } = useApp();
  const region = regions.find((item) => item.code === value.regionCode);
  const province = provinces.find((item) => item.code === value.provinceCode && item.region === region?.code);
  const provinceOptions = provinces.filter((item) => item.region === region?.code);
  const cityOptions = citiesMunicipalities.filter((item) => item.province === province?.code);
  return <View pointerEvents={disabled ? 'none' : 'auto'}>
    <Text style={{ color: theme.colors.textMuted, marginBottom: 10, fontSize: 12 }}>Home location in the Philippines (optional)</Text>
    <SelectField label="Region" value={region?.name || ''} options={regions.map((item) => item.name)} searchable
      onSelect={(name) => onChange({ regionCode: regions.find((item) => item.name === name).code, provinceCode: '', city: '' })} />
    {region && <SelectField label="Province" value={province?.name || ''} options={provinceOptions.map((item) => item.name)} searchable
      onSelect={(name) => onChange({ ...value, provinceCode: provinceOptions.find((item) => item.name === name).code, city: '' })} />}
    {province && <SelectField label="City / Municipality" value={value.city || ''} options={cityOptions.map((item) => item.fullName).sort()} searchable
      onSelect={(city) => onChange({ ...value, city })} />}
  </View>;
}
