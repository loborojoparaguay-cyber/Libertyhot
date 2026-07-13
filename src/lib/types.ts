export type UserRole = "subscriber" | "creator" | "admin";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  is_age_verified: boolean;
  created_at: string;
}

export interface CreatorProfile extends Profile {
  role: "creator";
  is_creator_verified: boolean; // KYC / documento de identidad aprobado
  subscription_price_monthly: number; // en Gs. o USD segun moneda base
  cover_url: string | null;
}

export interface SubscriptionPlan {
  id: string;
  creator_id: string;
  name: string;
  price: number;
  currency: "PYG" | "USD";
  interval: "monthly" | "yearly";
  is_free: boolean;
}

export interface Subscription {
  id: string;
  subscriber_id: string;
  creator_id: string;
  plan_id: string;
  status: "active" | "canceled" | "expired" | "pending_payment";
  current_period_end: string;
}

export interface ContentPost {
  id: string;
  creator_id: string;
  caption: string | null;
  media_url: string;
  media_type: "image" | "video";
  is_locked: boolean; // true = solo visible para suscriptores activos
  price_unlock: number | null; // pay-per-view opcional
  created_at: string;
}

export interface Payment {
  id: string;
  payer_id: string;
  creator_id: string | null;
  amount: number;
  currency: "PYG" | "USD" | "USDT" | "BTC";
  provider: "coinbase_commerce" | "pagopar" | "bancard" | "manual";
  status: "pending" | "completed" | "failed";
  reference: string;
  created_at: string;
}
