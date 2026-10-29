import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockInsert = jest.fn<(...a: any[]) => Promise<any>>();
const mockEqCalls: any[][] = [];
let mockSelectResult: { data: any; error: any } = { data: [], error: null };
let mockDeleteResult: { error: any } = { error: null };

jest.mock('../supabase/client', () => {
  const deleteChain: any = {
    eq: (...a: any[]) => {
      mockEqCalls.push(a);
      return deleteChain;
    },
    then: (res: any, rej: any) => Promise.resolve(mockDeleteResult).then(res, rej),
  };
  const selectChain: any = {
    eq: (...a: any[]) => {
      mockEqCalls.push(a);
      return selectChain;
    },
    then: (res: any, rej: any) => Promise.resolve(mockSelectResult).then(res, rej),
  };
  return {
    supabase: {
      from: () => ({
        insert: (...a: any[]) => mockInsert(...a),
        select: () => selectChain,
        delete: () => deleteChain,
      }),
    },
  };
});

import { reportContent, blockUser, unblockUser, getBlockedIds } from '../moderationService';

describe('moderationService', () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockEqCalls.length = 0;
    mockSelectResult = { data: [], error: null };
    mockDeleteResult = { error: null };
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
});
