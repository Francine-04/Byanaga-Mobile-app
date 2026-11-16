import { useState } from 'react';
import { Platform, Alert } from 'react-native';

export function useConfirm() {
  const [dialogState, setDialogState] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const confirm = (title, message, buttons) => {
    if (Platform.OS === 'web') {
      setDialogState({
        visible: true,
        title,
        message,
        buttons,
      });
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const closeDialog = () => {
    setDialogState({
      visible: false,
      title: '',
      message: '',
      buttons: [],
    });
  };

  return { confirm, dialogState, closeDialog };
}
