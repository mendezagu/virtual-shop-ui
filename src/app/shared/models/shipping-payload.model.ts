// src/app/shared/models/shipping-payload.model.ts

export interface ShippingPayload {
  pricePerKm: number;
  minShippingCost: number;
  freeShippingThreshold: number;
}
