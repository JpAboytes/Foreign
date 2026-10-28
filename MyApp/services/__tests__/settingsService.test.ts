import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockGetUser = jest.fn<(...a: any[]) => Promise<any>>();
const mockSignInWithPassword = jest.fn<(...a: any[]) => Promise<any>>();
const mockSignOut = jest.fn<(...a: any[]) => Promise<any>>();
const mockInvoke = jest.fn<(...a: any[]) => Promise<any>>();
const mockRpc = jest.fn<(...a: any[]) => Promise<any>>();

jest.mock('../supabase/client', () => ({
  supabase: {
    auth: {
      getUser: (...a: any[]) => mockGetUser(...a),
      signInWithPassword: (...a: any[]) => mockSignInWithPassword(...a),
      signOut: (...a: any[]) => mockSignOut(...a),
    },
    functions: { invoke: (...a: any[]) => mockInvoke(...a) },
    rpc: (...a: any[]) => mockRpc(...a),
  },
}));

import { deleteMyAccount } from '../settingsService';

const emailUser = { email: 'a@b.mx', identities: [{ provider: 'email' }] };
const googleUser = { email: 'a@b.mx', identities: [{ provider: 'google' }] };

describe('deleteMyAccount', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockSignOut.mockResolvedValue({ error: null });
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });
  });

  it('reautentica con contraseña, invoca delete-account sin user_id y cierra la sesión local', async () => {
    mockGetUser.mockResolvedValue({ data: { user: emailUser } });
    await deleteMyAccount('secreto');
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'a@b.mx', password: 'secreto' });
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    const [name, options] = mockInvoke.mock.calls[0];
    expect(name).toBe('delete-account');
    expect(options).not.toHaveProperty('body');
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('exige contraseña a quien entró con correo', async () => {
    mockGetUser.mockResolvedValue({ data: { user: emailUser } });
    await expect(deleteMyAccount()).rejects.toThrow('Ingresa tu contraseña');
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('no borra nada si la contraseña es incorrecta', async () => {
    mockGetUser.mockResolvedValue({ data: { user: emailUser } });
    mockSignInWithPassword.mockResolvedValue({ error: new Error('bad') });
    await expect(deleteMyAccount('mal')).rejects.toThrow('Contraseña incorrecta.');
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('con Google/Apple no pide contraseña', async () => {
    mockGetUser.mockResolvedValue({ data: { user: googleUser } });
    await deleteMyAccount();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalledTimes(1);
  });

  it('si la función falla, lanza error y conserva la sesión', async () => {
    mockGetUser.mockResolvedValue({ data: { user: googleUser } });
    mockInvoke.mockResolvedValue({ data: null, error: new Error('500') });
    await expect(deleteMyAccount()).rejects.toThrow('No se pudo eliminar la cuenta');
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
