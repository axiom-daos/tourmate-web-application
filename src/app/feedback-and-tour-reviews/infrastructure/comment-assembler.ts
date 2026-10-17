
import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Comment } from '../domain/model/aggregates/comment.entity';
import {
  CommentResource,
  CommentsResponse
} from './comment-response';

/**
 * Maps comment entities to and from API resources.
 */
export class CommentAssembler implements BaseAssembler<
  Comment,
  CommentResource,
  CommentsResponse
> {

  // Convertimos la respuesta de la API en entidades
  toEntitiesFromResponse = (response: CommentsResponse): Comment[] => {
    return response.comments.map(
      resource => this.toEntityFromResource(resource)
    );
  };

  // Convertimos un recurso en una entidad Comment
  toEntityFromResource = (resource: CommentResource): Comment =>
    new Comment({
      id: resource.id,
      reviewId: resource.reviewId,
      content: resource.content,
      createdAt: resource.createdAt
    });

  // Convertimos una entidad Comment en un recurso
  toResourceFromEntity = (entity: Comment): CommentResource => ({
    id: entity.id,
    reviewId: entity.reviewId,
    content: entity.content,
    createdAt: entity.createdAt
  });

}
