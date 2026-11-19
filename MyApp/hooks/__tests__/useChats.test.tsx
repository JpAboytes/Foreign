import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import TestRenderer, { act } from 'react-test-renderer';

const mockReceived: any = jest.fn();
const mockSent: any = jest.fn();
jest.mock('../../services/mentorService', () => ({
  getReceivedChatSessions: (...a: any[]) => mockReceived(...a),
  getSentChatSessions: (...a: any[]) => mockSent(...a),
  getChatMessages: jest.fn(),
  sendChatMessage: jest.fn(),
  startChatSession: jest.fn(),
  markMessagesAsRead: jest.fn(),
}));
jest.mock('../../services/notificationService', () => ({ markChatNotificationsRead: jest.fn() }));

import { useChats } from '../useChats';

function mount() {
  const ref: { current: ReturnType<typeof useChats> | null } = { current: null };
  function Harness() {
    ref.current = useChats('u1', true);
    return null;
  }
  act(() => {
    TestRenderer.create(<Harness />);
  });
  return ref;
}

describe('useChats: error y reintento de sesiones', () => {
  beforeEach(() => {
    mockReceived.mockReset();
    mockSent.mockReset();
  });

  it('expone el error y reload lo limpia al recuperarse', () => {
    const unsubscribe = jest.fn();
    mockReceived.mockImplementation((_id: any, _ok: any, onError: any) => {
      onError(new Error('boom'));
      return unsubscribe;
    });
    const ref = mount();
    expect(ref.current!.loading.sessions).toBe(false);
    expect(ref.current!.error).toBe('No pudimos cargar tus conversaciones.');

    mockReceived.mockImplementation((_id: any, ok: any) => {
      ok([{ id: 's1' }]);
      return unsubscribe;
    });
    act(() => {
      ref.current!.reload();
    });
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(ref.current!.error).toBeNull();
    expect(ref.current!.chatSessions).toHaveLength(1);
  });
});
