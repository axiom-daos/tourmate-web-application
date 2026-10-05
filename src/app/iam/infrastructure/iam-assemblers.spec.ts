import { Agency } from '../domain/model/agency.entity';
import { TourGuide } from '../domain/model/tour-guide.entity';
import { User } from '../domain/model/user.entity';
import { UserRole } from '../domain/model/value-object/user-role';
import { AgencyAssembler } from './agency-assembler';
import { TourGuideAssembler } from './tour-guide-assembler';
import { UserAssembler } from './user-assembler';

describe('IAM assemblers', () => {
  it('maps a user without exposing server-managed credentials', () => {
    const assembler = new UserAssembler();
    const serverUser = {
      id: 4,
      email: 'guide@example.com',
      role: UserRole.GUIDE,
      firstName: 'Alex',
      lastName: 'Ramos',
      passwordHash: 'server-managed-secret',
    };
    const user = assembler.toEntityFromResource(serverUser);
    const resource = assembler.toResourceFromEntity(user);

    expect(user).toBeInstanceOf(User);
    expect(resource).toEqual({
      id: 4,
      email: 'guide@example.com',
      role: UserRole.GUIDE,
      firstName: 'Alex',
      lastName: 'Ramos',
    });
    expect('passwordHash' in resource).toBe(false);
  });

  it('maps agency details in both directions', () => {
    const assembler = new AgencyAssembler();
    const agency = new Agency({
      id: 2,
      ownerId: 7,
      businessName: 'Highland Trails',
      description: 'Guided treks',
      phone: '+51 987 000 111',
      contactEmail: 'hello@example.com',
      website: 'https://example.com',
      address: 'Cusco',
    });

    expect(assembler.toEntityFromResource(assembler.toResourceFromEntity(agency))).toEqual(agency);
  });

  it('copies tour-guide languages when mapping API data', () => {
    const assembler = new TourGuideAssembler();
    const languages = ['Spanish', 'Quechua'];
    const guide = assembler.toEntityFromResource({
      id: 3,
      userId: 8,
      agencyId: 2,
      languages,
      phoneNumber: '+51 981 000 222',
    });
    languages.push('English');

    expect(guide).toBeInstanceOf(TourGuide);
    expect(guide.languages).toEqual(['Spanish', 'Quechua']);
    expect(assembler.toResourceFromEntity(guide).languages).toEqual(['Spanish', 'Quechua']);
  });
});
