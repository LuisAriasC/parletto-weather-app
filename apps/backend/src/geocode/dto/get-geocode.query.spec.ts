import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { GetGeocodeQuery } from './get-geocode.query';

function build(q: unknown): GetGeocodeQuery {
  return plainToInstance(GetGeocodeQuery, { q });
}

describe('GetGeocodeQuery', () => {
  it('passes validation for a 2-character query (minimum length)', async () => {
    const errors = await validate(build('Au'));
    expect(errors).toHaveLength(0);
  });

  it('passes validation for a typical city query', async () => {
    const errors = await validate(build('Austin'));
    expect(errors).toHaveLength(0);
  });

  it('passes validation for a 100-character query (maximum length)', async () => {
    const errors = await validate(build('A'.repeat(100)));
    expect(errors).toHaveLength(0);
  });

  it('fails validation when q is a single character (below MinLength)', async () => {
    const errors = await validate(build('A'));
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('q');
  });

  it('fails validation when q exceeds 100 characters (above MaxLength)', async () => {
    const errors = await validate(build('A'.repeat(101)));
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('q');
  });

  it('fails validation when q is an empty string', async () => {
    const errors = await validate(build(''));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('q');
  });

  it('fails validation when q is not a string', async () => {
    const errors = await validate(build(42));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('q');
  });

  it('passes validation for international city names with Unicode letters', async () => {
    const errors = await validate(build('São Paulo'));
    expect(errors).toHaveLength(0);
  });

  it('passes validation for city names with apostrophes', async () => {
    const errors = await validate(build("L'Aquila"));
    expect(errors).toHaveLength(0);
  });

  it('fails validation when q contains script injection characters', async () => {
    const errors = await validate(build('<script>alert(1)</script>'));
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('q');
  });

  it('fails validation when q contains SQL injection characters', async () => {
    const errors = await validate(build("'; DROP TABLE cities; --"));
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('q');
  });

  it('fails validation when q contains URL-encoded or special symbols', async () => {
    const errors = await validate(build('Austin%20TX'));
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('q');
  });
});
