import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import DeviceModal from './DeviceModal';

function dateValue(date) {
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function BirthdayInput({ value, onChange, error }) {
  const { theme } = useApp();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date(2000, 0, 1));
  const [mode, setMode] = useState('days');
  const today = new Date();
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const start = new Date(year, monthIndex, 1).getDay();
  const count = new Date(year, monthIndex + 1, 0).getDate();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const buttonStyle = { border: 0, borderRadius: 8, minHeight: 40, background: theme.colors.input, color: theme.colors.text, cursor: 'pointer', font: 'inherit' };

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Select birthday" accessibilityState={{ expanded: open }}
        onPress={() => { setMonth(value || new Date(2000, 0, 1)); setMode('days'); setOpen(true); }}
        style={{ minHeight: 50, borderWidth: 1, borderRadius: 8, borderColor: error ? theme.colors.danger : theme.colors.border, backgroundColor: theme.colors.input, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />
        <Text style={{ flex: 1, fontSize: 14, color: theme.colors.text }}>{value ? value.toLocaleDateString('en-US') : 'Select birthday'}</Text>
        <Ionicons name="chevron-down" size={16} color={theme.colors.textMuted} />
      </Pressable>
      <DeviceModal visible={open} onRequestClose={() => setOpen(false)}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', padding: 12, background: 'rgba(0,0,0,.32)' }} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section aria-label="Birthday calendar" style={{ width: '100%', boxSizing: 'border-box', maxHeight: '100%', overflowY: 'auto', padding: 16, borderRadius: 18, background: theme.colors.surface, color: theme.colors.text }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <strong>Select birthday</strong><button aria-label="Close birthday calendar" onClick={() => setOpen(false)} style={{ ...buttonStyle, width: 40 }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <button aria-label="Previous month" disabled={year === 1900 && monthIndex === 0} onClick={() => setMonth(new Date(year, monthIndex - 1, 1))} style={{ ...buttonStyle, width: 32 }}>‹</button>
              <button aria-label="Choose birth month" onClick={() => setMode(mode === 'months' ? 'days' : 'months')} style={{ ...buttonStyle, flex: 1 }}>{months[monthIndex]} ▾</button>
              <button aria-label="Choose birth year" onClick={() => setMode(mode === 'years' ? 'days' : 'years')} style={{ ...buttonStyle, padding: 8 }}>{year} ▾</button>
              <button aria-label="Next month" disabled={year === today.getFullYear() && monthIndex >= today.getMonth()} onClick={() => setMonth(new Date(year, monthIndex + 1, 1))} style={{ ...buttonStyle, width: 32 }}>›</button>
            </div>
            {mode !== 'days' ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
              {(mode === 'months' ? months : Array.from({ length: today.getFullYear() - 1899 }, (_, i) => today.getFullYear() - i)).map((item, index) => <button key={item} style={buttonStyle} onClick={() => {
                setMonth(new Date(mode === 'years' ? item : year, mode === 'months' ? index : monthIndex, 1)); setMode('days');
              }}>{item}</button>)}
            </div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 3 }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day} style={{ textAlign: 'center', fontSize: 12, paddingBottom: 8 }}>{day}</span>)}
              {Array.from({ length: start }, (_, index) => <span key={`blank-${index}`} />)}
              {Array.from({ length: count }, (_, index) => {
                const date = new Date(year, monthIndex, index + 1);
                const selected = dateValue(value) === dateValue(date);
                return <button key={index} aria-label={date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} aria-pressed={selected} disabled={date > today}
                  onClick={() => { onChange(date); setOpen(false); }}
                  style={{ ...buttonStyle, background: selected ? theme.colors.primary : theme.colors.input, color: selected ? '#fff' : theme.colors.text, opacity: date > today ? .35 : 1 }}>{index + 1}</button>;
              })}
            </div>}
          </section>
        </div>
      </DeviceModal>
    </>
  );
}
