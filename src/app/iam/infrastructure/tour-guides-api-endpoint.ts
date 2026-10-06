import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { TourGuide } from '../domain/model/tour-guide.entity';
import { TourGuideAssembler } from './tour-guide-assembler';
import { TourGuideResource, TourGuidesResponse } from './tour-guide-response';

export class TourGuidesApiEndpoint extends BaseApiEndpoint<
  TourGuide,
  TourGuideResource,
  TourGuidesResponse,
  TourGuideAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.tourmateProviderApiBaseUrl}${environment.tourmateProviderTourGuidesEndpointPath}`,
      new TourGuideAssembler(),
    );
  }
}
