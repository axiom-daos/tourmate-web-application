import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

export interface TourResource extends BaseResource {

  id: number,
  agencyId: number,
  title: string,
  description: string,
  duration: string,
  difficulty: string,
  priceAmount: number,
  priceCurrency: string,
  status: string
}


export interface ToursResponse extends BaseResponse {

  tours: TourResource[]
}
