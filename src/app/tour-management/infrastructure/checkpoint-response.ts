import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface CheckpointResource extends BaseResource {
  id: number;
  tourId: number;
  name: string;
  latitude: number;
  longitude: number;
  orderIndex: number;
  description: string;
}

export interface CheckpointsResponse extends BaseResponse {
  checkpoints: CheckpointResource[];
}
