'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/supabase';

type OfferType = '1to1' | 'i_add' | 'they_add';

const YEARS = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => 2026 - i);

export default function SwapOfferPage() {
  const { listing_id } = useParams<{ listing_id: string }>();
  const { t } = useLang();
  const router = useRouter();

  const [listing, setListing] = useState<Listing | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    make: '',
    model: '',
    year: '2015',
    mileage_km: '',
    offer_type: '1to1' as OfferType,
    offer_amount_gel: '',
    message: '',
    offerer_phone: '',
  });

  useEffect(() => {
    if (!listing_id) return;
    supabase.from('listings').select('*').eq('id', listing_id).single().then(({ data }) => {
      if (data) setListing(data);
    });
  }, [listing_id]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const addPhotos = useCallback((files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5 - photos.length);
    setPhotos((p) => [...p, ...arr]);
    setPreviews((p) => [...p, ...arr.map((f) => URL.createObjectURL(f))]);
  }, [photos.length]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.make) e.make = t.errors.makeRequired;
    if (!form.model) e.model = t.errors.modelRequired;
    if (!form.mileage_km) e.mileage_km = t.errors.mileageRequired;
    if (!form.offerer_phone) e.offerer_phone = t.errors.phoneInvalid;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const photoUrls: string[] = [];
      for (const file of photos) {
        const ext = file.name.split('.').pop();
        const path = `offers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        await supabase.storage.from('car-photos').upload(path, file);
        const { data } = supabase.storage.from('car-photos').getPublicUrl(path);
        photoUrls.push(data.publicUrl);
      }

      const { error } = await supabase.from('swap_offers').insert({
        listing_id,
        offerer_make: form.make,
        offerer_model: form.model,
        offerer_year: parseInt(form.year),
        offerer_mileage_km: parseInt(form.mileage_km),
        offerer_photos: photoUrls,
        offer_type: form.offer_type,
        offer_amount_gel: form.offer_type !== '1to1' && form.offer_amount_gel ? parseInt(form.offer_amount_gel) : null,
        offerer_phone: form.offerer_phone,
        message: form.message || null,
      });

      if (error) throw error;
      setSuccess(true);
    } catch {
      setErrors({ submit: t.errors.submitFailed });
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{t.swapOffer.successTitle}</h1>
        <p className="text-slate-600 mb-8">
          {t.swapOffer.successContact}{' '}
          <strong className="text-[#1B4F72]">{form.offerer_phone}</strong>.
        </p>
        <Link href="/listings"
          className="bg-[#1B4F72] text-white font-semibold px-8 py-3 rounded-xl inline-block hover:bg-[#154060] transition-colors">
          ← {t.nav.browse}
        </Link>
      </div>
    );
  }

  const OfferCard = ({ value, label }: { value: OfferType; label: string }) => (
    <button
      type="button"
      onClick={() => set('offer_type', value)}
      className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold text-center transition-all ${
        form.offer_type === value
          ? 'border-[#E67E22] bg-amber-50 text-[#E67E22]'
          : 'border-slate-200 text-slate-600 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/listings/${listing_id}`} className="text-sm text-[#1B4F72] hover:underline mb-6 inline-block">
        ← {t.nav.browse}
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t.swapOffer.title}</h1>

      {/* Target listing mini-card */}
      {listing && (
        <div className="bg-[#1B4F72] text-white rounded-xl p-4 mb-8 flex items-center gap-4">
          {listing.photos?.[0] ? (
            <img src={listing.photos[0]} alt="" className="w-20 h-16 object-cover rounded-lg shrink-0" />
          ) : (
            <div className="w-20 h-16 bg-blue-800 rounded-lg shrink-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 17H5v-1a7 7 0 0114 0v1zM7 10l2-5h6l2 5M3 14l1-3h16l1 3" />
              </svg>
            </div>
          )}
          <div>
            <p className="font-bold">{listing.make} {listing.model} {listing.year}</p>
            <p className="text-blue-200 text-sm">{listing.mileage_km.toLocaleString()} km</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
        <h2 className="font-bold text-slate-800">{t.swapOffer.yourCar}</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{t.swapOffer.makeLabel} *</label>
            <input type="text" className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.make ? 'border-red-400' : 'border-slate-200'}`}
              placeholder="Toyota" value={form.make} onChange={(e) => set('make', e.target.value)} />
            {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{t.swapOffer.modelLabel} *</label>
            <input type="text" className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.model ? 'border-red-400' : 'border-slate-200'}`}
              placeholder="Camry" value={form.model} onChange={(e) => set('model', e.target.value)} />
            {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{t.swapOffer.yearLabel}</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.year} onChange={(e) => set('year', e.target.value)}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{t.swapOffer.mileageLabel} *</label>
            <input type="number" className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.mileage_km ? 'border-red-400' : 'border-slate-200'}`}
              placeholder="120000" value={form.mileage_km} onChange={(e) => set('mileage_km', e.target.value)} />
            {errors.mileage_km && <p className="text-red-500 text-xs mt-1">{errors.mileage_km}</p>}
          </div>
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">{t.swapOffer.photosLabel}</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); addPhotos(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer text-sm transition-colors ${
              dragging ? 'border-[#E67E22] bg-amber-50' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <p className="text-slate-500">{t.form.photosHint} ({photos.length}/5)</p>
          </div>
          <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
            onChange={(e) => addPhotos(e.target.files)} />
          {previews.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {previews.map((src, i) => (
                <img key={i} src={src} alt="" className="w-16 h-12 object-cover rounded-lg" />
              ))}
            </div>
          )}
        </div>

        {/* Offer type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">{t.swapOffer.offerTypeLabel}</label>
          <div className="flex gap-2">
            <OfferCard value="1to1" label={t.swapOffer.offerTypes['1to1']} />
            <OfferCard value="i_add" label={t.swapOffer.offerTypes.i_add} />
            <OfferCard value="they_add" label={t.swapOffer.offerTypes.they_add} />
          </div>
        </div>

        {form.offer_type !== '1to1' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{t.swapOffer.amountLabel}</label>
            <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="3000" value={form.offer_amount_gel} onChange={(e) => set('offer_amount_gel', e.target.value)} />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">{t.swapOffer.messageLabel}</label>
          <textarea rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
            placeholder={t.swapOffer.messagePlaceholder} value={form.message}
            onChange={(e) => set('message', e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">{t.swapOffer.phoneLabel} *</label>
          <input type="tel" className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.offerer_phone ? 'border-red-400' : 'border-slate-200'}`}
            placeholder="5XX XXX XXX" value={form.offerer_phone} onChange={(e) => set('offerer_phone', e.target.value)} />
          {errors.offerer_phone && <p className="text-red-500 text-xs mt-1">{errors.offerer_phone}</p>}
        </div>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
            {errors.submit}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-[#E67E22] hover:bg-[#D35400] text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors"
        >
          {submitting ? t.swapOffer.submitting : t.swapOffer.submit}
        </button>
      </div>
    </div>
  );
}
