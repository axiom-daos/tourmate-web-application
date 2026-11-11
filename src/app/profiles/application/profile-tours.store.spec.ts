import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { Agency } from '../../iam/domain/model/agency.entity';
import { TourGuide } from '../../iam/domain/model/tour-guide.entity';
import { IamApi } from '../../iam/infrastructure/iam-api';
import { Price } from '../../tour-management/domain/model/price.entity';
import { Tour } from '../../tour-management/domain/model/tour.entity';
import { TourDetails } from '../../tour-management/domain/model/tour-details.entity';
import { TourSchedule } from '../../tour-management/domain/model/tour-schedule.entity';
import { TourManagementApi } from '../../tour-management/infrastructure/tour-management-api';
import { ActiveTour } from '../../tour-monitoring/domain/model/active-tour.entity';
import { Participant } from '../../tour-monitoring/domain/model/participant.entity';
import { TourMonitoringApi } from '../../tour-monitoring/infrastructure/tour-monitoring-api';
import { Profile } from '../domain/model/profile.entity';
import { ProfileRole } from '../domain/model/profile-role';
import { ProfileToursStore } from './profile-tours.store';
import { identifiersMatch } from './assigned-tour';

describe('ProfileToursStore', () => {
  it('matches numeric IDs returned as either strings or numbers', () => {
    expect(identifiersMatch('14', 14)).toBe(true);
    expect(identifiersMatch('invalid', 14)).toBe(false);
    expect(identifiersMatch(null, 14)).toBe(false);
  });

  const tours = [
    new Tour({
      id: 1,
      agencyId: 10,
      status: 'ACTIVE',
      details: new TourDetails({
        title: 'Mountain route',
        description: 'A guided route',
        duration: '1 day',
        difficulty: 'MEDIUM',
        price: new Price({ amount: 100, currency: 'USD' }),
      }),
    }),
    new Tour({
      id: 2,
      agencyId: 20,
      status: 'ACTIVE',
      details: new TourDetails({
        title: 'Coastal route',
        description: 'A coastal route',
        duration: '2 days',
        difficulty: 'EASY',
        price: new Price({ amount: 200, currency: 'USD' }),
      }),
    }),
  ];

  const schedules = [
    new TourSchedule({
      id: 101,
      tourId: 1,
      departureDateTime: '2026-11-12T08:00:00',
      maxCapacity: 10,
      status: 'SCHEDULED',
    }),
    new TourSchedule({
      id: 102,
      tourId: 2,
      departureDateTime: '2026-11-13T08:00:00',
      maxCapacity: 12,
      status: 'SCHEDULED',
    }),
  ];

  function createStore(options: {
    agencies?: Agency[];
    guides?: TourGuide[];
    activeTours?: ActiveTour[];
    participants?: Participant[];
    tours?: Tour[];
    schedules?: TourSchedule[];
  } = {}): ProfileToursStore {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: IamApi,
          useValue: {
            getAgencies: () => of(options.agencies ?? []),
            getTourGuides: () => of(options.guides ?? []),
          },
        },
        {
          provide: TourManagementApi,
          useValue: {
            getTours: () => of(options.tours ?? tours),
            getTourSchedules: () => of(options.schedules ?? schedules),
          },
        },
        {
          provide: TourMonitoringApi,
          useValue: {
            getActiveTours: () => of(options.activeTours ?? []),
            getParticipants: () => of(options.participants ?? []),
          },
        },
      ],
    });

    return TestBed.inject(ProfileToursStore);
  }

  it('resolves agency tours through the profile owner association', () => {
    const store = createStore({
      agencies: [
        new Agency({
          id: 10,
          ownerId: 4,
          businessName: 'Hiking Co',
          description: '',
          phone: '',
          contactEmail: '',
          website: '',
          address: '',
        }),
      ],
    });
    const profile = new Profile({
      id: 40,
      userId: 4,
      firstName: 'Agency',
      lastName: 'Owner',
      email: 'agency@example.com',
      role: ProfileRole.AGENCY,
    });

    let result: ReturnType<typeof store.tours> = [];
    store.loadForProfile(profile).subscribe((assigned) => (result = assigned));

    expect(result.map((item) => item.tour.id)).toEqual([1]);
    expect(result[0].schedules).toHaveLength(1);
    expect(result[0].assignment).toBe('agency');
  });

  it('resolves guide tours from active assignments only', () => {
    const store = createStore({
      guides: [
        new TourGuide({
          id: 7,
          userId: 5,
          agencyId: 10,
          languages: ['Spanish'],
          phoneNumber: '555-0100',
        }),
      ],
      activeTours: [
        new ActiveTour({
          id: 9,
          tourScheduleId: 101,
          guideId: 7,
          status: 'IN_PROGRESS',
          currentLatitude: 0,
          currentLongitude: 0,
          startedAt: '',
          finishedAt: '',
        }),
      ],
    });
    const profile = new Profile({
      id: 50,
      userId: 5,
      firstName: 'Tour',
      lastName: 'Guide',
      email: 'guide@example.com',
      role: ProfileRole.GUIDE,
    });

    let result: ReturnType<typeof store.tours> = [];
    store.loadForProfile(profile).subscribe((assigned) => (result = assigned));

    expect(result.map((item) => item.tour.id)).toEqual([1]);
    expect(result[0].schedules[0].activeStatus).toBe('IN_PROGRESS');
  });

  it('resolves tourist tours through participant and schedule associations', () => {
    const store = createStore({
      participants: [
        new Participant({
          id: 20,
          userId: 6,
          joinedAt: '2026-10-01',
          tourScheduleId: 102,
        }),
      ],
    });
    const profile = new Profile({
      id: 60,
      userId: 6,
      firstName: 'Travel',
      lastName: 'Guest',
      email: 'tourist@example.com',
      role: ProfileRole.TOURIST,
    });

    let result: ReturnType<typeof store.tours> = [];
    store.loadForProfile(profile).subscribe((assigned) => (result = assigned));

    expect(result.map((item) => item.tour.id)).toEqual([2]);
    expect(result[0].schedules[0].schedule.id).toBe(102);
    expect(result[0].assignment).toBe('tourist');
  });

  it('shows all tours to an administrator, including tours without departures', () => {
    const unscheduledTour = new Tour({
      id: 3,
      agencyId: 30,
      status: 'INACTIVE',
      details: new TourDetails({
        title: 'Unscheduled route',
        description: 'No departures yet',
        duration: '3 hours',
        difficulty: 'EASY',
        price: new Price({ amount: 50, currency: 'USD' }),
      }),
    });
    const store = createStore({
      tours: [...tours, unscheduledTour],
    });
    const profile = new Profile({
      id: 1,
      firstName: 'Platform',
      lastName: 'Admin',
      email: 'admin@example.com',
      role: ProfileRole.ADMIN,
    });

    let result: ReturnType<typeof store.tours> = [];
    store.loadForProfile(profile).subscribe((assigned) => (result = assigned));

    expect(result.map((item) => item.tour.id)).toEqual([1, 2, 3]);
    expect(result.every((item) => item.assignment === 'admin')).toBe(true);
    expect(result[2].schedules).toHaveLength(0);
  });
});
