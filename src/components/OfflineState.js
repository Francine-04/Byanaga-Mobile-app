import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { emptyStates } from '../data/emptyStates';
import EmptyState from './EmptyState';

export default function OfflineState({ onReconnect }) {
  const { theme, retryConnection } = useApp();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const retry = async () => {
    setBusy(true);
    setMessage('');
    try {
      const state = await retryConnection();
      if (state.isConnected && state.isInternetReachable !== false) onReconnect?.();
      else setMessage('Still offline. Please reconnect and try again.');
    } catch { setMessage('Unable to check your connection. Please try again.'); }
    finally { setBusy(false); }
  };
  return (
    <View style={{ flexGrow: 1, justifyContent: 'center' }}>
      <EmptyState {...emptyStates.internet} icon="cloud-offline-outline" busy={busy} onPress={retry} />
      {message ? <Text accessibilityRole="alert" style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 21, textAlign: 'center', marginBottom: 24 }}>{message}</Text> : null}
    </View>
  );
}
