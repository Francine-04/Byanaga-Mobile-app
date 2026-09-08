import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import PlaceholderImage from './PlaceholderImage';
import { validatePhotoMetadata } from '../utils/profilePhotoValidation';

export default function ProfilePortrait({ navigation, profile, onPhotoSelected, disabled = false, editable = true }) {
  const { theme, firebaseUser, isGuestMode, setIsGuestMode, setIsLoggedIn } = useApp();
  const [selecting, setSelecting] = useState(null);
  const [error, setError] = useState('');
  const guest = isGuestMode || !firebaseUser || firebaseUser.isAnonymous;
  const choose = async (field) => {
    if (!editable || disabled || selecting) return;
    if (guest) {
      setIsGuestMode(false);
      setIsLoggedIn(false);
      (navigation.getParent() || navigation).reset({ index: 0, routes: [{ name: 'Auth', params: { screen: 'Login', params: { message: 'Log in to add your profile photos.' } } }] });
      return;
    }
    setError('');
    setSelecting(field);
    try {
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.8 });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) throw new Error('The selected photo could not be read. Please choose it again.');
      validatePhotoMetadata(asset);
      onPhotoSelected?.(field, asset);
    } catch (cause) {
      setError(cause?.message || 'Unable to upload your photo. Please try again.');
    } finally {
      setSelecting(null);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.portrait}>
        <PlaceholderImage label="Profile background" image={guest ? null : profile.coverImage} aspectRatio={2.9} showIcon={false} style={{ backgroundColor: theme.colors.primarySoft }} />
        {editable ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Change background photo" disabled={disabled || !!selecting} onPress={() => choose('coverImage')} style={[styles.control, styles.coverButton, { backgroundColor: theme.colors.surface }]}>
            {selecting === 'coverImage' ? <ActivityIndicator color={theme.colors.primary} /> : <Ionicons name="camera-outline" size={22} color={theme.colors.primary} />}
          </Pressable>
        ) : null}
        <View style={styles.avatarWrap}>
          <PlaceholderImage label="Profile photo" image={guest ? null : profile.image} icon="person" iconSize={52} aspectRatio={1} style={[styles.avatar, { borderColor: theme.colors.background }]} />
          {editable ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" disabled={disabled || !!selecting} onPress={() => choose('image')} style={[styles.control, styles.avatarButton, { backgroundColor: theme.colors.surface }]}>
              {selecting === 'image' ? <ActivityIndicator color={theme.colors.primary} /> : <Ionicons name="camera" size={20} color={theme.colors.primary} />}
            </Pressable>
          ) : null}
        </View>
      </View>
      {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger, marginBottom: 12 }}>{error}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { marginTop: 4 }, portrait: { marginBottom: 54, alignItems: 'center' },
  control: { minWidth: 44, minHeight: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', position: 'absolute' },
  coverButton: { right: 8, top: 8 }, avatarWrap: { position: 'absolute', bottom: -36, width: 104, height: 104 },
  avatar: { width: 104, borderRadius: 52, borderWidth: 4 }, avatarButton: { right: -8, bottom: -4 },
});
