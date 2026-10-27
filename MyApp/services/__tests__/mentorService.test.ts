import { sharedMock as mock } from '../../test-utils/supabaseMock';

jest.mock('../supabase/client', () => ({
  supabase: require('../../test-utils/supabaseMock').sharedMock.client,
}));

import { getMentors, getMentorsByUniversity } from '../mentorService';

const row = {
  user_id: 'm1',
  bio: 'Hola',
  topics: ['becas'],
  is_available: true,
  rating: 4.5,
  created_at: '2026-01-01T00:00:00Z',
  profile: {
    id: 'm1',
    name: 'Ana',
    photo_url: null,
    university: 'CETYS',
    interests: ['cine'],
    origin: 'Sonora',
    created_at: '2025-01-01T00:00:00Z',
  },
};

beforeEach(() => {
  mock.calls.length = 0;
});

describe('mentorService', () => {
  it('mapea mentores con su perfil', async () => {
    mock.queue('mentors', [row]);
    const mentors = await getMentors();
    expect(mentors).toEqual([
      expect.objectContaining({
        uid: 'm1',
        name: 'Ana',
        university: 'CETYS',
        photo: '',
        rating: 4.5,
        topics: ['becas'],
        isAvailable: true,
        isMentor: true,
      }),
    ]);
  });

  it('filtra por universidad del perfil', async () => {
    mock.queue('mentors', []);
    await getMentorsByUniversity('CETYS');
    expect(mock.calls[0].ops).toContainEqual(['eq', ['profile.university', 'CETYS']]);
  });

  it('propaga errores de Supabase', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mock.queue('mentors', null, new Error('boom'));
    await expect(getMentors()).rejects.toThrow('boom');
  });
});
