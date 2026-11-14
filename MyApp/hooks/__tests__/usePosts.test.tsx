import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import TestRenderer, { act } from 'react-test-renderer';

const mockByUni: any = jest.fn();
const mockByFriends: any = jest.fn();
const mockFriendIds: any = jest.fn();
const mockBlocked: any = jest.fn();

jest.mock('../../services/postService', () => ({
  getPostsByUniversity: (...a: any[]) => mockByUni(...a),
  getPostsByFriends: (...a: any[]) => mockByFriends(...a),
  togglePostLike: jest.fn(),
  deletePost: jest.fn(),
}));
jest.mock('../../services/profileService', () => ({ getFriendIds: (...a: any[]) => mockFriendIds(...a) }));
jest.mock('../../services/moderationService', () => ({ getBlockedIds: (...a: any[]) => mockBlocked(...a) }));
jest.mock('../../services/userService', () => ({}));

import { usePosts } from '../usePosts';

const user: any = { uid: 'u1', university: 'UNAM' };

function mount() {
  const ref: { current: ReturnType<typeof usePosts> | null } = { current: null };
  function Harness() {
    ref.current = usePosts(user);
    return null;
  }
  act(() => {
    TestRenderer.create(<Harness />);
  });
  return ref;
}

describe('usePosts: loading, error y reintento', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFriendIds.mockResolvedValue([]);
    mockBlocked.mockResolvedValue([]);
    mockByFriends.mockResolvedValue([]);
  });

  it('está en loading hasta la primera carga y luego muestra los datos', async () => {
    mockByUni.mockResolvedValue([{ id: 'p1', userId: 'a' }]);
    const ref = mount();
    expect(ref.current!.loading).toBe(true);
    await act(async () => {
      await ref.current!.fetchPosts();
    });
    expect(ref.current!.loading).toBe(false);
    expect(ref.current!.error).toBeNull();
    expect(ref.current!.universityPosts).toHaveLength(1);
  });

  it('expone el error en es-MX y lo limpia al reintentar', async () => {
    mockByUni.mockRejectedValueOnce(new Error('boom'));
    const ref = mount();
    await act(async () => {
      await ref.current!.reload();
    });
    expect(ref.current!.loading).toBe(false);
    expect(ref.current!.error).toBe('No pudimos cargar las publicaciones.');

    mockByUni.mockResolvedValue([{ id: 'p1', userId: 'a' }]);
    await act(async () => {
      await ref.current!.reload();
    });
    expect(ref.current!.error).toBeNull();
    expect(ref.current!.universityPosts).toHaveLength(1);
  });
});
