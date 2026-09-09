import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';

export default function HeatmapOverlay({ zones = [], selectedZoneId, onSelectZone }) {
  const { theme } = useApp();

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {zones.map((zone) => {
        const color = theme.crowd[zone.colorKey];
        const selected = selectedZoneId === zone.id;
        return (
          <Pressable
            key={zone.id}
            accessibilityRole="button"
            accessibilityLabel={`${zone.label}, ${zone.level}`}
            onPress={() => onSelectZone?.(zone)}
            style={[
              styles.zone,
              {
                top: zone.top,
                left: zone.left,
                width: zone.size,
                height: zone.size,
                borderRadius: zone.size / 2,
                backgroundColor: `${color}44`,
                borderColor: selected ? color : `${color}66`,
              },
            ]}
          >
            <View
              style={[
                styles.innerZone,
                {
                  backgroundColor: `${color}88`,
                  borderColor: color,
                },
              ]}
            />
            {selected ? (
              <View style={[styles.label, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.labelText, { color: theme.colors.text }]} numberOfLines={1}>
                  {zone.level}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  innerZone: {
    width: '46%',
    height: '46%',
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    position: 'absolute',
    top: -28,
    minWidth: 88,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
});
