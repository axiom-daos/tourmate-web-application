import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

export interface TourResource extends BaseResource {

  id: number,
  agencyId: number,
  details: {
    title: string,
    description: string,
    duration: string,
    difficulty: string,
    price: {
      amount: number,
      currency: string
    },
    status: string
  }

}


export interface ToursResponse extends BaseResponse {

  tours: TourResource[]
}
