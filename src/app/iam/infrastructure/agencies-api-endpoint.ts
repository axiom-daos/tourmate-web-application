import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Agency } from '../domain/model/agency.entity';
import { AgenciesResponse, AgencyResource } from './agency-response';
import { AgencyAssembler } from './agency-assembler';

export class AgenciesApiEndpoint extends BaseApiEndpoint<
  Agency,
  AgencyResource,
  AgenciesResponse,
  AgencyAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.tourmateProviderApiBaseUrl}${environment.tourmateProviderAgenciesEndpointPath}`,
      new AgencyAssembler(),
    );
  }
}
