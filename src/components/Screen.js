import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

export default function Screen({ children, scroll = true, style, contentStyle, edges = true, footer }) {
  const { theme } = useApp();
  const Container = edges ? SafeAreaView : View;

  if (!scroll) {
    return (
      <Container {...(edges ? { edges: ['top', 'left', 'right', 'bottom'] } : {})} style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
        <View style={[styles.content, contentStyle]}>{children}</View>
        {footer}
      </Container>
    );
  }

  return (
    <Container {...(edges ? { edges: ['top', 'left', 'right', 'bottom'] } : {})} style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scrollContent, contentStyle]}
      >
        {children}
      </ScrollView>
      {footer}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 32,
  },
});
