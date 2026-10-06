import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Checkpoint } from '../domain/model/checkpoint.entity';
import { CheckpointResource, CheckpointsResponse } from './checkpoint-response';

export class CheckpointAssembler
  implements BaseAssembler<Checkpoint, CheckpointResource, CheckpointsResponse>
{
  toEntityFromResource(resource: CheckpointResource): Checkpoint {
    return new Checkpoint({
      id: resource.id,
      tourId: resource.tourId,
      name: resource.name,
      latitude: resource.latitude,
      longitude: resource.longitude,
      orderIndex: resource.orderIndex,
      description: resource.description,
    });
  }

  toResourceFromEntity(entity: Checkpoint): CheckpointResource {
    return {
      id: entity.id,
      tourId: entity.tourId,
      name: entity.name,
      latitude: entity.latitude,
      longitude: entity.longitude,
      orderIndex: entity.orderIndex,
      description: entity.description,
    };
  }

  toEntitiesFromResponse(response: CheckpointsResponse): Checkpoint[] {
    return response.checkpoints.map((resource) => this.toEntityFromResource(resource));
  }
}
