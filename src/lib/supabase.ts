import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export type ListingType = 'exchange' | 'sale' | 'both';
export type ExchangePref = '1to1' | 'i_add_money' | 'they_add_money' | 'flexible';
export type Condition = 'excellent' | 'good' | 'fair' | 'parts';
export type Fuel = 'petrol' | 'diesel' | 'hybrid' | 'electric';
export type Transmission = 'auto' | 'manual';
export type Region = 'tbilisi' | 'batumi' | 'kutaisi' | 'rustavi' | 'other';
export type ListingStatus = 'active' | 'sold' | 'flagged';

export interface Listing {
  id: string;
  type: ListingType;
  exchange_preference: ExchangePref | null;
  price_gel: number | null;
  surcharge_gel: number | null;
  make: string;
  model: string;
  year: number;
  mileage_km: number;
  condition: Condition;
  color: string;
  fuel: Fuel;
  transmission: Transmission;
  wants_make: string | null;
  wants_year_from: number | null;
  wants_year_to: number | null;
  description_ka: string | null;
  description_ru: string | null;
  description_en: string | null;
  contact_phone: string;
  contact_whatsapp: string | null;
  region: Region;
  photos: string[];
  status: ListingStatus;
  created_at: string;
  expires_at: string | null;
  views: number;
  boost_until: string | null;
}

export interface SwapOffer {
  id: string;
  listing_id: string;
  offerer_make: string;
  offerer_model: string;
  offerer_year: number;
  offerer_mileage_km: number;
  offerer_photos: string[];
  offer_type: '1to1' | 'i_add' | 'they_add';
  offer_amount_gel: number | null;
  offerer_phone: string;
  message: string | null;
  created_at: string;
}
