'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/supabase';

function CarPlaceholder() {
  return (
    <div className="w-full h-80 bg-slate-100 flex items-center justify-center rounded-xl">
      <svg className="w-24 h-24 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M19 17H5v-1a7 7 0 0114 0v1zM7 10l2-5h6l2 5M3 14l1-3h16l1 3" />
      </svg>
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLang();
  const [listing, setListing] = useState<Listing | null>(null);
  const [mainPhoto, setMainPhoto] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('listings').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setListing(data);
        supabase.from('listings').update({ views: (data.views ?? 0) + 1 }).eq('id', id);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-80 bg-slate-200 rounded-xl" />
          <div className="h-6 bg-slate-200 rounded w-1/2" />
          <div className="h-4 bg-slate-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-slate-500">
        <p className="text-xl font-semibold">Listing not found</p>
        <Link href="/listings" className="mt-4 inline-block text-[#1B4F72] underline">← {t.nav.browse}</Link>
      </div>
    );
  }

  const description =
    (lang === 'ka' ? listing.description_ka : lang === 'ru' ? listing.description_ru : listing.description_en)
    ?? listing.description_ka ?? '';

  const photos = listing.photos ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/listings" className="text-sm text-[#1B4F72] hover:underline mb-6 inline-block">
        ← {t.nav.browse}
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: photos + details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery */}
          <div>
            {photos.length > 0 ? (
              <>
                <img
                  src={photos[mainPhoto]}
                  alt={`${listing.make} ${listing.model}`}
                  className="w-full h-80 object-cover rounded-xl"
                />
                {photos.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {photos.map((p, i) => (
                      <button key={i} onClick={() => setMainPhoto(i)}>
                        <img
                          src={p}
                          alt=""
                          className={`w-20 h-16 object-cover rounded-lg border-2 transition-colors ${
                            i === mainPhoto ? 'border-[#1B4F72]' : 'border-transparent'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <CarPlaceholder />
            )}
          </div>

          {/* Title */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-slate-900">
                {listing.make} {listing.model} {listing.year}
              </h1>
              <div className="flex items-center gap-1 text-slate-400 text-sm shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {listing.views} {t.detail.views}
              </div>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              {t.detail.posted}: {new Date(listing.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Specs */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-bold text-slate-800 mb-4">{t.detail.specs}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: t.detail.mileage, value: `${listing.mileage_km.toLocaleString()} ${t.detail.km}` },
                { label: t.detail.fuel, value: t.fuels[listing.fuel] },
                { label: t.detail.transmission, value: t.transmissions[listing.transmission] },
                { label: t.detail.condition, value: t.conditions[listing.condition] },
                { label: t.detail.region, value: t.regions[listing.region] },
                { label: t.detail.color, value: listing.color },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 font-medium uppercase">{label}</p>
                  <p className="font-semibold text-slate-800 mt-1">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Exchange terms */}
          {(listing.type === 'exchange' || listing.type === 'both') && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h2 className="font-bold text-amber-800 mb-3">🔄 {t.detail.exchangeTerms}</h2>
              <div className="space-y-2 text-sm text-amber-900">
                {listing.exchange_preference && (
                  <p><span className="font-semibold">{t.filters.exchangePref}:</span> {t.exchangePrefs[listing.exchange_preference]}</p>
                )}
                {listing.wants_make && (
                  <p><span className="font-semibold">{t.detail.wantsCar}:</span> {listing.wants_make}
                    {(listing.wants_year_from || listing.wants_year_to) && (
                      <span> ({listing.wants_year_from}–{listing.wants_year_to})</span>
                    )}
                  </p>
                )}
                {listing.surcharge_gel && (
                  <p><span className="font-semibold">{t.detail.surcharge}:</span> {listing.surcharge_gel.toLocaleString()} ₾</p>
                )}
              </div>
            </div>
          )}

          {/* Price */}
          {listing.price_gel && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <p className="text-sm text-green-700 font-medium">{t.detail.myPrice}</p>
              <p className="text-3xl font-bold text-green-800">{listing.price_gel.toLocaleString()} ₾</p>
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-bold text-slate-800 mb-3">{t.detail.description}</h2>
              <p className="text-slate-600 whitespace-pre-line leading-relaxed">{description}</p>
            </div>
          )}
        </div>

        {/* Right: contact sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 sticky top-20">
            <h2 className="font-bold text-slate-800 mb-4">
              {listing.make} {listing.model}
            </h2>

            {(listing.type === 'exchange' || listing.type === 'both') && (
              <Link
                href={`/swap-offer/${listing.id}`}
                className="block w-full text-center bg-[#E67E22] hover:bg-[#D35400] text-white font-bold py-3 rounded-xl mb-3 transition-colors"
              >
                {t.detail.sendOffer}
              </Link>
            )}

            <a
              href={`tel:${listing.contact_phone}`}
              className="block w-full text-center bg-[#1B4F72] hover:bg-[#154060] text-white font-bold py-3 rounded-xl mb-3 transition-colors"
            >
              {t.detail.callSeller} {listing.contact_phone}
            </a>

            {listing.contact_whatsapp && (
              <a
                href={`https://wa.me/${listing.contact_whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3 rounded-xl transition-colors"
              >
                {t.detail.whatsapp} 💬
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
