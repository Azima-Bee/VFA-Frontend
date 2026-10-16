import { Alert, Platform } from 'react-native';

/**
 * Universal cross-platform confirmation dialog helper.
 * 
 * On React Native Web (Vercel deployment), Alert.alert is a no-op dummy function
 * that fails to execute callbacks. This helper guarantees that confirmation
 * actions (approve, reject, suspend) execute reliably on both Web and Mobile.
 */
export const showConfirmDialog = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (Platform.OS === 'web') {
    const fullPrompt = [title, message].filter(Boolean).join('\n\n');
    const confirmed = typeof window !== 'undefined' ? window.confirm(fullPrompt) : true;
    if (confirmed) {
      if (typeof onConfirm === 'function') onConfirm();
    } else {
      if (typeof onCancel === 'function') onCancel();
    }
  } else {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText,
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: confirmText,
          style: isDestructive ? 'destructive' : 'default',
          onPress: onConfirm,
        },
      ],
      { cancelable: true }
    );
  }
};

/**
 * Universal cross-platform info/alert message helper.
 */
export const showMessageAlert = (title, message, onDismiss) => {
  if (Platform.OS === 'web') {
    const fullPrompt = [title, message].filter(Boolean).join('\n\n');
    if (typeof window !== 'undefined') {
      window.alert(fullPrompt);
    }
    if (typeof onDismiss === 'function') onDismiss();
  } else {
    Alert.alert(
      title,
      message,
      [{ text: 'OK', onPress: onDismiss }],
      { cancelable: true }
    );
  }
};
