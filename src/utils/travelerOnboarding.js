import { validatePreferenceForm } from './authValidation';

export function travelerOnboardingStep(record) {
  if (validatePreferenceForm(record?.preferences).length) return 'preferences';
  return record?.onboardingCompletedAt ? 'complete' : 'location';
}
