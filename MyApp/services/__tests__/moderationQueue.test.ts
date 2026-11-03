import { describe, it, expect, beforeEach, jest } from '@jest/globals';

type Call = { table: string; ops: [string, any[]][] };
const mockCalls: Call[] = [];
let mockResults: Record<string, { data: any; error: any }> = {};

jest.mock('../supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      const call: Call = { table, ops: [] };
      mockCalls.push(call);
      const chain: any = new Proxy(
        {},
        {
          get: (_t, op: string) => {
            if (op === 'then') {
              return (res: any, rej: any) =>
                Promise.resolve(mockResults[table] ?? { data: [], error: null }).then(res, rej);
            }
            return (...a: any[]) => {
              call.ops.push([op, a]);
              return chain;
            };
          },
        }
      );
      return chain;
    },
  },
}));

import { listOpenReports, resolveReport } from '../moderationService';

const op = (table: string, name: string) =>
  mockCalls.find((c) => c.table === table)?.ops.find(([n]) => n === name)?.[1];

describe('moderationService (cola de moderación)', () => {
  beforeEach(() => {
    mockCalls.length = 0;
    mockResults = {};
  });

  it('listOpenReports pide solo reportes abiertos, los más antiguos primero', async () => {
    await expect(listOpenReports()).resolves.toEqual([]);
    expect(op('reports', 'eq')).toEqual(['status', 'open']);
    expect(op('reports', 'order')).toEqual(['created_at', { ascending: true }]);
  });

  it('listOpenReports añade reportero y resumen del contenido', async () => {
    const long = 'x'.repeat(300);
    mockResults = {
      reports: {
        data: [
          { id: 'r1', reporter_id: 'u1', target_type: 'post', target_id: 'p1', reason: 'Spam', status: 'open', created_at: '2026-11-03T00:00:00Z' },
          { id: 'r2', reporter_id: 'u1', target_type: 'message', target_id: 'm1', reason: 'Acoso', status: 'open', created_at: '2026-11-03T01:00:00Z' },
        ],
        error: null,
      },
      posts: { data: [{ id: 'p1', caption: long }], error: null },
      profiles: { data: [{ id: 'u1', name: 'Ana' }], error: null },
    };
    const [first, second] = await listOpenReports();
    expect(first.reporterName).toBe('Ana');
    expect(first.targetSummary).toHaveLength(141);
    expect(first.targetSummary?.endsWith('…')).toBe(true);
    expect(second.targetSummary).toBeUndefined();
    expect(mockCalls.some((c) => c.table === 'messages')).toBe(false);
  });

  it('listOpenReports no falla si el resumen no se puede obtener', async () => {
    mockResults = {
      reports: {
        data: [{ id: 'r1', reporter_id: 'u1', target_type: 'comment', target_id: 'c1', reason: 'Spam', status: 'open', created_at: 'd' }],
        error: null,
      },
      comments: { data: null, error: { message: 'boom' } },
    };
    const [r] = await listOpenReports();
    expect(r.targetSummary).toBeUndefined();
  });

  it('listOpenReports propaga el error de la consulta principal', async () => {
    mockResults = { reports: { data: null, error: { code: '42501' } } };
    await expect(listOpenReports()).rejects.toEqual({ code: '42501' });
  });

  it('resolveReport actualiza estado y revisor solo si sigue abierto', async () => {
    await resolveReport('r1', 'admin1', 'dismissed');
    const update = op('reports', 'update')![0];
    expect(update).toMatchObject({ status: 'dismissed', reviewed_by: 'admin1' });
    expect(typeof update.reviewed_at).toBe('string');
    const eqs = mockCalls[0].ops.filter(([n]) => n === 'eq').map(([, a]) => a);
    expect(eqs).toEqual([['id', 'r1'], ['status', 'open']]);
  });

  it('resolveReport propaga errores', async () => {
    mockResults = { reports: { data: null, error: { code: '42501' } } };
    await expect(resolveReport('r1', 'u1', 'reviewed')).rejects.toEqual({ code: '42501' });
  });
});
