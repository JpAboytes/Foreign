import { getPinColor, filterLocationsByTypes } from '../mapPins';

describe('getPinColor', () => {
  it('usa el color propio para el usuario actual', () => {
    expect(getPinColor('me', 'me', ['a'])).toBe('#4f0c2e');
  });
  it('asigna color por índice de amigo', () => {
    expect(getPinColor('b', 'me', ['a', 'b'])).toBe('#66BB6A');
  });
  it('da la vuelta a la paleta y usa amarillo para desconocidos', () => {
    expect(getPinColor('e', 'me', ['a', 'b', 'c', 'd', 'e'])).toBe('#42A5F5');
    expect(getPinColor('x', 'me', ['a'])).toBe('#FFCA28');
  });
});

describe('filterLocationsByTypes', () => {
  const places = [{ type: ['a'] }, { type: ['b', 'c'] }];
  it('sin filtros devuelve todo', () => {
    expect(filterLocationsByTypes(places, [])).toHaveLength(2);
  });
  it('filtra por tipo', () => {
    expect(filterLocationsByTypes(places, ['c'])).toEqual([places[1]]);
  });
});
