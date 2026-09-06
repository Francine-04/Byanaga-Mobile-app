import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { nationalityOptions } from '../../data/nationalities';
import AppHeader from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import Screen from '../../components/Screen';
import SelectField from '../../components/SelectField';
import StepProgress from '../../components/StepProgress';
import { normalizeEmail, passwordRuleText, sanitizeAgeInput, validateRegistrationProfile } from '../../utils/authValidation';

const genderOptions = ['MALE', 'FEMALE'];

export default function RegisterStep1Screen({ navigation }) {
  const { theme } = useApp();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    nationality: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const update = (field, value) => {
    const nextValue = field === 'age' ? sanitizeAgeInput(value) : value;
    setForm((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setFormError('');
  };

  const handleContinue = () => {
    const nextErrors = validateRegistrationProfile(form);

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setFormError('Please fill up all required fields correctly before continuing.');
      return;
    }

    setErrors({});
    setFormError('');
    navigation.navigate('RegisterStep2', {
      registration: {
        ...form,
        age: sanitizeAgeInput(form.age),
        email: normalizeEmail(form.email),
      },
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <Screen contentStyle={styles.content}>
        <AppHeader onBack={() => navigation.goBack()} />
        <Text style={[styles.title, { color: theme.colors.text }]}>Create Your Account</Text>
        <Text style={[styles.step, { color: theme.colors.text }]}>Step 1 of 2</Text>
        <StepProgress progress={0.46} style={styles.progress} />
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
            <Ionicons name="person" size={34} color={theme.colors.textSoft} />
          </View>
          <View style={[styles.cameraBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]}>
            <Ionicons name="camera" size={18} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.row}>
          <AppTextInput
            label="First Name"
            value={form.firstName}
            onChangeText={(value) => update('firstName', value)}
            placeholder="Enter first name"
            autoComplete="given-name"
            textContentType="givenName"
            error={errors.firstName}
            style={styles.half}
          />
          <AppTextInput
            label="Last Name"
            value={form.lastName}
            onChangeText={(value) => update('lastName', value)}
            placeholder="Enter last name"
            autoComplete="family-name"
            textContentType="familyName"
            error={errors.lastName}
            style={styles.half}
          />
        </View>
        <View style={styles.row}>
          <AppTextInput
            label="Age"
            value={form.age}
            onChangeText={(value) => update('age', value)}
            placeholder="Enter age"
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={3}
            error={errors.age}
            style={styles.half}
          />
          <SelectField
            label="Gender"
            value={form.gender}
            options={genderOptions}
            onSelect={(value) => update('gender', value)}
            placeholder="Select gender"
            error={errors.gender}
            style={styles.half}
          />
        </View>
        <SelectField
          label="Nationality"
          value={form.nationality}
          options={nationalityOptions}
          onSelect={(value) => update('nationality', value)}
          placeholder="Select nationality"
          searchable
          searchPlaceholder="Search nationality..."
          error={errors.nationality}
        />
        <AppTextInput
          label="Gmail Address"
          value={form.email}
          onChangeText={(value) => update('email', normalizeEmail(value))}
          placeholder="name@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          rightIcon="mail-outline"
          error={errors.email}
        />
        <AppTextInput
          label="Password"
          value={form.password}
          onChangeText={(value) => update('password', value)}
          placeholder="Enter password"
          secureTextEntry={!passwordVisible}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={15}
          textContentType="newPassword"
          rightIcon={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
          rightIconLabel={passwordVisible ? 'Hide password' : 'Show password'}
          onRightIconPress={() => setPasswordVisible((value) => !value)}
          error={errors.password}
        />
        <Text style={[styles.helpText, { color: theme.colors.textMuted }]}>{passwordRuleText}</Text>
        <AppTextInput
          label="Confirm Password"
          value={form.confirmPassword}
          onChangeText={(value) => update('confirmPassword', value)}
          placeholder="Confirm password"
          secureTextEntry={!confirmVisible}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={15}
          textContentType="newPassword"
          rightIcon={confirmVisible ? 'eye-off-outline' : 'eye-outline'}
          rightIconLabel={confirmVisible ? 'Hide confirm password' : 'Show confirm password'}
          onRightIconPress={() => setConfirmVisible((value) => !value)}
          error={errors.confirmPassword}
        />
        {formError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.danger }]}>{formError}</Text> : null}
        <AppButton title="Continue" onPress={handleContinue} style={styles.button} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: 30,
  },
  step: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '900',
  },
  progress: {
    marginTop: 14,
    marginBottom: 22,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 3,
    bottom: 1,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  helpText: {
    marginTop: -10,
    marginBottom: 14,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  error: {
    marginBottom: 12,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  button: {
    marginTop: 4,
  },
});
