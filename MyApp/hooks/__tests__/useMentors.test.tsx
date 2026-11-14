import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import TestRenderer, { act } from 'react-test-renderer';

const mockGetMentors: any = jest.fn();
const mockByUni: any = jest.fn();
jest.mock('../../services/mentorService', () => ({
  getMentors: (...a: any[]) => mockGetMentors(...a),
  getMentorsByUniversity: (...a: any[]) => mockByUni(...a),
}));

import { useMentors } from '../useMentors';

async function mount() {
  const ref: { current: ReturnType<typeof useMentors> | null } = { current: null };
  function Harness() {
    ref.current = useMentors();
    return null;
  }
  await act(async () => {
    TestRenderer.create(<Harness />);
  });
  return ref;
}

describe('useMentors: error y reintento', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('expone el error en es-MX y reload lo limpia al recuperarse', async () => {
    mockGetMentors.mockRejectedValueOnce(new Error('boom'));
    const ref = await mount();
    expect(ref.current!.loading).toBe(false);
    expect(ref.current!.error).toBe('No pudimos cargar los mentores.');

    mockGetMentors.mockResolvedValue([{ uid: 'm1', name: 'Ana' }]);
    await act(async () => {
      ref.current!.reload();
    });
    expect(ref.current!.error).toBeNull();
    expect(ref.current!.mentors).toHaveLength(1);
  });
});
