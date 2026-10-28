import { sharedMock as mock } from '../../test-utils/supabaseMock';

jest.mock('../supabase/client', () => ({
  supabase: require('../../test-utils/supabaseMock').sharedMock.client,
}));

import {
  startChatSession,
  sendChatMessage,
  markMessagesAsRead,
  getChatMessages,
  getReceivedChatSessions,
  findDirectSession,
} from '../chatService';

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  mock.calls.length = 0;
  mock.channels.length = 0;
  mock.removeChannel.mockClear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('chatService', () => {
  it('startChatSession crea la sesión y envía el primer mensaje', async () => {
    mock.queue('chat_sessions', null); // no existe
    mock.queue('chat_sessions', { id: 's1' }); // insert
    mock.queue('messages', { id: 'msg1' });
    mock.queue('chat_sessions', null); // update última actividad
    const id = await startChatSession('stu', 'men', 'Hola');
    expect(id).toBe('s1');
    const insert = mock.calls[1].ops.find(([op]) => op === 'insert');
    expect(insert?.[1][0]).toEqual({ student_id: 'stu', mentor_id: 'men', last_message: 'Hola' });
    expect(mock.calls[2].ops.find(([op]) => op === 'insert')?.[1][0]).toEqual({
      session_id: 's1',
      sender_id: 'stu',
      text: 'Hola',
    });
  });

  it('startChatSession reutiliza la sesión existente', async () => {
    mock.queue('chat_sessions', { id: 's9' });
    mock.queue('messages', { id: 'msg1' });
    mock.queue('chat_sessions', null);
    expect(await startChatSession('stu', 'men', 'Otra vez')).toBe('s9');
    expect(mock.calls.filter((c) => c.table === 'chat_sessions' && c.ops.some(([o]) => o === 'insert'))).toHaveLength(0);
  });

  it('sendChatMessage devuelve el id y actualiza last_message', async () => {
    mock.queue('messages', { id: 'm7' });
    mock.queue('chat_sessions', null);
    expect(await sendChatMessage('s1', 'u1', 'hey')).toBe('m7');
    const update = mock.calls[1].ops.find(([op]) => op === 'update');
    expect(update?.[1][0]).toMatchObject({ last_message: 'hey' });
  });

  it('markMessagesAsRead solo marca los mensajes de la otra persona', async () => {
    mock.queue('messages', null);
    await markMessagesAsRead('s1', 'u1');
    const ops = mock.calls[0].ops;
    expect(ops).toContainEqual(['update', [{ is_read: true }]]);
    expect(ops).toContainEqual(['neq', ['sender_id', 'u1']]);
  });

  it('getChatMessages entrega mensajes, recarga con realtime y cierra el canal', async () => {
    const cb = jest.fn();
    mock.queue('messages', [
      { id: 'a', session_id: 's1', sender_id: 'u1', text: 'hi', is_read: false, created_at: '2026-01-01T00:00:00Z' },
    ]);
    const unsubscribe = getChatMessages('s1', cb);
    await flush();
    expect(cb).toHaveBeenCalledWith([
      { id: 'a', senderId: 'u1', text: 'hi', timestamp: '2026-01-01T00:00:00Z', isRead: false },
    ]);
    expect(mock.channels[0].subscribed).toBe(true);
    expect(mock.channels[0].filter).toMatchObject({ table: 'messages', filter: 'session_id=eq.s1' });

    mock.queue('messages', []);
    mock.channels[0].handler?.();
    await flush();
    expect(cb).toHaveBeenLastCalledWith([]);

    unsubscribe();
    expect(mock.removeChannel).toHaveBeenCalledWith(mock.channels[0]);
    // tras cancelar, un evento tardío ya no llama al callback
    cb.mockClear();
    mock.queue('messages', []);
    mock.channels[0].handler?.();
    await flush();
    expect(cb).not.toHaveBeenCalled();
  });

  it('getReceivedChatSessions mapea sesiones con no leídos y estudiante', async () => {
    const cb = jest.fn();
    mock.queue('chat_sessions', [
      {
        id: 's1',
        mentor_id: 'men',
        student_id: 'stu',
        last_message: 'Hola',
        last_message_at: '2026-01-01T00:00:00Z',
        student: { id: 'stu', name: 'Luis', photo_url: null },
        unread: [{ count: 2 }],
      },
    ]);
    const unsubscribe = getReceivedChatSessions('men', cb);
    await flush();
    expect(cb).toHaveBeenCalledWith([
      expect.objectContaining({ id: 's1', unreadCount: 2, student: { id: 'stu', name: 'Luis', photo: '' } }),
    ]);
    unsubscribe();
    expect(mock.removeChannel).toHaveBeenCalledTimes(1);
  });

  it('findDirectSession devuelve null si no hay sesión', async () => {
    mock.queue('chat_sessions', null);
    expect(await findDirectSession('a', 'b')).toBeNull();
  });
});
