'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import type { Listing, ListingType, ExchangePref, Region } from '@/lib/supabase';
import CarCard from '@/components/CarCard';

const PAGE_SIZE = 12;

type SortOption = 'newest' | 'price_asc' | 'price_desc';

interface Filters {
  type: ListingType | '';
  exchangePref: ExchangePref | '';
  make: string;
  yearFrom: string;
  yearTo: string;
  priceFrom: string;
  priceTo: string;
  region: Region | '';
}

const defaultFilters: Filters = {
  type: '', exchangePref: '', make: '', yearFrom: '',
  yearTo: '', priceFrom: '', priceTo: '', region: '',
};

export default function ListingsPage() {
  const { t } = useLang();
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [applied, setApplied] = useState<Filters>(defaultFilters);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('listings').select('*', { count: 'exact' }).eq('status', 'active');

    if (applied.type) q = q.eq('type', applied.type);
    if (applied.exchangePref) q = q.eq('exchange_preference', applied.exchangePref);
    if (applied.make) q = q.ilike('make', `%${applied.make}%`);
    if (applied.yearFrom) q = q.gte('year', parseInt(applied.yearFrom));
    if (applied.yearTo) q = q.lte('year', parseInt(applied.yearTo));
    if (applied.priceFrom) q = q.gte('price_gel', parseInt(applied.priceFrom));
    if (applied.priceTo) q = q.lte('price_gel', parseInt(applied.priceTo));
    if (applied.region) q = q.eq('region', applied.region);

    if (sort === 'newest') q = q.order('created_at', { ascending: false });
    else if (sort === 'price_asc') q = q.order('price_gel', { ascending: true });
    else q = q.order('price_gel', { ascending: false });

    q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, count } = await q;
    setListings(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [applied, sort, page]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 sticky top-20">
            <h2 className="font-bold text-slate-800 mb-4">{t.filters.title}</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">{t.filters.type}</label>
                <select
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as ListingType | '' })}
                >
                  <option value="">{t.filters.allTypes}</option>
                  <option value="exchange">{t.types.exchange}</option>
                  <option value="sale">{t.types.sale}</option>
                  <option value="both">{t.types.both}</option>
                </select>
              </div>

              {(filters.type === 'exchange' || filters.type === 'both' || filters.type === '') && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">{t.filters.exchangePref}</label>
                  <select
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    value={filters.exchangePref}
                    onChange={(e) => setFilters({ ...filters, exchangePref: e.target.value as ExchangePref | '' })}
                  >
                    <option value="">{t.filters.allPrefs}</option>
                    <option value="1to1">{t.exchangePrefs['1to1']}</option>
                    <option value="i_add_money">{t.exchangePrefs.i_add_money}</option>
                    <option value="they_add_money">{t.exchangePrefs.they_add_money}</option>
                    <option value="flexible">{t.exchangePrefs.flexible}</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">{t.filters.make}</label>
                <input
                  type="text"
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder={t.filters.makePlaceholder}
                  value={filters.make}
                  onChange={(e) => setFilters({ ...filters, make: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">{t.filters.yearFrom}</label>
                  <input
                    type="number"
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="1990"
                    value={filters.yearFrom}
                    onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">{t.filters.yearTo}</label>
                  <input
                    type="number"
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="2026"
                    value={filters.yearTo}
                    onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">{t.filters.priceFrom}</label>
                  <input
                    type="number"
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="0"
                    value={filters.priceFrom}
                    onChange={(e) => setFilters({ ...filters, priceFrom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">{t.filters.priceTo}</label>
                  <input
                    type="number"
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="∞"
                    value={filters.priceTo}
                    onChange={(e) => setFilters({ ...filters, priceTo: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">{t.filters.region}</label>
                <select
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={filters.region}
                  onChange={(e) => setFilters({ ...filters, region: e.target.value as Region | '' })}
                >
                  <option value="">{t.filters.allRegions}</option>
                  {(['tbilisi', 'batumi', 'kutaisi', 'rustavi', 'other'] as Region[]).map((r) => (
                    <option key={r} value={r}>{t.regions[r]}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setApplied(filters); setPage(0); }}
                  className="flex-1 bg-[#1B4F72] text-white text-sm font-semibold py-2 rounded-lg hover:bg-[#154060] transition-colors"
                >
                  {t.filters.apply}
                </button>
                <button
                  onClick={() => { setFilters(defaultFilters); setApplied(defaultFilters); setPage(0); }}
                  className="flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {t.filters.reset}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-500 text-sm">{total} {t.listings.noListings === 'No listings found' ? 'results' : 'შედეგი'}</p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">{t.sort.label}:</label>
              <select
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                value={sort}
                onChange={(e) => { setSort(e.target.value as SortOption); setPage(0); }}
              >
                <option value="newest">{t.sort.newest}</option>
                <option value="price_asc">{t.sort.priceAsc}</option>
                <option value="price_desc">{t.sort.priceDesc}</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M19 17H5v-1a7 7 0 0114 0v1zM7 10l2-5h6l2 5M3 14l1-3h16l1 3" />
              </svg>
              <p className="font-semibold">{t.listings.noListings}</p>
              <p className="text-sm mt-1">{t.listings.noListingsHint}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {listings.map((l) => <CarCard key={l.id} listing={l} />)}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50"
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                        i === page
                          ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
