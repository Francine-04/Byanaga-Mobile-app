import React, { useMemo } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import useBookmarkAction from '../../hooks/useBookmarkAction';
import { formatPublishedDate } from '../../utils/establishmentContent';
import AppCard from '../../components/AppCard';
import AppHeader, { goToDashboard } from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import PlaceholderImage from '../../components/PlaceholderImage';
import Screen from '../../components/Screen';
import SectionHeader from '../../components/SectionHeader';
import VoucherCard from '../../components/VoucherCard';

export default function EstablishmentDetailsScreen({ navigation, route }) {
  const { theme, establishments, bookmarks, backendErrors } = useApp();
  const toggleBookmark = useBookmarkAction();
  const requestedId = route.params?.establishmentId || route.params?.establishment?.dashboardId;
  const establishment = useMemo(
    () => establishments.find((item) => item.dashboardId === requestedId || item.id === requestedId) || route.params?.establishment,
    [establishments, requestedId, route.params?.establishment]
  );
  const saved = establishment ? bookmarks.includes(establishment.id) : false;

  if (!establishment) {
    return (
      <Screen contentStyle={styles.content}>
        <AppHeader onBack={() => goToDashboard(navigation)} />
        <EmptyState icon="storefront-outline" title="Establishment unavailable" description="This profile may still be awaiting approval or could not be loaded." />
      </Screen>
    );
  }

  const openLink = async (value, kind) => {
    const target = kind === 'phone' ? `tel:${String(value).replace(/[^+\d]/g, '')}` : normalizeWebsite(value);
    try {
      if (!target || !(await Linking.canOpenURL(target))) throw new Error();
      await Linking.openURL(target);
    } catch {
      Alert.alert('Unable to Open', kind === 'phone' ? 'This contact number is not available on this device.' : 'This website address could not be opened.');
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader centered title="Establishment" onBack={() => goToDashboard(navigation)} backLabel="Back to dashboard" />
      <PlaceholderImage image={establishment.image} label={`${establishment.name} main photo`} aspectRatio={1.58} style={styles.hero} />
      <View style={styles.identity}>
        <View style={[styles.category, { backgroundColor: theme.colors.primarySoft }]}>
          <Text style={[styles.categoryText, { color: theme.colors.primary }]}>{establishment.categoryLabel}</Text>
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>{establishment.name}</Text>
        <DetailLine icon="location-outline" text={establishment.address} />
        <DetailLine icon="time-outline" text={establishment.isOpen ? 'Currently marked open' : 'Currently marked closed'} />
        {establishment.description ? <Text style={[styles.description, { color: theme.colors.textMuted }]}>{establishment.description}</Text> : null}
      </View>

      <View style={styles.actions}>
        <Action icon={saved ? 'bookmark' : 'bookmark-outline'} label="Save" onPress={() => toggleBookmark(establishment.id)} />
        {establishment.website ? <Action icon="globe-outline" label="Website" onPress={() => openLink(establishment.website, 'website')} /> : null}
        {establishment.contact && establishment.contact !== 'Not connected' ? <Action icon="call-outline" label="Call" onPress={() => openLink(establishment.contact, 'phone')} /> : null}
        {establishment.email ? <Action icon="mail-outline" label="Email" onPress={() => openLink(`mailto:${establishment.email}`, 'website')} /> : null}
      </View>

      {establishment.vouchers?.length ? (
        <>
          <SectionHeader title="Available Offers" onPress={() => navigation.navigate('Offers')} />
          {establishment.vouchers.map((voucher) => <VoucherCard key={voucher.id} voucher={voucher} />)}
        </>
      ) : null}

      {establishment.posts?.length ? (
        <>
          <SectionHeader title="Latest Updates" />
          {establishment.posts.map((post) => (
            <AppCard key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={[styles.postIcon, { backgroundColor: theme.colors.secondarySoft }]}>
                  <Ionicons name="megaphone-outline" size={17} color={theme.colors.secondary} />
                </View>
                <View style={styles.postHeading}>
                  <Text style={[styles.postCategory, { color: theme.colors.text }]}>{post.category}</Text>
                  <Text style={[styles.postDate, { color: theme.colors.textMuted }]}>{formatPublishedDate(post.updatedAt || post.createdAt)}</Text>
                </View>
              </View>
              {post.caption ? <Text style={[styles.postCaption, { color: theme.colors.textMuted }]}>{post.caption}</Text> : null}
              {post.imageUrls?.[0] ? <PlaceholderImage image={post.imageUrls[0]} label={`${establishment.name} update photo`} aspectRatio={1.55} style={styles.postImage} /> : null}
            </AppCard>
          ))}
        </>
      ) : null}

      {establishment.gallery?.length ? (
        <>
          <SectionHeader title="Gallery" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
            {establishment.gallery.map((photo) => (
              <View key={photo.id} style={styles.galleryItem}>
                <PlaceholderImage image={photo.imageUrl} label={photo.caption || `${establishment.name} gallery photo`} aspectRatio={1.2} style={styles.galleryImage} />
                {photo.caption ? <Text style={[styles.galleryCaption, { color: theme.colors.textMuted }]} numberOfLines={1}>{photo.caption}</Text> : null}
              </View>
            ))}
          </ScrollView>
        </>
      ) : null}

      {establishment.menuItems?.length ? (
        <>
          <SectionHeader title={establishment.category === 'restaurant' ? 'Available Menu' : 'Available Services'} />
          {establishment.menuItems.map((item) => (
            <AppCard key={item.id} style={styles.menuCard}>
              {item.imageUrl ? <PlaceholderImage image={item.imageUrl} label={`${item.name} photo`} aspectRatio={1} style={styles.menuImage} /> : (
                <View style={[styles.menuImage, styles.menuIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
                  <Ionicons name="restaurant-outline" size={22} color={theme.colors.primary} />
                </View>
              )}
              <View style={styles.menuBody}>
                <Text style={[styles.menuCategory, { color: theme.colors.primary }]}>{item.category}</Text>
                <Text style={[styles.menuName, { color: theme.colors.text }]}>{item.name}</Text>
                {item.description ? <Text style={[styles.menuDescription, { color: theme.colors.textMuted }]} numberOfLines={2}>{item.description}</Text> : null}
              </View>
              <Text style={[styles.menuPrice, { color: theme.colors.text }]}>{formatPrice(item.price)}</Text>
            </AppCard>
          ))}
        </>
      ) : null}

      {backendErrors.establishmentPosts || backendErrors.establishmentGallery || backendErrors.establishmentMenu ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.danger }]}>Some establishment content could not be loaded. Please try again.</Text>
      ) : null}
    </Screen>
  );
}

