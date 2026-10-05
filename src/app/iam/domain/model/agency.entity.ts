import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class Agency implements BaseEntity {
  #id: number;
  #ownerId: number;
  #businessName: string;
  #description: string;
  #phone: string;
  #contactEmail: string;
  #website: string;
  #address: string;

  constructor(agency: {
    id: number;
    ownerId: number;
    businessName: string;
    description: string;
    phone: string;
    contactEmail: string;
    website: string;
    address: string;
  }) {
    this.#id = agency.id;
    this.#ownerId = agency.ownerId;
    this.#businessName = agency.businessName;
    this.#description = agency.description;
    this.#phone = agency.phone;
    this.#contactEmail = agency.contactEmail;
    this.#website = agency.website;
    this.#address = agency.address;
  }

  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    this.#id = value;
  }

  get ownerId(): number {
    return this.#ownerId;
  }

  set ownerId(value: number) {
    this.#ownerId = value;
  }

  get businessName(): string {
    return this.#businessName;
  }

  set businessName(value: string) {
    this.#businessName = value;
  }

  get description(): string {
    return this.#description;
  }

  set description(value: string) {
    this.#description = value;
  }

  get phone(): string {
    return this.#phone;
  }

  set phone(value: string) {
    this.#phone = value;
  }

  get contactEmail(): string {
    return this.#contactEmail;
  }

  set contactEmail(value: string) {
    this.#contactEmail = value;
  }

  get website(): string {
    return this.#website;
  }

  set website(value: string) {
    this.#website = value;
  }

  get address(): string {
    return this.#address;
  }

  set address(value: string) {
    this.#address = value;
  }
}
