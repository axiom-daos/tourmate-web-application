import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a tourGuide.
 */
export interface TourGuideResource extends BaseResource {
  /**
   * The unique identifier for the tourGuide.
   */
  id: number;

  /**
   * The user identifier for the tourGuide.
   */
  userId: number;
  agencyId: number;
  languages: string[];
  phoneNumber: string;

}

/**
 * Response envelope for tourGuide collection queries.
 */
export interface TourGuidesResponse extends BaseResponse {
  /**
   * The list of tourGuides returned by the API.
   */
  tourGuides: TourGuideResource[];
}
