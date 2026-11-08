import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Review } from '../domain/model/aggregates/review.entity';
import { ReviewResource, ReviewsResponse } from './review-response';

/**
 * Converts API resources into Review entities
 * and Review entities into API resources.
 *
 * Bounded Context: Feedback and Tour Reviews.
 */
export class ReviewAssembler implements BaseAssembler<Review, ReviewResource, ReviewsResponse> {
  /**
   * Converts an identifier from the API
   * into a valid numeric identifier.
   *
   * Supports numeric IDs and numeric strings.
   */
  private parseId(value: number | string, field: string): number {
    const normalized = typeof value === 'string' ? value.trim() : value;

    const id =
      typeof normalized === 'string' && /^\d+$/.test(normalized)
        ? Number(normalized)
        : typeof normalized === 'number'
          ? normalized
          : NaN;

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error(`El campo ${field} contiene un identificador inválido.`);
    }

    return id;
  }

  /**
   * Converts the rating into a valid number.
   */
  private parseRating(value: number | string): number {
    const rating =
      typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : typeof value === 'number'
          ? value
          : NaN;

    Review.validateRating(rating);

    return rating;
  }

  /**
   * Converts an API response into Review entities.
   */
  toEntitiesFromResponse = (response: ReviewsResponse): Review[] => {
    if (!Array.isArray(response.reviews)) {
      throw new Error('La respuesta de reseñas no tiene un formato válido.');
    }

    return response.reviews.map((resource) => this.toEntityFromResource(resource));
  };

  /**
   * Converts an API resource into a Review entity.
   */
  toEntityFromResource = (resource: ReviewResource): Review => {
    return new Review({
      id: this.parseId(resource.id, 'id'),
      userId: this.parseId(resource.userId, 'userId'),
      tourId: this.parseId(resource.tourId, 'tourId'),
      rating: this.parseRating(resource.rating),
      createdAt: resource.createdAt,
    });
  };

  /**
   * Converts a Review entity into an API resource.
   */
  toResourceFromEntity = (entity: Review): ReviewResource => {
    return {
      id: entity.id,
      userId: entity.userId,
      tourId: entity.tourId,
      rating: entity.rating,
      createdAt: entity.createdAt,
    };
  };
}
