import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { ProfileRole } from './profile-role';

export class Profile implements BaseEntity {
  #id: number;
  #userId: number;
  #firstName: string;
  #lastName: string;
  #email: string;
  #role: ProfileRole;

  constructor(profile: {
    id: number;
    userId?: number | string;
    firstName: string;
    lastName: string;
    email: string;
    role: ProfileRole;
  }) {
    this.#id = Number(profile.id);
    this.#userId = Number(profile.userId ?? profile.id);
    this.#firstName = profile.firstName.trim();
    this.#lastName = profile.lastName.trim();
    this.#email = profile.email.trim().toLowerCase();
    this.#role = profile.role;
  }

  get id(): number {
    return this.#id;
  }

  get userId(): number {
    return this.#userId;
  }

  get firstName(): string {
    return this.#firstName;
  }

  get lastName(): string {
    return this.#lastName;
  }

  get email(): string {
    return this.#email;
  }

  get role(): ProfileRole {
    return this.#role;
  }

  get fullName(): string {
    return `${this.#firstName} ${this.#lastName}`.trim();
  }
}
