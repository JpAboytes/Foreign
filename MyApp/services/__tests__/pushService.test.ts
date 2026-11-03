import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockUpsert = jest.fn<(...a: any[]) => Promise<any>>();
const mockDeleteEq = jest.fn<(...a: any[]) => Promise<any>>();
const mockGetPerms = jest.fn<(...a: any[]) => Promise<any>>();
const mockRequestPerms = jest.fn<(...a: any[]) => Promise<any>>();
const mockGetToken = jest.fn<(...a: any[]) => Promise<any>>();
const mockConstants: { expoConfig: any } = { expoConfig: { extra: { eas: { projectId: 'proj-123' } } } };
const mockDevice = { isDevice: true };

jest.mock('../supabase/client', () => ({
  supabase: {
    from: () => ({
      upsert: (...a: any[]) => mockUpsert(...a),
      delete: () => ({ eq: (...a: any[]) => mockDeleteEq(...a) }),
    }),
  },
}));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: (...a: any[]) => mockGetPerms(...a),
  requestPermissionsAsync: (...a: any[]) => mockRequestPerms(...a),
  getExpoPushTokenAsync: (...a: any[]) => mockGetToken(...a),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(async () => null),
}));
jest.mock('expo-device', () => ({
  get isDevice() {
    return mockDevice.isDevice;
  },
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return mockConstants.expoConfig;
    },
  },
}));

import {
  getExpoPushToken,
  registerForPushNotifications,
  unregisterPushToken,
  getRouteForPushData,
} from '../pushService';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  mockDevice.isDevice = true;
  mockConstants.expoConfig = { extra: { eas: { projectId: 'proj-123' } } };
  mockGetPerms.mockResolvedValue({ status: 'granted' });
  mockGetToken.mockResolvedValue({ data: 'ExponentPushToken[abc]' });
  mockUpsert.mockResolvedValue({ error: null });
  mockDeleteEq.mockResolvedValue({ error: null });
});

describe('getExpoPushToken', () => {
  it('devuelve el token usando el projectId de la configuración', async () => {
    expect(await getExpoPushToken()).toBe('ExponentPushToken[abc]');
    expect(mockGetToken).toHaveBeenCalledWith({ projectId: 'proj-123' });
    expect(mockRequestPerms).not.toHaveBeenCalled();
  });

  it('pide permiso si aún no está concedido', async () => {
    mockGetPerms.mockResolvedValue({ status: 'undetermined' });
    mockRequestPerms.mockResolvedValue({ status: 'granted' });
    expect(await getExpoPushToken()).toBe('ExponentPushToken[abc]');
    expect(mockRequestPerms).toHaveBeenCalled();
  });

  it('devuelve null si el usuario niega el permiso', async () => {
    mockGetPerms.mockResolvedValue({ status: 'undetermined' });
    mockRequestPerms.mockResolvedValue({ status: 'denied' });
    expect(await getExpoPushToken()).toBeNull();
    expect(mockGetToken).not.toHaveBeenCalled();
  });

  it('devuelve null sin fallar si falta el projectId', async () => {
    mockConstants.expoConfig = { extra: {} };
    expect(await getExpoPushToken()).toBeNull();
    expect(mockGetToken).not.toHaveBeenCalled();
  });

  it('devuelve null en un simulador', async () => {
    mockDevice.isDevice = false;
    expect(await getExpoPushToken()).toBeNull();
  });

  it('devuelve null si getExpoPushTokenAsync lanza', async () => {
    mockGetToken.mockRejectedValue(new Error('boom'));
    expect(await getExpoPushToken()).toBeNull();
  });
});

describe('registerForPushNotifications', () => {
  it('hace upsert del token por token', async () => {
    const token = await registerForPushNotifications('user-1');
    expect(token).toBe('ExponentPushToken[abc]');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'ExponentPushToken[abc]', user_id: 'user-1', platform: expect.any(String) }),
      { onConflict: 'token' }
    );
  });

  it('devuelve null si Supabase responde con error', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'rls' } });
    expect(await registerForPushNotifications('user-1')).toBeNull();
  });

  it('no consulta nada sin token', async () => {
    mockGetPerms.mockResolvedValue({ status: 'denied' });
    mockRequestPerms.mockResolvedValue({ status: 'denied' });
    expect(await registerForPushNotifications('user-1')).toBeNull();
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

describe('unregisterPushToken', () => {
  it('borra el token registrado en este dispositivo', async () => {
    await registerForPushNotifications('user-1');
    await unregisterPushToken();
    expect(mockDeleteEq).toHaveBeenCalledWith('token', 'ExponentPushToken[abc]');
    mockDeleteEq.mockClear();
    await unregisterPushToken(); // ya borrado: no hace nada
    expect(mockDeleteEq).not.toHaveBeenCalled();
  });
});

describe('getRouteForPushData', () => {
  it('chat_message abre el chat con el remitente', () => {
    expect(getRouteForPushData({ type: 'chat_message', from_user_id: 'u2', content_id: 's1' })).toEqual({
      pathname: '/extra/chat',
      params: { friendId: 'u2' },
    });
  });
  it('forum_answer_like abre la pregunta relacionada', () => {
    expect(
      getRouteForPushData({ type: 'forum_answer_like', content_id: 'a1', related_content_id: 'q1' })
    ).toEqual({ pathname: '/extra/questionDetail', params: { questionId: 'q1', scrollToAnswerId: 'a1' } });
  });
  it('friend_request va a notificaciones y sin tipo no navega', () => {
    expect(getRouteForPushData({ type: 'friend_request' })).toEqual({ pathname: '/extra/notifications' });
    expect(getRouteForPushData({})).toBeNull();
    expect(getRouteForPushData(null)).toBeNull();
  });
});
