import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Review } from '../domain/model/aggregates/review.entity';
import { ReviewResource, ReviewsResponse } from './review-response';

export class ReviewAssembler implements BaseAssembler<Review, ReviewResource, ReviewsResponse> {
  toEntitiesFromResponse = (response: ReviewsResponse): Review[] => {
    // Si la API devuelve un array directo (como json-server), se ajusta aquí
    const data = Array.isArray(response) ? response : response.reviews;
    return data.map((resource) => this.toEntityFromResource(resource));
  };

  toEntityFromResource = (resource: ReviewResource): Review =>
    new Review({
      id: resource.id,
      userId: resource.userId,
      tourId: resource.tourId,
      rating: resource.rating,
      createdAt: resource.createdAt,
    });

  toResourceFromEntity = (entity: Review): ReviewResource =>
    ({
      id: entity.id,
      userId: entity.userId,
      tourId: entity.tourId,
      rating: entity.rating,
      createdAt: entity.createdAt,
    }) as ReviewResource;
}
