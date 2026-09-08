import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { isTravelerAccessRequired, redirectToLogin } from '../utils/guestAccess';

export default function useBookmarkAction() {
  const navigation = useNavigation();
  const { isGuestMode, firebaseUser, authReady, toggleBookmark } = useApp();
  return (id) => {
    if (isTravelerAccessRequired({ isGuestMode, firebaseUser, authReady })) {
      redirectToLogin(navigation, 'Please log in to save your favorite places.');
      return;
    }
    toggleBookmark(id);
  };
}
