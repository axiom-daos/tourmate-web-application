import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { UserRole } from './value-object/user-role';

export class User implements BaseEntity {
  #id: number;
  #email: string;
  #role: UserRole;
  #firstName: string;
  #lastName: string;

  constructor(user: {
    id: number;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  }) {
    this.#id = user.id;
    this.#email = user.email;
    this.#role = user.role;
    this.#firstName = user.firstName;
    this.#lastName = user.lastName;
  }

  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    this.#id = value;
  }

  get email(): string {
    return this.#email;
  }

  set email(value: string) {
    this.#email = value;
  }

  get role(): UserRole {
    return this.#role;
  }

  set role(value: UserRole) {
    this.#role = value;
  }

  get firstName(): string {
    return this.#firstName;
  }

  set firstName(value: string) {
    this.#firstName = value;
  }

  get lastName(): string {
    return this.#lastName;
  }

  set lastName(value: string) {
    this.#lastName = value;
  }
}
