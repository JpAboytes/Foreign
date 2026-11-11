import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockInvoke = jest.fn<(...a: any[]) => Promise<any>>();
const mockRpc = jest.fn<(...a: any[]) => Promise<any>>();
const mockFrom = jest.fn<(...a: any[]) => any>();

jest.mock('../supabase/client', () => ({
  supabase: {
    functions: { invoke: (...a: any[]) => mockInvoke(...a) },
    rpc: (...a: any[]) => mockRpc(...a),
    from: (...a: any[]) => mockFrom(...a),
  },
}));

import { deleteAdminItem } from '../adminService';

const UID = '123e4567-e89b-42d3-a456-426614174000';

describe('deleteAdminItem (users)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });
  });

  it('invoca admin-delete-user con el user_id y no usa la RPC', async () => {
    await deleteAdminItem('users', UID);
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke).toHaveBeenCalledWith('admin-delete-user', { body: { user_id: UID } });
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('si la función falla, lanza un error en español', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('500') });
    await expect(deleteAdminItem('users', UID)).rejects.toThrow('No se pudo eliminar al usuario');
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
