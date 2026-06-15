'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import type { Listing, SwapOffer } from '@/lib/supabase';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'autogacvla2024' : '';

export default function AdminPage() {
  const { t } = useLang();
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState<'listings' | 'offers'>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [offers, setOffers] = useState<SwapOffer[]>([]);
  const [stats, setStats] = useState({ active: 0, sold: 0, flagged: 0, today: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('admin_authed');
      if (stored === '1') setAuthed(true);
    }
  }, []);

  const login = () => {
    if (pw === 'autogacvla2024') {
      sessionStorage.setItem('admin_authed', '1');
      setAuthed(true);
    } else {
      setPwError(true);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const [{ data: ls }, { data: ofs }] = await Promise.all([
      supabase.from('listings').select('*').order('created_at', { ascending: false }),
      supabase.from('swap_offers').select('*').order('created_at', { ascending: false }),
    ]);
    const all = ls ?? [];
    const today = new Date().toDateString();
    setListings(all);
    setOffers(ofs ?? []);
    setStats({
      active: all.filter((l) => l.status === 'active').length,
      sold: all.filter((l) => l.status === 'sold').length,
      flagged: all.filter((l) => l.status === 'flagged').length,
      today: all.filter((l) => new Date(l.created_at).toDateString() === today).length,
    });
    setLoading(false);
  };

  useEffect(() => {
    if (authed) loadData();
  }, [authed]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('listings').update({ status }).eq('id', id);
    await loadData();
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    await supabase.from('listings').delete().eq('id', id);
    await loadData();
  };

  const boostListing = async (id: string) => {
    const boost_until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('listings').update({ boost_until }).eq('id', id);
    await loadData();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      sold: 'bg-slate-100 text-slate-600',
      flagged: 'bg-red-100 text-red-600',
    };
    const labels: Record<string, string> = {
      active: t.listings.active,
      sold: t.listings.sold,
      flagged: t.listings.flagged,
    };
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? ''}`}>
        {labels[status] ?? status}
      </span>
    );
  };

  if (!authed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-6 text-center">{t.admin.title}</h1>
          <label className="block text-sm font-semibold text-slate-700 mb-1">{t.admin.passwordLabel}</label>
          <input
            type="password"
            className={`w-full border rounded-lg px-3 py-2 mb-1 ${pwError ? 'border-red-400' : 'border-slate-200'}`}
            value={pw}
            onChange={(e) => { setPw(e.target.value); setPwError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            autoFocus
          />
          {pwError && <p className="text-red-500 text-xs mb-3">{t.admin.wrongPassword}</p>}
          <button
            onClick={login}
            className="w-full mt-3 bg-[#1B4F72] text-white font-bold py-2.5 rounded-xl hover:bg-[#154060] transition-colors"
          >
            {t.admin.loginBtn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t.admin.title}</h1>
        <button
          onClick={() => { sessionStorage.removeItem('admin_authed'); setAuthed(false); }}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: t.admin.stats.active, value: stats.active, color: 'text-green-600' },
          { label: t.admin.stats.sold, value: stats.sold, color: 'text-slate-600' },
          { label: t.admin.stats.flagged, value: stats.flagged, color: 'text-red-600' },
          { label: t.admin.stats.today, value: stats.today, color: 'text-[#1B4F72]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-center">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-slate-500 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-slate-200">
        {(['listings', 'offers'] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              tab === tb ? 'border-[#1B4F72] text-[#1B4F72]' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tb === 'listings' ? t.admin.tabs.listings : t.admin.tabs.swapOffers}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tab === 'listings' ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {[t.admin.cols.car, t.admin.cols.type, t.admin.cols.status, t.admin.cols.date, t.admin.cols.views, t.admin.cols.actions].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {listings.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {l.photos?.[0] ? (
                        <img src={l.photos[0]} alt="" className="w-12 h-9 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-9 bg-slate-100 rounded" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-800">{l.make} {l.model}</p>
                        <p className="text-slate-400 text-xs">{l.year}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      l.type === 'exchange' ? 'bg-amber-100 text-amber-700' : l.type === 'sale' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {t.types[l.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{statusBadge(l.status)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(l.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{l.views}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {l.status !== 'sold' && (
                        <button onClick={() => updateStatus(l.id, 'sold')}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors">
                          {t.admin.actions.markSold}
                        </button>
                      )}
                      {l.status === 'active' && (
                        <button onClick={() => updateStatus(l.id, 'flagged')}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded transition-colors">
                          {t.admin.actions.flag}
                        </button>
                      )}
                      {l.status === 'flagged' && (
                        <button onClick={() => updateStatus(l.id, 'active')}
                          className="text-xs bg-green-50 hover:bg-green-100 text-green-600 px-2 py-1 rounded transition-colors">
                          {t.admin.actions.restore}
                        </button>
                      )}
                      <button onClick={() => boostListing(l.id)}
                        className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1 rounded transition-colors">
                        {t.admin.actions.boost}
                      </button>
                      <button onClick={() => deleteListing(l.id)}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors">
                        {t.admin.actions.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {listings.length === 0 && (
            <div className="text-center py-12 text-slate-400">{t.listings.noListings}</div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Car', 'Offer Type', 'Amount', 'Phone', 'Message', 'Date'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {offers.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{o.offerer_make} {o.offerer_model} {o.offerer_year}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                      {t.swapOffer.offerTypes[o.offer_type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{o.offer_amount_gel ? `${o.offer_amount_gel.toLocaleString()} ₾` : '—'}</td>
                  <td className="px-4 py-3">
                    <a href={`tel:${o.offerer_phone}`} className="text-[#1B4F72] hover:underline">{o.offerer_phone}</a>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{o.message ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {offers.length === 0 && (
            <div className="text-center py-12 text-slate-400">{t.listings.noListings}</div>
          )}
        </div>
      )}
    </div>
  );
}
