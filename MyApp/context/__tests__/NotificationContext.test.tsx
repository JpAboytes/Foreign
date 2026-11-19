import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import TestRenderer, { act } from 'react-test-renderer';

const mockGet: any = jest.fn();
let authCb: any;

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../../services/auth', () => ({
  subscribeToAuthChanges: (cb: any) => {
    authCb = cb;
    return () => {};
  },
}));
jest.mock('../../services/pushService', () => ({
  configureForegroundHandler: jest.fn(),
  getInitialPushRoute: () => Promise.resolve(null),
  registerForPushNotifications: () => Promise.resolve(),
  subscribeToPushEvents: () => () => {},
}));
jest.mock('../../services/notificationService', () => ({
  getNotifications: (...a: any[]) => mockGet(...a),
  createNotification: jest.fn(),
  markAllNotificationsRead: jest.fn(),
  markNotificationRead: jest.fn(),
  subscribeToNotifications: () => () => {},
}));

import { NotificationProvider, useNotifications } from '../NotificationContext';

async function mount() {
  const ref: { current: ReturnType<typeof useNotifications> | null } = { current: null };
  function Harness() {
    ref.current = useNotifications();
    return null;
  }
  await act(async () => {
    TestRenderer.create(
      <NotificationProvider>
        <Harness />
      </NotificationProvider>
    );
  });
  await act(async () => {
    authCb({ id: 'u1' });
  });
  return ref;
}

describe('NotificationContext: error y reintento', () => {
  beforeEach(() => {
    mockGet.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('expone el error y reload lo limpia al recuperarse', async () => {
    mockGet.mockRejectedValueOnce(new Error('boom'));
    const ref = await mount();
    expect(ref.current!.loading).toBe(false);
    expect(ref.current!.error).toBe('No pudimos cargar tus notificaciones.');

    mockGet.mockResolvedValue([
      { id: 'n1', type: 'post_like', contentId: 'p1', fromUserId: 'x', fromUserName: 'Ana', read: false, timestamp: 1 },
    ]);
    await act(async () => {
      await ref.current!.reload();
    });
    expect(ref.current!.error).toBeNull();
    expect(ref.current!.notifications).toHaveLength(1);
  });
});
