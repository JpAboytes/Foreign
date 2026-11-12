import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import TestRenderer, { act } from 'react-test-renderer';

const mockGetQuestions: any = jest.fn();
const mockBlocked: any = jest.fn();

jest.mock('../../services/forumService', () => ({
  getQuestions: (...a: any[]) => mockGetQuestions(...a),
  createQuestion: jest.fn(),
}));
jest.mock('../../services/moderationService', () => ({ getBlockedIds: (...a: any[]) => mockBlocked(...a) }));

import { useForumQuestions } from '../useForumQuestions';

async function mount() {
  const ref: { current: ReturnType<typeof useForumQuestions> | null } = { current: null };
  function Harness() {
    ref.current = useForumQuestions('u1');
    return null;
  }
  await act(async () => {
    TestRenderer.create(<Harness />);
  });
  return ref;
}

describe('useForumQuestions: error y reintento', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockBlocked.mockResolvedValue([]);
  });

  it('expone el error en es-MX y reload lo limpia al recuperarse', async () => {
    mockGetQuestions.mockRejectedValueOnce(new Error('boom'));
    const ref = await mount();
    expect(ref.current!.loading).toBe(false);
    expect(ref.current!.error).toBe('No pudimos cargar las preguntas.');

    mockGetQuestions.mockResolvedValue([{ id: 'q1' }]);
    await act(async () => {
      ref.current!.reload();
    });
    expect(ref.current!.error).toBeNull();
    expect(ref.current!.questions).toHaveLength(1);
  });

  it('ignora un fallo de getBlockedIds', async () => {
    mockBlocked.mockRejectedValue(new Error('x'));
    mockGetQuestions.mockResolvedValue([{ id: 'q1' }]);
    const ref = await mount();
    expect(ref.current!.error).toBeNull();
    expect(mockGetQuestions).toHaveBeenLastCalledWith([]);
  });
});
