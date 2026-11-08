import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Comment } from '../domain/model/aggregates/comment.entity';
import { CommentResource, CommentsResponse } from './comment-response';

/**
 * Converts API resources into Comment entities
 * and Comment entities into API resources.
 *
 * Bounded Context: Feedback and Tour Reviews.
 */
export class CommentAssembler implements BaseAssembler<Comment, CommentResource, CommentsResponse> {
  /**
   * Converts a numeric or string identifier
   * into a valid positive number.
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
   * Converts an API response into Comment entities.
   */
  toEntitiesFromResponse = (response: CommentsResponse): Comment[] => {
    if (!Array.isArray(response.comments)) {
      throw new Error('La respuesta de comentarios no tiene un formato válido.');
    }

    return response.comments.map((resource) => this.toEntityFromResource(resource));
  };

  /**
   * Converts an API resource into a Comment entity.
   */
  toEntityFromResource = (resource: CommentResource): Comment => {
    return new Comment({
      id: this.parseId(resource.id, 'id'),
      reviewId: this.parseId(resource.reviewId, 'reviewId'),
      content: resource.content,
      createdAt: resource.createdAt,
    });
  };

  /**
   * Converts a Comment entity into an API resource.
   */
  toResourceFromEntity = (entity: Comment): CommentResource => {
    return {
      id: entity.id,
      reviewId: entity.reviewId,
      content: entity.content,
      createdAt: entity.createdAt,
    };
  };
}
