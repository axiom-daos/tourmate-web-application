import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Checkpoint } from '../domain/model/checkpoint.entity';
import { CheckpointAssembler } from './checkpoint-assembler';
import { CheckpointResource, CheckpointsResponse } from './checkpoint-response';

export class CheckpointsApiEndpoint extends BaseApiEndpoint<
  Checkpoint,
  CheckpointResource,
  CheckpointsResponse,
  CheckpointAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.checkpointsApiBaseUrl}${environment.tourmateProviderCheckpointsEndpointPath}`,
      new CheckpointAssembler(),
    );
  }

  getForTour(tourId: number): Observable<Checkpoint[]> {
    const params = new HttpParams().set('tourId', tourId);
    return this.http.get<CheckpointResource[]>(this.endpointUrl, { params }).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to fetch checkpoints')),
    );
  }
}
