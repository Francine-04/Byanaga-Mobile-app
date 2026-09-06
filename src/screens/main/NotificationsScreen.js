import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { emptyStates } from '../../data/emptyStates';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import CategoryChip from '../../components/CategoryChip';
import EmptyState from '../../components/EmptyState';
import Screen from '../../components/Screen';

const categories = [
  { label: 'All', match: 'All' },
  { label: 'Reminders', match: 'Travel Reminders' },
  { label: 'Updates', match: 'System Updates' },
  { label: 'Offers', match: 'Promotions' },
];

export default function NotificationsScreen({ navigation }) {
  const { theme, visibleNotifications: notifications, markAllNotificationsRead } = useApp();
  const [category, setCategory] = useState(categories[0]);
  const filtered = useMemo(
    () => notifications.filter((notification) => category.match === 'All' || notification.category === category.match),
    [category, notifications]
  );

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader onBack={() => goToDashboard(navigation)} />
      <View style={styles.categories}>
        {categories.map((item) => (
          <CategoryChip key={item.label} label={item.label} selected={category.label === item.label} onPress={() => setCategory(item)} />
        ))}
      </View>
      {filtered.length ? (
        filtered.map((notification) => (
          <AppCard key={notification.id} style={styles.notification}>
            <View style={[styles.iconWrap, { backgroundColor: getNotificationColor(theme, notification.category) }]}>
              <Ionicons
                name={getNotificationIcon(notification.category)}
                size={17}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.notificationBody}>
              <View style={styles.notificationHeader}>
                <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>{notification.title}</Text>
                <Text style={[styles.time, { color: theme.colors.textMuted }]}>{notification.time}</Text>
              </View>
              <Text style={[styles.message, { color: theme.colors.textMuted }]}>{notification.message}</Text>
            </View>
          </AppCard>
        ))
      ) : (
        <EmptyState
          title={emptyStates.notifications.title}
          description={emptyStates.notifications.description}
          illustrationLabel={emptyStates.notifications.illustrationLabel}
        />
      )}
      <AppButton title="Mark all as read" variant="ghost" onPress={markAllNotificationsRead} style={styles.markButton} />
    </Screen>
  );
}

function getNotificationIcon(category) {
  if (category === 'Events') return 'calendar-outline';
  if (category === 'Weather') return 'partly-sunny-outline';
  if (category === 'System Updates') return 'cloud-upload-outline';
  if (category === 'Promotions') return 'pricetag-outline';
  if (category === 'Travel Reminders') return 'briefcase-outline';
  return 'notifications-outline';
}

function getNotificationColor(theme, category) {
  if (category === 'Events') return theme.colors.danger;
  if (category === 'Promotions') return theme.colors.accent;
  if (category === 'Travel Reminders') return theme.colors.primary;
  return theme.colors.secondary;
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 10,
  },
  categories: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  notification: {
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBody: {
    flex: 1,
    marginLeft: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
  },
  time: {
    fontSize: 10,
    fontWeight: '800',
  },
  message: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  markButton: {
    alignSelf: 'center',
    marginTop: 16,
    minHeight: 44,
  },
});
