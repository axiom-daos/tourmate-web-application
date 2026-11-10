import { describe, expect, it } from 'vitest';
import { Profile } from '../domain/model/profile.entity';
import { ProfileRole } from '../domain/model/profile-role';
import { ProfileAssembler } from './profile-assembler';

describe('ProfileAssembler', () => {
  const assembler = new ProfileAssembler();

  it('maps the existing AGENCY_OWNER API role to the AGENCY profile role', () => {
    const profile = assembler.toEntityFromResource({
      id: 8,
      firstName: 'Lucia',
      lastName: 'Quispe',
      email: 'LUCIA@example.com',
      role: 'AGENCY_OWNER',
    });

    expect(profile.role).toBe(ProfileRole.AGENCY);
    expect(profile.email).toBe('lucia@example.com');
  });

  it('uses the userId association when it differs from the profile identifier', () => {
    const profile = assembler.toEntityFromResource({
      id: 80,
      userId: '8',
      firstName: 'Lucia',
      lastName: 'Quispe',
      email: 'lucia@example.com',
      role: ProfileRole.GUIDE,
    });

    expect(profile.id).toBe(80);
    expect(profile.userId).toBe(8);
  });

  it('maps an AGENCY profile back to the existing API role', () => {
    const resource = assembler.toResourceFromEntity(
      new Profile({
        id: 8,
        firstName: 'Lucia',
        lastName: 'Quispe',
        email: 'lucia@example.com',
        role: ProfileRole.AGENCY,
      }),
    );

    expect(resource.role).toBe('AGENCY_OWNER');
  });

  it('rejects unsupported API roles', () => {
    expect(() =>
      assembler.toEntityFromResource({
        id: 8,
        firstName: 'Lucia',
        lastName: 'Quispe',
        email: 'lucia@example.com',
        role: 'UNKNOWN' as ProfileRole,
      }),
    ).toThrow('Unsupported profile role: UNKNOWN');
  });
});
