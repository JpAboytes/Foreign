import * as Sentry from '@sentry/react-native';

/**
 * Monitoreo de errores (Sentry). Único módulo que importa el SDK: las pantallas y hooks usan
 * `captureError`. Sin `EXPO_PUBLIC_SENTRY_DSN` todo es no-op (la app funciona sin cuenta de Sentry).
 */

const getDsn = (): string | undefined => process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() || undefined;

let initialized = false;

export function initMonitoring(): void {
  const dsn = getDsn();
  if (!dsn || initialized) return;
  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_APP_ENV || (__DEV__ ? 'development' : 'production'),
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    // En desarrollo solo se activa si hay DSN (ya validado arriba).
    enabled: true,
  });
  initialized = true;
}

/** Reporta un error; no hace nada si el monitoreo no está inicializado (sin DSN). */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!getDsn()) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

/** Envuelve el componente raíz con Sentry; sin DSN devuelve el componente tal cual. */
export function wrapRoot<T extends React.ComponentType<any>>(component: T): T {
  if (!getDsn()) return component;
  return Sentry.wrap(component) as unknown as T;
}
