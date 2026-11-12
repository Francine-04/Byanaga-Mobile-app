import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../../context/AppContext';
import { nationalityOptions } from '../../data/nationalities';
import AppHeader from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import Screen from '../../components/Screen';
import SelectField from '../../components/SelectField';
import StepProgress from '../../components/StepProgress';
import { normalizeEmail, passwordRuleText, calculateAge, formatBirthday, validateRegistrationProfile } from '../../utils/authValidation';

const genderOptions = ['MALE', 'FEMALE'];

export default function RegisterStep1Screen({ navigation }) {
  const { theme } = useApp();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    birthday: null,
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
  const [showDatePicker, setShowDatePicker] = useState(false);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setFormError('');
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      update('birthday', selectedDate);
    }
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
        birthday: formatBirthday(form.birthday),
        email: normalizeEmail(form.email),
      },
    });
  };

  const birthdayDisplay = form.birthday 
    ? form.birthday.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const age = form.birthday ? calculateAge(form.birthday) : null;

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
          <View style={styles.half}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Birthday</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select birthday"
              onPress={() => setShowDatePicker(true)}
              style={[styles.dateButton, { backgroundColor: theme.colors.input, borderColor: errors.birthday ? theme.colors.danger : theme.colors.border }]}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.textMuted} />
              <Text style={[styles.dateText, { color: birthdayDisplay ? theme.colors.text : theme.colors.textSoft }]}>
                {birthdayDisplay || 'Select birthday'}
              </Text>
            </Pressable>
            {age !== null && <Text style={[styles.ageHint, { color: theme.colors.textMuted }]}>Age: {age} years old</Text>}
            {errors.birthday ? <Text style={[styles.fieldError, { color: theme.colors.danger }]}>{errors.birthday}</Text> : null}
          </View>
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
        {showDatePicker && (
          <DateTimePicker
            value={form.birthday || new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  dateButton: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  ageHint: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  fieldError: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
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
