
import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Review } from '../domain/model/aggregates/review.entity';
import { ReviewResource, ReviewsResponse } from './review-response';

/**
 * Maps review entities to and from API resources.
 */
export class ReviewAssembler implements BaseAssembler<
  Review,
  ReviewResource,
  ReviewsResponse
> {

  // Convertimos la respuesta de la API en entidades
  toEntitiesFromResponse = (response: ReviewsResponse): Review[] => {
    return response.reviews.map(
      resource => this.toEntityFromResource(resource)
    );
  };

  // Convertimos un recurso en una entidad Review
  toEntityFromResource = (resource: ReviewResource): Review =>
    new Review({
      id: resource.id,
      userId: resource.userId,
      tourId: resource.tourId,
      rating: resource.rating,
      createdAt: resource.createdAt
    });

  // Convertimos una entidad Review en un recurso
  toResourceFromEntity = (entity: Review): ReviewResource => ({
    id: entity.id,
    userId: entity.userId,
    tourId: entity.tourId,
    rating: entity.rating,
    createdAt: entity.createdAt
  });

}
