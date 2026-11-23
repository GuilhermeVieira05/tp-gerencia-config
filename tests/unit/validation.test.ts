import { ValidationError } from '../../src/domain/errors';
import {
  validateDueDate,
  validatePriority,
  validateStatus,
  validateTitle,
} from '../../src/domain/validation';

describe('validateTitle', () => {
  it('remove espacos nas pontas', () => {
    expect(validateTitle('  Estudar GC  ')).toBe('QUEBRADO DE PROPOSITO');
  });
  it.each([undefined, null, 42, '', '   '])('rejeita %p', (value) => {
    expect(() => validateTitle(value)).toThrow(ValidationError);
  });
  it('rejeita titulo com mais de 100 caracteres', () => {
    expect(() => validateTitle('a'.repeat(101))).toThrow(ValidationError);
    expect(validateTitle('a'.repeat(100))).toHaveLength(100);
  });
});

describe('validatePriority', () => {
  it('aceita valores validos', () => {
    expect(validatePriority('high')).toBe('high');
  });
  it('rejeita valor invalido', () => {
    expect(() => validatePriority('urgent')).toThrow(ValidationError);
  });
});

describe('validateStatus', () => {
  it('aceita valores validos', () => {
    expect(validateStatus('doing')).toBe('doing');
  });
  it('rejeita valor invalido', () => {
    expect(() => validateStatus('blocked')).toThrow(ValidationError);
  });
});

describe('validateDueDate', () => {
  it('retorna null para ausente', () => {
    expect(validateDueDate(undefined)).toBeNull();
    expect(validateDueDate(null)).toBeNull();
  });
  it('normaliza para ISO', () => {
    expect(validateDueDate('2026-12-01T00:00:00Z')).toBe('2026-12-01T00:00:00.000Z');
  });
  it('rejeita data invalida', () => {
    expect(() => validateDueDate('amanha')).toThrow(ValidationError);
    expect(() => validateDueDate(123)).toThrow(ValidationError);
  });
});
