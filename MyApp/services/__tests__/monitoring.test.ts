import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const mockInit = jest.fn();
const mockCapture = jest.fn();
const mockWrap = jest.fn((c: any) => c);

jest.mock('@sentry/react-native', () => ({
  init: (...a: any[]) => mockInit(...a),
  captureException: (...a: any[]) => mockCapture(...a),
  wrap: (c: any) => mockWrap(c),
}));

const load = () => {
  let mod: typeof import('../monitoring');
  jest.isolateModules(() => {
    mod = require('../monitoring');
  });
  return mod!;
};

describe('monitoring', () => {
  const original = { ...process.env };
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    delete process.env.EXPO_PUBLIC_APP_ENV;
  });
  afterEach(() => {
    process.env = { ...original };
  });

  it('sin DSN no inicializa ni reporta ni envuelve', () => {
    const m = load();
    const Root = () => null;
    m.initMonitoring();
    m.captureError(new Error('x'), { a: 1 });
    expect(mockInit).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
    expect(m.wrapRoot(Root)).toBe(Root);
    expect(mockWrap).not.toHaveBeenCalled();
  });

  it('con DSN inicializa sin PII, con muestreo bajo y entorno', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://abc@o0.ingest.sentry.io/1';
    process.env.EXPO_PUBLIC_APP_ENV = 'preview';
    const m = load();
    m.initMonitoring();
    m.initMonitoring();
    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ sendDefaultPii: false, tracesSampleRate: 0.1, environment: 'preview' }),
    );
  });

  it('con DSN reporta errores con contexto y envuelve la raíz', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://abc@o0.ingest.sentry.io/1';
    const m = load();
    const err = new Error('boom');
    m.captureError(err, { screen: 'map' });
    expect(mockCapture).toHaveBeenCalledWith(err, { extra: { screen: 'map' } });
    m.wrapRoot(() => null);
    expect(mockWrap).toHaveBeenCalledTimes(1);
  });
});
