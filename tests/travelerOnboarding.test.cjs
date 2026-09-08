const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/load.cjs');
const { travelerOnboardingStep } = createLoader()('src/utils/travelerOnboarding.js');
const preferences = { places: ['Churches'], activities: ['Walking'], travelStyle: 'Solo', budget: 'Moderate', duration: 'One Day' };
test('first-time and interrupted onboarding resumes the correct step from backend progress', () => {
  assert.equal(travelerOnboardingStep(null), 'preferences');
  assert.equal(travelerOnboardingStep({ preferences }), 'location');
  assert.equal(travelerOnboardingStep({ preferences, onboardingCompletedAt: 123 }), 'complete');
  assert.equal(travelerOnboardingStep({ preferences: {}, onboardingCompletedAt: 123 }), 'preferences');
});
