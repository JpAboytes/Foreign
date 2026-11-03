import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockSignUp = jest.fn<(...a: any[]) => Promise<any>>();
const mockUpdate = jest.fn<(...a: any[]) => any>();
const mockEq = jest.fn<(...a: any[]) => Promise<any>>();
const mockFrom = jest.fn<(...a: any[]) => any>();

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('expo-apple-authentication', () => ({}));
jest.mock('expo-crypto', () => ({}));
jest.mock('../pushService', () => ({ unregisterPushToken: jest.fn() }));
jest.mock('../supabase/client', () => ({
  supabase: {
    auth: { signUp: (...a: any[]) => mockSignUp(...a) },
    from: (...a: any[]) => mockFrom(...a),
  },
}));

import { registerWithEmail, acceptTerms, TERMS_VERSION } from '../auth';

describe('aceptación de términos', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockFrom.mockReturnValue({ update: (...a: any[]) => { mockUpdate(...a); return { eq: mockEq }; } });
    mockEq.mockResolvedValue({ error: null });
  });

  it('registerWithEmail rechaza el registro sin aceptar los términos y no llama a Supabase', async () => {
    await expect(registerWithEmail('a@b.mx', 'secreto1', { name: 'Ana' })).rejects.toThrow(/Términos y Condiciones/);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('registerWithEmail manda terms_version en los metadatos al aceptar', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: 'u1' }, session: null }, error: null });
    const result = await registerWithEmail('a@b.mx', 'secreto1', { name: 'Ana' }, true);
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'a@b.mx',
      password: 'secreto1',
      options: { data: { name: 'Ana', terms_version: TERMS_VERSION } },
    });
    expect(result.needsEmailConfirmation).toBe(true);
  });

  it('acceptTerms actualiza solo el perfil del usuario con fecha y versión', async () => {
    await acceptTerms('u1');
    expect(mockFrom).toHaveBeenCalledWith('profiles');
    const payload = mockUpdate.mock.calls[0][0] as any;
    expect(payload.terms_version).toBe(TERMS_VERSION);
    expect(Number.isNaN(Date.parse(payload.terms_accepted_at))).toBe(false);
    expect(mockEq).toHaveBeenCalledWith('id', 'u1');
  });

  it('acceptTerms propaga el error', async () => {
    mockEq.mockResolvedValue({ error: new Error('rls') });
    await expect(acceptTerms('u1')).rejects.toThrow('rls');
  });
});