function DetailLine({ icon, text }) {
  const { theme } = useApp();
  if (!text) return null;
  return (
    <View style={styles.detailLine}>
      <Ionicons name={icon} size={16} color={theme.colors.primary} />
      <Text style={[styles.detailText, { color: theme.colors.textMuted }]}>{text}</Text>
    </View>
  );
}

function Action({ icon, label, onPress }) {
  const { theme } = useApp();
  return (
    <AppCard accessibilityLabel={label} onPress={onPress} style={styles.actionCard}>
      <Ionicons name={icon} size={21} color={theme.colors.primary} />
      <Text style={[styles.actionLabel, { color: theme.colors.text }]}>{label}</Text>
    </AppCard>
  );
}

function normalizeWebsite(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^(https?:\/\/|mailto:)/i.test(url)) return url;
  return `https://${url}`;
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 });
}

const styles = StyleSheet.create({
  content: { paddingTop: 10 },
  hero: { borderRadius: 20 },
  identity: { paddingTop: 16 },
  category: { alignSelf: 'flex-start', minHeight: 28, borderRadius: 14, paddingHorizontal: 11, justifyContent: 'center' },
  categoryText: { fontSize: 10, fontWeight: '900' },
  title: { marginTop: 10, fontSize: 24, lineHeight: 31, fontWeight: '900' },
  detailLine: { marginTop: 8, flexDirection: 'row', alignItems: 'flex-start' },
  detailText: { flex: 1, marginLeft: 7, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  description: { marginTop: 14, fontSize: 13, lineHeight: 21, fontWeight: '600' },
  actions: { marginTop: 16, flexDirection: 'row', gap: 10 },
  actionCard: { flex: 1, minHeight: 68, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  actionLabel: { marginTop: 5, fontSize: 10, fontWeight: '900' },
  postCard: { marginBottom: 12, padding: 14, borderRadius: 16 },
  postHeader: { flexDirection: 'row', alignItems: 'center' },
  postIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  postHeading: { flex: 1, marginLeft: 10 },
  postCategory: { fontSize: 13, fontWeight: '900' },
  postDate: { marginTop: 2, fontSize: 10, fontWeight: '700' },
  postCaption: { marginTop: 11, fontSize: 12, lineHeight: 19, fontWeight: '700' },
  postImage: { marginTop: 12, borderRadius: 14 },
  galleryRow: { paddingRight: 6 },
  galleryItem: { width: 190, marginRight: 12 },
  galleryImage: { borderRadius: 14 },
  galleryCaption: { marginTop: 6, fontSize: 10, fontWeight: '700' },
  menuCard: { minHeight: 92, marginBottom: 10, padding: 10, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  menuImage: { width: 72, borderRadius: 12 },
  menuIcon: { aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  menuBody: { flex: 1, minWidth: 0, marginLeft: 11 },
  menuCategory: { fontSize: 9, fontWeight: '900' },
  menuName: { marginTop: 3, fontSize: 13, lineHeight: 18, fontWeight: '900' },
  menuDescription: { marginTop: 3, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  menuPrice: { marginLeft: 8, fontSize: 11, fontWeight: '900' },
  error: { marginTop: 18, fontSize: 12, lineHeight: 18, fontWeight: '700' },
});
