import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import TestRenderer, { act } from 'react-test-renderer';

const mockSubscribe: any = jest.fn();
jest.mock('../../services/chatService', () => ({
  subscribeToDirectConversations: (...a: any[]) => mockSubscribe(...a),
}));

import { useDirectConversations } from '../useDirectConversations';

function mount(userId: string | null = 'u1') {
  const ref: { current: ReturnType<typeof useDirectConversations> | null } = { current: null };
  function Harness() {
    ref.current = useDirectConversations(userId);
    return null;
  }
  act(() => {
    TestRenderer.create(<Harness />);
  });
  return ref;
}

describe('useDirectConversations: error y reintento', () => {
  beforeEach(() => mockSubscribe.mockReset());

  it('expone el error en es-MX y reload se resuscribe y lo limpia', () => {
    const unsubscribe = jest.fn();
    mockSubscribe.mockImplementation((_id: any, _ok: any, onError: any) => {
      onError(new Error('boom'));
      return unsubscribe;
    });
    const ref = mount();
    expect(ref.current!.loading).toBe(false);
    expect(ref.current!.error).toBe('No pudimos cargar tus conversaciones.');

    mockSubscribe.mockImplementation((_id: any, ok: any) => {
      ok([{ id: 'f1', name: 'Ana' }]);
      return unsubscribe;
    });
    act(() => {
      ref.current!.reload();
    });
    expect(unsubscribe).toHaveBeenCalledTimes(1); // cierra el canal anterior
    expect(ref.current!.error).toBeNull();
    expect(ref.current!.loading).toBe(false);
    expect(ref.current!.conversations).toHaveLength(1);
  });

  it('sin usuario no se suscribe y deja de cargar', () => {
    const ref = mount(null);
    expect(mockSubscribe).not.toHaveBeenCalled();
    expect(ref.current!.loading).toBe(false);
  });
});
