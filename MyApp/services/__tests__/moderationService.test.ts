import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockInsert = jest.fn<(...a: any[]) => Promise<any>>();
const mockEqCalls: any[][] = [];
let mockSelectResult: { data: any; error: any } = { data: [], error: null };
let mockDeleteResult: { error: any } = { error: null };
const mockTableResults: Record<string, { data: any; error: any }> = {};
const mockFromCalls: string[] = [];
const mockInCalls: any[][] = [];

jest.mock('../supabase/client', () => {
  const deleteChain: any = {
    eq: (...a: any[]) => {
      mockEqCalls.push(a);
      return deleteChain;
    },
    then: (res: any, rej: any) => Promise.resolve(mockDeleteResult).then(res, rej),
  };
  const makeSelectChain = (table: string): any => {
    const chain: any = {
      eq: (...a: any[]) => {
        mockEqCalls.push(a);
        return chain;
      },
      order: () => chain,
      in: (...a: any[]) => {
        mockInCalls.push(a);
        return chain;
      },
      then: (res: any, rej: any) =>
        Promise.resolve(mockTableResults[table] ?? mockSelectResult).then(res, rej),
    };
    return chain;
  };
  return {
    supabase: {
      from: (table: string) => {
        mockFromCalls.push(table);
        return {
          insert: (...a: any[]) => mockInsert(...a),
          select: () => makeSelectChain(table),
          delete: () => deleteChain,
        };
      },
    },
  };
});

import { reportContent, blockUser, unblockUser, getBlockedIds, listBlockedUsers, excludeBlocked } from '../moderationService';

describe('moderationService', () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockEqCalls.length = 0;
    mockSelectResult = { data: [], error: null };
    mockDeleteResult = { error: null };
    for (const k of Object.keys(mockTableResults)) delete mockTableResults[k];
    mockFromCalls.length = 0;
    mockInCalls.length = 0;
  });

  it('reportContent inserta el reporte con el motivo recortado', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await reportContent('u1', 'post', 'p1', '  Spam  ');
    expect(mockInsert).toHaveBeenCalledWith({
      reporter_id: 'u1',
      target_type: 'post',
      target_id: 'p1',
      reason: 'Spam',
    });
  });

  it('reportContent rechaza un motivo vacío sin llamar al backend', async () => {
    await expect(reportContent('u1', 'post', 'p1', '   ')).rejects.toThrow();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('blockUser no permite bloquearse a sí mismo', async () => {
    await expect(blockUser('u1', 'u1')).rejects.toThrow();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('blockUser ignora el error de bloqueo duplicado', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505' } });
    await expect(blockUser('u1', 'u2')).resolves.toBeUndefined();
  });

  it('blockUser propaga otros errores', async () => {
    mockInsert.mockResolvedValue({ error: { code: '42501', message: 'rls' } });
    await expect(blockUser('u1', 'u2')).rejects.toEqual({ code: '42501', message: 'rls' });
  });

  it('unblockUser borra por blocker y blocked', async () => {
    await unblockUser('u1', 'u2');
    expect(mockEqCalls).toEqual([
      ['blocker_id', 'u1'],
      ['blocked_id', 'u2'],
    ]);
  });

  it('getBlockedIds devuelve los ids bloqueados', async () => {
    mockSelectResult = { data: [{ blocked_id: 'a' }, { blocked_id: 'b' }], error: null };
    await expect(getBlockedIds('u1')).resolves.toEqual(['a', 'b']);
  });

  it('reportContent acepta usuarios como objetivo', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await reportContent('u1', 'user', 'u2', 'Acoso o discurso de odio');
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ target_type: 'user', target_id: 'u2' }));
  });

  it('listBlockedUsers une bloqueos con nombre y foto de profiles', async () => {
    mockTableResults.blocks = {
      data: [
        { blocked_id: 'a', created_at: '2026-11-02' },
        { blocked_id: 'b', created_at: '2026-11-01' },
      ],
      error: null,
    };
    mockTableResults.profiles = { data: [{ id: 'a', name: 'Ana', photo_url: 'http://x/a.jpg' }], error: null };
    await expect(listBlockedUsers('u1')).resolves.toEqual([
      { id: 'a', name: 'Ana', photoUrl: 'http://x/a.jpg', blockedAt: '2026-11-02' },
      { id: 'b', name: 'Usuario', photoUrl: undefined, blockedAt: '2026-11-01' },
    ]);
    expect(mockEqCalls).toContainEqual(['blocker_id', 'u1']);
    expect(mockInCalls).toEqual([['id', ['a', 'b']]]);
  });

  it('listBlockedUsers no consulta profiles si no hay bloqueos', async () => {
    mockTableResults.blocks = { data: [], error: null };
    await expect(listBlockedUsers('u1')).resolves.toEqual([]);
    expect(mockFromCalls).toEqual(['blocks']);
  });

  it('listBlockedUsers propaga errores', async () => {
    mockTableResults.blocks = { data: null, error: { message: 'boom' } };
    await expect(listBlockedUsers('u1')).rejects.toEqual({ message: 'boom' });
  });

  it('excludeBlocked filtra por autor y no toca la lista si no hay bloqueados', () => {
    const items = [{ u: 'a' }, { u: 'b' }, { u: 'c' }];
    expect(excludeBlocked(items, ['b'], (i) => i.u)).toEqual([{ u: 'a' }, { u: 'c' }]);
    expect(excludeBlocked(items, [], (i) => i.u)).toBe(items);
  });
});
