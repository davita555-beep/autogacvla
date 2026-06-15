'use client';

import Link from 'next/link';
import { useLang } from '@/contexts/LanguageContext';
import type { Listing } from '@/lib/supabase';

function CarPlaceholder() {
  return (
    <div className="w-full h-48 bg-slate-100 flex items-center justify-center">
      <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M19 17H5v-1a7 7 0 0114 0v1zM5 17H3v-1a2 2 0 012-2h.09M19 17h2v-1a2 2 0 00-2-2h-.09M7 10l2-5h6l2 5M3 14l1-3h16l1 3" />
      </svg>
    </div>
  );
}

export default function CarCard({ listing }: { listing: Listing }) {
  const { t } = useLang();

  const badgeClass =
    listing.type === 'exchange'
      ? 'bg-[#E67E22] text-white'
      : listing.type === 'sale'
      ? 'bg-[#27AE60] text-white'
      : 'bg-slate-700 text-white';

  const badgeText =
    listing.type === 'exchange'
      ? t.badges.exchange
      : listing.type === 'sale'
      ? t.badges.sale
      : t.badges.both;

  return (
    <Link href={`/listings/${listing.id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-slate-100">
        <div className="relative">
          {listing.photos && listing.photos.length > 0 ? (
            <img
              src={listing.photos[0]}
              alt={`${listing.make} ${listing.model}`}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <CarPlaceholder />
          )}
          <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full ${badgeClass}`}>
            {badgeText}
          </span>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-slate-900 text-lg leading-tight">
            {listing.make} {listing.model}
          </h3>
          <p className="text-slate-500 text-sm">{listing.year}</p>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-slate-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t.regions[listing.region]}
            </div>
            <div className="text-sm text-slate-500">
              {listing.mileage_km.toLocaleString()} {t.detail.km}
            </div>
          </div>

          {listing.price_gel && (
            <div className="mt-2 font-bold text-[#1B4F72] text-xl">
              {listing.price_gel.toLocaleString()} ₾
            </div>
          )}
          {!listing.price_gel && listing.type === 'exchange' && (
            <div className="mt-2 font-semibold text-[#E67E22] text-sm">
              {t.exchangePrefs[listing.exchange_preference ?? 'flexible']}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
