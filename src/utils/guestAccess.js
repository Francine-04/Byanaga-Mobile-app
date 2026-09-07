export const ITINERARY_LOGIN_MESSAGE = 'Log in to create, save, or edit an itinerary.';

export function isTravelerAccessRequired({ isGuestMode, firebaseUser, authReady = true }) {
  return Boolean(isGuestMode || (authReady && (!firebaseUser || firebaseUser.isAnonymous)));
}

export function redirectToLogin(navigation, message = ITINERARY_LOGIN_MESSAGE) {
  let current = navigation;

  while (current) {
    const routeNames = current.getState?.()?.routeNames || [];
    if (routeNames.includes('Auth')) {
      current.reset({
        index: 0,
        routes: [{ name: 'Auth', params: { screen: 'Login', params: { message } } }],
      });
      return;
    }
    current = current.getParent?.();
  }

  navigation.navigate('Auth', { screen: 'Login', params: { message } });
}
