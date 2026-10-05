import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';


export interface ActiveTourResource extends BaseResource{
  id: number;
  tourScheduleId: number;
  guideId: number;
  status: string;
  currentLatitude: number;
  currentLongitude: number;
  startedAt: string;
  finishedAt: string;
}

export interface ActiveToursResponse extends BaseResponse{
  activeTours: ActiveTourResource[];
}
