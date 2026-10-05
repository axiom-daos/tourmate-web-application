import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Feature included in a subscription plan.
 */
export interface PlanFeature {
  description: string;
  value: string;
}

/**
 * Represents a Plan aggregate root in the subscriptions and payment management domain.
 */
export class Plan implements BaseEntity {
  #id: number;
  #name: string;
  #priceAmount: number;
  #priceCurrency: string;
  #features: PlanFeature[];

  constructor(plan: {
    id: number;
    name: string;
    priceAmount: number;
    priceCurrency: string;
    features?: PlanFeature[];
  }) {
    this.#id = plan.id;
    this.#name = plan.name;
    this.#priceAmount = plan.priceAmount;
    this.#priceCurrency = plan.priceCurrency;
    this.#features = plan.features ?? [];
  }

  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    this.#id = value;
  }

  get name(): string {
    return this.#name;
  }

  set name(value: string) {
    this.#name = value;
  }

  get priceAmount(): number {
    return this.#priceAmount;
  }

  set priceAmount(value: number) {
    this.#priceAmount = value;
  }

  get priceCurrency(): string {
    return this.#priceCurrency;
  }

  set priceCurrency(value: string) {
    this.#priceCurrency = value;
  }

  get features(): PlanFeature[] {
    return this.#features;
  }

  set features(value: PlanFeature[]) {
    this.#features = value;
  }

  /**
   * Adds a new feature item to this plan.
   * @param feature
   */
  addFeature(feature: PlanFeature): void {
    this.#features.push(feature);
  }

  /**
   * Modifies the price of this plan.
   * @param newAmount
   * @param newCurrency
   */
  changePrice(newAmount: number, newCurrency?: string): void {
    this.#priceAmount = newAmount;
    if (newCurrency) {
      this.#priceCurrency = newCurrency;
    }
  }
}
