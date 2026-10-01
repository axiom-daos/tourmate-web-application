import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';


export interface ActiveToursResource extends BaseResource{
  id: number;
  tourScheduleId: string;
  guideId: string;
  status: string;
  currentLatitude: number;
  currentLongitude: number;
  startedAt: string;
  finishedAt: string;
}

export interface ActiveToursResponse extends BaseResponse{
  activeTours: ActiveToursResource[];
}
