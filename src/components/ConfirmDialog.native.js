import { Alert } from 'react-native';

// For native platforms, we use the built-in Alert
export default {
  show: (title, message, buttons) => {
    Alert.alert(title, message, buttons);
  },
};
