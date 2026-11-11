import {BaseResponse} from '../../shared/infrastructure/base-response';


export interface ActiveTourResource {
  id: number;
  tourScheduleId: number | string;
  guideId?: number | string;
  tourGuideId?: number | string;
  status?: string | null;
  currentLatitude: number;
  currentLongitude: number;
  startedAt: string;
  finishedAt: string | null;
}

export interface ActiveToursResponse extends BaseResponse{
  activeTours: ActiveTourResource[];
}
