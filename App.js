import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import WebDeviceFrame from './src/components/WebDeviceFrame';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

function AppShell() {
  const { theme } = useApp();

  return (
    <>
      <WebDeviceFrame>
        <SafeAreaProvider>
          <RootNavigator />
        </SafeAreaProvider>
      </WebDeviceFrame>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
    </>
  );
}
