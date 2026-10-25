import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockInsert = jest.fn<(...a: any[]) => Promise<any>>();
const mockDeleteEqs: any[][] = [];
const mockUpdateEqs: any[][] = [];
const mockOr = jest.fn();
let mockFriendships: { data: any; error: any } = { data: [], error: null };
let mockProfiles: { data: any; error: any } = { data: [], error: null };
let mockUpdateResult: { data: any; error: any } = { data: [{ id: 'f1' }], error: null };

jest.mock('../supabase/client', () => {
  const chain = (result: () => any, eqs?: any[][]) => {
    const c: any = {
      eq: (...a: any[]) => {
        eqs?.push(a);
        return c;
      },
      neq: () => c,
      order: () => c,
      select: () => c,
      or: (...a: any[]) => {
        mockOr(...a);
        return c;
      },
      then: (res: any, rej: any) => Promise.resolve(result()).then(res, rej),
    };
    return c;
  };
  return {
    supabase: {
      from: (table: string) => ({
        select: () => chain(() => (table === 'profiles' ? mockProfiles : mockFriendships)),
        insert: (...a: any[]) => mockInsert(...a),
        update: () => chain(() => mockUpdateResult, mockUpdateEqs),
        delete: () => chain(() => ({ error: null }), mockDeleteEqs),
      }),
    },
  };
});
jest.mock('../imageService', () => ({ uploadProfileImage: jest.fn() }));
jest.mock('../userService', () => ({ getUserProfile: jest.fn(), createOrUpdateUserProfile: jest.fn() }));
jest.mock('../postService', () => ({ getPostsByUser: jest.fn() }));

import {
  checkFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendSearchOverview,
} from '../profileService';

beforeEach(() => {
  jest.clearAllMocks();
  mockDeleteEqs.length = 0;
  mockUpdateEqs.length = 0;
  jest.spyOn(console, 'error').mockImplementation(() => {});
  mockFriendships = { data: [], error: null };
  mockProfiles = { data: [], error: null };
  mockUpdateResult = { data: [{ id: 'f1' }], error: null };
  mockInsert.mockResolvedValue({ error: null });
});

describe('profileService amistades', () => {
  it('checkFriendshipStatus distingue enviada, recibida y aceptada', async () => {
    mockFriendships = { data: [{ requester_id: 'me', addressee_id: 't', status: 'pending' }], error: null };
    expect(await checkFriendshipStatus('me', 't')).toEqual({ isFriend: false, isPending: true, isRequested: false });
    mockFriendships = { data: [{ requester_id: 't', addressee_id: 'me', status: 'pending' }], error: null };
    expect(await checkFriendshipStatus('me', 't')).toEqual({ isFriend: false, isPending: false, isRequested: true });
    mockFriendships = { data: [{ requester_id: 't', addressee_id: 'me', status: 'accepted' }], error: null };
    expect(await checkFriendshipStatus('me', 't')).toEqual({ isFriend: true, isPending: false, isRequested: false });
  });

  it('sendFriendRequest inserta una fila pending', async () => {
    await sendFriendRequest('me', 't');
    expect(mockInsert).toHaveBeenCalledWith({ requester_id: 'me', addressee_id: 't', status: 'pending' });
  });

  it('sendFriendRequest propaga el error (p. ej. duplicado)', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505' } });
    await expect(sendFriendRequest('me', 't')).rejects.toEqual({ code: '23505' });
  });

  it('acceptFriendRequest acepta la solicitud dirigida al usuario', async () => {
    await acceptFriendRequest('me', 'req');
    expect(mockUpdateEqs).toContainEqual(['requester_id', 'req']);
    expect(mockUpdateEqs).toContainEqual(['addressee_id', 'me']);
  });

  it('acceptFriendRequest falla si no había solicitud pendiente', async () => {
    mockUpdateResult = { data: [], error: null };
    await expect(acceptFriendRequest('me', 'req')).rejects.toThrow();
  });

  it('rejectFriendRequest borra solo la solicitud pendiente recibida', async () => {
    await rejectFriendRequest('me', 'req');
    expect(mockDeleteEqs).toContainEqual(['status', 'pending']);
    expect(mockDeleteEqs).toContainEqual(['addressee_id', 'me']);
  });

  it('removeFriend borra la amistad en cualquier dirección', async () => {
    await removeFriend('me', 'f');
    expect(mockOr).toHaveBeenCalledWith(expect.stringContaining('requester_id.eq.f,addressee_id.eq.me'));
  });

  it('getFriendSearchOverview clasifica usuarios', async () => {
    mockProfiles = {
      data: [
        { id: 'a', name: 'A', photo_url: null },
        { id: 'b', name: 'B', photo_url: 'http://x' },
        { id: 'c', name: 'C', photo_url: null },
        { id: 'd', name: 'D', photo_url: null },
      ],
      error: null,
    };
    mockFriendships = {
      data: [
        { requester_id: 'me', addressee_id: 'a', status: 'accepted' },
        { requester_id: 'b', addressee_id: 'me', status: 'pending' },
        { requester_id: 'me', addressee_id: 'c', status: 'pending' },
      ],
      error: null,
    };
    const o = await getFriendSearchOverview('me');
    expect(o.users).toHaveLength(4);
    expect(o.users[1]).toEqual({ id: 'b', name: 'B', photo: 'http://x' });
    expect(o.friends).toEqual(['a']);
    expect(o.pendingRequests).toEqual(['b']);
    expect(o.sentRequests).toEqual(['c']);
  });
});
