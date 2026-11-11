// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { UserProvider } from '../context/UserContext';
import { NotificationProvider } from '../context/NotificationContext';
import { RaiteProvider } from '../context/RaiteContext';
import ErrorState from '../components/common/ErrorState';
import { initMonitoring, captureError, wrapRoot } from '../services/monitoring';

initMonitoring();

/** Error boundary de expo-router: reporta el error y ofrece reintentar. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  useEffect(() => {
    captureError(error, { source: 'root-error-boundary' });
  }, [error]);
  return <ErrorState message="Algo salió mal. Intenta de nuevo." onRetry={retry} />;
}

function RootLayout() {
  return (
    <NotificationProvider>
      <UserProvider>
        <RaiteProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" options={{ gestureEnabled: false }} />
            <Stack.Screen name="(drawer)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            <Stack.Screen name="index" options={{ gestureEnabled: false }} />
          </Stack>
        </RaiteProvider>
      </UserProvider>
    </NotificationProvider>
  );
}

export default wrapRoot(RootLayout);
