import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockInsert = jest.fn<(...a: any[]) => Promise<any>>();
const mockUpdate = jest.fn();
const mockEqCalls: any[][] = [];
const mockOn = jest.fn();
const mockSubscribe = jest.fn();
const mockChannel = jest.fn();
const mockRemoveChannel = jest.fn();
let mockSelectResult: { data: any; error: any } = { data: [], error: null };
let mockUpdateResult: { error: any } = { error: null };

jest.mock('../supabase/client', () => {
  const updateChain: any = {
    eq: (...a: any[]) => {
      mockEqCalls.push(a);
      return updateChain;
    },
    then: (res: any, rej: any) => Promise.resolve(mockUpdateResult).then(res, rej),
  };
  const selectChain: any = {
    eq: () => selectChain,
    order: () => selectChain,
    limit: () => selectChain,
    then: (res: any, rej: any) => Promise.resolve(mockSelectResult).then(res, rej),
  };
  return {
    supabase: {
      from: () => ({
        insert: (...a: any[]) => mockInsert(...a),
        select: () => selectChain,
        update: (...a: any[]) => {
          mockUpdate(...a);
          return updateChain;
        },
      }),
      channel: (...a: any[]) => {
        mockChannel(...a);
        const ch: any = {
          on: (...b: any[]) => {
            mockOn(...b);
            return ch;
          },
          subscribe: () => {
            mockSubscribe();
            return ch;
          },
        };
        return ch;
      },
      removeChannel: (...a: any[]) => mockRemoveChannel(...a),
    },
  };
});

import {
  createNotification,
  getNotifications,
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  markChatNotificationsRead,
} from '../notificationService';

beforeEach(() => {
  jest.clearAllMocks();
  mockEqCalls.length = 0;
  jest.spyOn(console, 'error').mockImplementation(() => {});
  mockSelectResult = { data: [], error: null };
  mockUpdateResult = { error: null };
  mockInsert.mockResolvedValue({ error: null });
});

describe('notificationService', () => {
  it('createNotification inserta con columnas de Supabase', async () => {
    const ok = await createNotification({
      type: 'raite_request',
      fromUserId: 'u1',
      toUserId: 'u2',
      contentId: 'u1',
      contentText: 'hola',
    });
    expect(ok).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'u2',
      from_user_id: 'u1',
      type: 'raite_request',
      content_id: 'u1',
      content_text: 'hola',
      related_content_id: null,
    });
  });

  it('createNotification no notifica a uno mismo ni con datos incompletos', async () => {
    expect(await createNotification({ type: 'x', fromUserId: 'u1', toUserId: 'u1', contentId: 'c' })).toBe(false);
    expect(await createNotification({ type: 'x', fromUserId: 'u1', toUserId: 'u2', contentId: '' })).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('createNotification devuelve false si Supabase falla', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'boom' } });
    expect(await createNotification({ type: 'x', fromUserId: 'u1', toUserId: 'u2', contentId: 'c' })).toBe(false);
  });

  it('getNotifications mapea filas a Notification', async () => {
    mockSelectResult = {
      data: [
        {
          id: 'n1',
          user_id: 'u2',
          from_user_id: 'u1',
          type: 'post_like',
          content_id: 'p1',
          content_text: '',
          related_content_id: null,
          read: false,
          created_at: '2026-10-24T00:00:00Z',
          sender: { name: 'Ana', photo_url: 'http://img/a.jpg' },
        },
      ],
      error: null,
    };
    const [n] = await getNotifications('u2');
    expect(n).toMatchObject({
      id: 'n1',
      type: 'post_like',
      fromUserId: 'u1',
      fromUserName: 'Ana',
      fromUserPhoto: 'http://img/a.jpg',
      toUserId: 'u2',
      contentId: 'p1',
      read: false,
      timestamp: new Date('2026-10-24T00:00:00Z').getTime(),
    });
  });

  it('getNotifications propaga errores', async () => {
    mockSelectResult = { data: null, error: { message: 'x' } };
    await expect(getNotifications('u2')).rejects.toEqual({ message: 'x' });
  });

  it('subscribeToNotifications filtra por usuario y cierra el canal al limpiar', () => {
    const onChange = jest.fn();
    const cleanup = subscribeToNotifications('u2', onChange);
    expect(mockChannel).toHaveBeenCalledWith('notifications:u2');
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ table: 'notifications', filter: 'user_id=eq.u2' }),
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalled();
    (mockOn.mock.calls[0][2] as () => void)();
    expect(onChange).toHaveBeenCalled();
    expect(mockRemoveChannel).not.toHaveBeenCalled();
    cleanup();
    expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
  });

  it('markNotificationRead y markAllNotificationsRead actualizan read', async () => {
    await markNotificationRead('n1');
    expect(mockUpdate).toHaveBeenCalledWith({ read: true });
    expect(mockEqCalls).toContainEqual(['id', 'n1']);

    mockEqCalls.length = 0;
    await markAllNotificationsRead('u2');
    expect(mockEqCalls).toEqual([
      ['user_id', 'u2'],
      ['read', false],
    ]);
  });

  it('markChatNotificationsRead limita a la sesión', async () => {
    await markChatNotificationsRead('u2', 's1');
    expect(mockEqCalls).toContainEqual(['type', 'chat_message']);
    expect(mockEqCalls).toContainEqual(['content_id', 's1']);
  });

  it('markNotificationRead lanza si falla', async () => {
    mockUpdateResult = { error: { message: 'x' } };
    await expect(markNotificationRead('n1')).rejects.toEqual({ message: 'x' });
  });
});
