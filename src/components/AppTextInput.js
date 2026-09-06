import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function AppTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  leftIcon,
  rightIcon,
  rightIconLabel,
  onRightIconPress,
  multiline,
  style,
  error,
  ...inputProps
}) {
  const { theme } = useApp();

  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text> : null}
      <View style={[styles.inputWrap, { backgroundColor: theme.colors.input, borderColor: error ? theme.colors.danger : theme.colors.border }]}>
        {leftIcon ? <Ionicons name={leftIcon} size={19} color={theme.colors.textMuted} style={styles.leftIcon} /> : null}
        <TextInput
          {...inputProps}
          accessibilityLabel={inputProps.accessibilityLabel || label || placeholder}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSoft}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[
            styles.input,
            {
              minHeight: multiline ? 80 : 46,
              color: theme.colors.text,
              fontFamily: theme.typography.fonts.body,
              textAlignVertical: multiline ? 'top' : 'center',
            },
          ]}
        />
        {rightIcon ? (
          onRightIconPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={rightIconLabel || 'Toggle input option'}
              onPress={onRightIconPress}
              hitSlop={8}
              style={styles.rightIconButton}
            >
              <Ionicons name={rightIcon} size={19} color={theme.colors.textMuted} />
            </Pressable>
          ) : (
            <Ionicons name={rightIcon} size={18} color={theme.colors.textMuted} />
          )
        ) : null}
      </View>
      {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrap: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    paddingVertical: 12,
  },
  error: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  leftIcon: {
    marginRight: 10,
  },
  rightIconButton: {
    width: 44,
    height: 44,
    marginRight: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
