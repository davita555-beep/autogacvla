'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/supabase';
import CarCard from '@/components/CarCard';

export default function HomePage() {
  const { t } = useLang();
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => setListings(data ?? []));
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="bg-[#1B4F72] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            {t.hero.title}
          </h1>
          <p className="text-blue-200 text-lg md:text-xl mb-10">
            {t.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/post?type=exchange"
              className="bg-[#E67E22] hover:bg-[#D35400] text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg"
            >
              {t.hero.exchangeCta}
            </Link>
            <Link
              href="/post?type=sale"
              className="bg-[#27AE60] hover:bg-[#1E8449] text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg"
            >
              {t.hero.saleCta}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-[#154060] text-blue-100 py-4 px-4">
        <div className="max-w-7xl mx-auto flex justify-center gap-8 text-sm font-medium">
          <span>🔄 {t.types.exchange}</span>
          <span>|</span>
          <span>💰 {t.types.sale}</span>
          <span>|</span>
          <span>📍 {t.regions.tbilisi} · {t.regions.batumi} · {t.regions.kutaisi}</span>
        </div>
      </section>

      {/* Latest listings */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{t.listings.latest}</h2>
          <Link href="/listings" className="text-[#1B4F72] font-semibold hover:underline">
            {t.listings.viewAll}
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M19 17H5v-1a7 7 0 0114 0v1zM7 10l2-5h6l2 5M3 14l1-3h16l1 3" />
            </svg>
            <p>{t.listings.noListings}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((l) => <CarCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>
    </>
  );
}
