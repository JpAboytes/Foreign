import { describe, it, expect, beforeEach, jest } from '@jest/globals';

let mockResult: { data: any; error: any } = { data: [], error: null };

jest.mock('../supabase/client', () => {
  const chain: any = {};
  for (const m of ['select', 'eq', 'order', 'limit', 'in']) chain[m] = () => chain;
  chain.maybeSingle = () => Promise.resolve(mockResult);
  chain.then = (res: any, rej: any) => Promise.resolve(mockResult).then(res, rej);
  return { supabase: { from: () => chain } };
});

import { getQuestions, getAnswers, getAnswerComments } from '../forumService';
import { getPostComments } from '../commentService';

const author = (id: string) => ({ id, name: `U${id}`, photo_url: null });

describe('el contenido de usuarios bloqueados se oculta', () => {
  beforeEach(() => {
    mockResult = { data: [], error: null };
  });

  it('getQuestions', async () => {
    mockResult = {
      data: [
        { id: 'q1', title: 'a', created_at: 't', author: author('u1'), forum_answers: [{ count: 0 }] },
        { id: 'q2', title: 'b', created_at: 't', author: author('u2'), forum_answers: [{ count: 0 }] },
      ],
      error: null,
    };
    expect((await getQuestions(['u2'])).map((q) => q.id)).toEqual(['q1']);
    expect((await getQuestions()).map((q) => q.id)).toEqual(['q1', 'q2']);
  });

  it('getAnswers', async () => {
    const row = (id: string, uid: string) => ({
      id,
      question_id: 'q',
      user_id: uid,
      content: 'c',
      created_at: 't',
      author: author(uid),
      forum_answer_likes: [],
      forum_answer_comments: [{ count: 0 }],
    });
    mockResult = { data: [row('a1', 'u1'), row('a2', 'u2')], error: null };
    expect((await getAnswers('q', 'me', ['u1'])).map((a) => a.id)).toEqual(['a2']);
  });

  it('getAnswerComments', async () => {
    mockResult = {
      data: [
        { id: 'c1', content: 'x', created_at: 't', author: author('u1') },
        { id: 'c2', content: 'y', created_at: 't', author: author('u2') },
      ],
      error: null,
    };
    expect((await getAnswerComments('a', ['u2'])).map((c) => c.id)).toEqual(['c1']);
  });

  it('getPostComments', async () => {
    mockResult = {
      data: [
        { id: 'c1', text: 'x', created_at: 't', author: author('u1') },
        { id: 'c2', text: 'y', created_at: 't', author: author('u2') },
      ],
      error: null,
    };
    expect((await getPostComments('p', ['u1'])).map((c) => c.id)).toEqual(['c2']);
  });
});
