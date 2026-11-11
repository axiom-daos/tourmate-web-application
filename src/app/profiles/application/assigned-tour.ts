import { Tour } from '../../tour-management/domain/model/tour.entity';
import { TourSchedule } from '../../tour-management/domain/model/tour-schedule.entity';

export type TourAssignment = 'admin' | 'agency' | 'guide' | 'tourist';

export function identifiersMatch(
  left: number | string | null | undefined,
  right: number | string | null | undefined,
): boolean {
  if (left === null || left === undefined || right === null || right === undefined) {
    return false;
  }

  const leftId = Number(left);
  const rightId = Number(right);

  return Number.isSafeInteger(leftId) && Number.isSafeInteger(rightId) && leftId === rightId;
}

export interface AssignedTourSchedule {
  schedule: TourSchedule;
  activeStatus: string | null;
}

export interface AssignedTour {
  tour: Tour;
  schedules: AssignedTourSchedule[];
  assignment: TourAssignment;
}
