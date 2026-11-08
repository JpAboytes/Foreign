import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockInsert = jest.fn<(...a: any[]) => Promise<any>>();
const mockFrom = jest.fn<(t: string) => any>();

jest.mock('../supabase/client', () => ({
  supabase: { from: (t: string) => mockFrom(t) },
}));

import { reportContent, excludeBlocked } from '../moderationService';
import type { RealtimeChatMessage } from '../chatService';
import type { DirectConversation } from '../chatService';

describe('moderación del chat', () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockFrom.mockReset();
    mockFrom.mockReturnValue({ insert: (...a: any[]) => mockInsert(...a) });
  });

  it('reportar un mensaje inserta en reports con target_type "message"', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await reportContent('me', 'message', 'm1', 'Acoso o discurso de odio');
    expect(mockFrom).toHaveBeenCalledWith('reports');
    expect(mockInsert).toHaveBeenCalledWith({
      reporter_id: 'me',
      target_type: 'message',
      target_id: 'm1',
      reason: 'Acoso o discurso de odio',
    });
  });

  it('oculta los mensajes de usuarios bloqueados y conserva los propios', () => {
    const msgs: RealtimeChatMessage[] = [
      { id: '1', from: 'me', text: 'hola', timestamp: 1 },
      { id: '2', from: 'bad', text: 'x', timestamp: 2 },
      { id: '3', from: 'ok', text: 'y', timestamp: 3 },
    ];
    expect(excludeBlocked(msgs, ['bad'], (m) => m.from).map((m) => m.id)).toEqual(['1', '3']);
  });

  it('oculta las conversaciones con usuarios bloqueados', () => {
    const base = { name: 'n', photoURL: '', lastMessage: '', timestamp: 0, unreadCount: 0 };
    const convs: DirectConversation[] = [
      { ...base, id: 'a' },
      { ...base, id: 'b' },
    ];
    expect(excludeBlocked(convs, ['b'], (c) => c.id).map((c) => c.id)).toEqual(['a']);
  });
});
