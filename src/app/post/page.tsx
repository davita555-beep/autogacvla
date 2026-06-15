'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import type { ListingType, ExchangePref, Condition, Fuel, Transmission, Region } from '@/lib/supabase';

interface FormData {
  type: ListingType;
  exchange_preference: ExchangePref;
  wants_make: string;
  wants_year_from: string;
  wants_year_to: string;
  price_gel: string;
  surcharge_gel: string;
  make: string;
  model: string;
  year: string;
  mileage_km: string;
  condition: Condition;
  fuel: Fuel;
  transmission: Transmission;
  color: string;
  region: Region;
  description_ka: string;
  description_ru: string;
  description_en: string;
  contact_phone: string;
  contact_whatsapp: string;
  whatsapp_same: boolean;
}

const YEARS = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => 2026 - i);

function PostForm() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as ListingType) || 'exchange';

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [published, setPublished] = useState<{ id: string } | null>(null);
  const [offerCount, setOfferCount] = useState(0);
  const [copied, setCopied] = useState<'manage' | 'listing' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    type: initialType,
    exchange_preference: 'flexible',
    wants_make: '',
    wants_year_from: '',
    wants_year_to: '',
    price_gel: '',
    surcharge_gel: '',
    make: '',
    model: '',
    year: '2020',
    mileage_km: '',
    condition: 'good',
    fuel: 'petrol',
    transmission: 'auto',
    color: '',
    region: 'tbilisi',
    description_ka: '',
    description_ru: '',
    description_en: '',
    contact_phone: '',
    contact_whatsapp: '',
    whatsapp_same: false,
  });

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addPhotos = useCallback((files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 10 - photos.length);
    const newPreviews = arr.map((f) => URL.createObjectURL(f));
    setPhotos((p) => [...p, ...arr]);
    setPreviews((p) => [...p, ...newPreviews]);
  }, [photos.length]);

  const removePhoto = (i: number) => {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if ((form.type === 'sale' || form.type === 'both') && !form.price_gel)
      e.price_gel = t.errors.priceRequired;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.make) e.make = t.errors.makeRequired;
    if (!form.model) e.model = t.errors.modelRequired;
    if (!form.mileage_km) e.mileage_km = t.errors.mileageRequired;
    if (!form.color) e.color = t.errors.colorRequired;
    if (!form.description_ka) e.description_ka = t.errors.descKaRequired;
    if (photos.length === 0) e.photos = t.errors.photosMin;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!form.contact_phone) e.contact_phone = t.errors.phoneInvalid;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of photos) {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('car-photos').upload(path, file);
      if (error) throw new Error(t.errors.uploadFailed);
      const { data } = supabase.storage.from('car-photos').getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setSubmitting(true);
    try {
      const photoUrls = await uploadPhotos();
      const { data, error } = await supabase.from('listings').insert({
        type: form.type,
        exchange_preference: form.type !== 'sale' ? form.exchange_preference : null,
        price_gel: form.price_gel ? parseInt(form.price_gel) : null,
        surcharge_gel: form.surcharge_gel ? parseInt(form.surcharge_gel) : null,
        make: form.make,
        model: form.model,
        year: parseInt(form.year),
        mileage_km: parseInt(form.mileage_km),
        condition: form.condition,
        color: form.color,
        fuel: form.fuel,
        transmission: form.transmission,
        wants_make: form.wants_make || null,
        wants_year_from: form.wants_year_from ? parseInt(form.wants_year_from) : null,
        wants_year_to: form.wants_year_to ? parseInt(form.wants_year_to) : null,
        description_ka: form.description_ka || null,
        description_ru: form.description_ru || null,
        description_en: form.description_en || null,
        contact_phone: form.contact_phone,
        contact_whatsapp: form.whatsapp_same ? form.contact_phone : (form.contact_whatsapp || null),
        region: form.region,
        photos: photoUrls,
        status: 'active',
        views: 0,
      }).select().single();

      if (error) throw error;
      setPublished({ id: data.id });
    } catch {
      setErrors({ submit: t.errors.submitFailed });
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!published) return;
    supabase.from('swap_offers').select('id', { count: 'exact', head: true }).eq('listing_id', published.id).then(({ count }) => {
      setOfferCount(count ?? 0);
    });
  }, [published]);

  const copyToClipboard = (text: string, which: 'manage' | 'listing') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (published) {
    const listingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/listings/${published.id}`;
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.form.successTitle}</h1>
          <p className="text-slate-500">{t.form.successMessage}</p>
        </div>

        {/* Amber manage link box */}
        <div className="bg-amber-50 border-2 border-[#E67E22] rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-amber-900 mb-2">🔗 {t.form.successLinkTitle}</p>
          <div className="bg-white border border-amber-200 rounded-xl px-4 py-3 mb-3 break-all text-sm text-slate-800 font-mono select-all">
            {listingUrl}
          </div>
          <p className="text-xs font-bold text-amber-800 mb-3">⚠️ {t.form.saveLinkWarning}</p>
          <button
            onClick={() => copyToClipboard(listingUrl, 'manage')}
            className="w-full bg-[#E67E22] hover:bg-[#D35400] text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
          >
            {copied === 'manage' ? `✓ ${t.form.linkCopied}` : t.form.copyManageLink}
          </button>
        </div>

        {/* Offers count */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-slate-800">{t.form.offersReceived}</p>
            <span className="text-2xl font-bold text-[#1B4F72]">{offerCount}</span>
          </div>
          {offerCount === 0 && (
            <div className="border-t border-slate-100 pt-4 text-center">
              <p className="text-slate-500 text-sm mb-3">{t.form.noOffersYet}</p>
              <button
                onClick={() => copyToClipboard(listingUrl, 'listing')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {copied === 'listing' ? `✓ ${t.form.linkCopied}` : t.form.copyListingLink}
              </button>
            </div>
          )}
        </div>

        <Link
          href={`/listings/${published.id}`}
          className="block w-full text-center bg-[#1B4F72] hover:bg-[#154060] text-white font-bold py-3 rounded-xl transition-colors"
        >
          {t.form.viewListing} →
        </Link>
      </div>
    );
  }

  const TypeCard = ({ value, label, icon, color }: { value: ListingType; label: string; icon: string; color: string }) => (
    <button
      type="button"
      onClick={() => set('type', value)}
      className={`flex-1 p-5 rounded-xl border-2 text-center transition-all ${
        form.type === value ? `border-${color === 'exchange' ? '[#E67E22]' : color === 'sale' ? '[#27AE60]' : '[#1B4F72]'} bg-${color === 'exchange' ? 'amber' : color === 'sale' ? 'green' : 'blue'}-50` : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-semibold text-slate-800">{label}</div>
    </button>
  );

  const OptionCard = <T extends string>({
    value, current, label, onClick,
  }: { value: T; current: T; label: string; onClick: (v: T) => void }) => (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
        current === value ? 'border-[#1B4F72] bg-blue-50 text-[#1B4F72]' : 'border-slate-200 text-slate-600 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              s < step ? 'bg-[#27AE60] text-white' : s === step ? 'bg-[#1B4F72] text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {s < step ? '✓' : s}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${s === step ? 'text-[#1B4F72]' : 'text-slate-400'}`}>
              {s === 1 ? t.form.step1Title : s === 2 ? t.form.step2Title : t.form.step3Title}
            </span>
            {s < 3 && <div className={`flex-1 h-0.5 ${s < step ? 'bg-[#27AE60]' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-900">{t.form.typeLabel}</h1>
            <div className="flex gap-3">
              <TypeCard value="exchange" label={t.types.exchange} icon="🔄" color="exchange" />
              <TypeCard value="sale" label={t.types.sale} icon="💰" color="sale" />
              <TypeCard value="both" label={t.types.both} icon="🔄💰" color="both" />
            </div>

            {(form.type === 'exchange' || form.type === 'both') && (
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.form.exchangePrefLabel}</label>
                  <div className="flex flex-wrap gap-2">
                    {(['1to1', 'i_add_money', 'they_add_money', 'flexible'] as ExchangePref[]).map((p) => (
                      <OptionCard key={p} value={p} current={form.exchange_preference} label={t.exchangePrefs[p]} onClick={(v) => set('exchange_preference', v)} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.form.wantsMakeLabel}</label>
                    <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      placeholder={t.form.wantsMakePlaceholder} value={form.wants_make} onChange={(e) => set('wants_make', e.target.value)} />
                  </div>
                  <div />
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.form.wantsYearFromLabel}</label>
                    <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      placeholder="1990" value={form.wants_year_from} onChange={(e) => set('wants_year_from', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.form.wantsYearToLabel}</label>
                    <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      placeholder="2026" value={form.wants_year_to} onChange={(e) => set('wants_year_to', e.target.value)} />
                  </div>
                </div>
                {(form.exchange_preference === 'i_add_money' || form.exchange_preference === 'they_add_money') && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.form.surchargeLabel}</label>
                    <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      placeholder={t.form.surchargePlaceholder} value={form.surcharge_gel}
                      onChange={(e) => set('surcharge_gel', e.target.value)} />
                  </div>
                )}
              </div>
            )}

            {(form.type === 'sale' || form.type === 'both') && (
              <div className="border-t border-slate-100 pt-4">
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t.form.priceLabel}</label>
                <input type="number" className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.price_gel ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder={t.form.pricePlaceholder} value={form.price_gel} onChange={(e) => set('price_gel', e.target.value)} />
                {errors.price_gel && <p className="text-red-500 text-xs mt-1">{errors.price_gel}</p>}
              </div>
            )}
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <h1 className="text-xl font-bold text-slate-900">{t.form.step2Title}</h1>

            {/* Photo upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.form.photosLabel}</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); addPhotos(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  dragging ? 'border-[#1B4F72] bg-blue-50' : errors.photos ? 'border-red-300' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <svg className="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm text-slate-500">{t.form.photosHint}</p>
                <p className="text-xs text-slate-400 mt-1">{photos.length}/10</p>
              </div>
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                onChange={(e) => addPhotos(e.target.files)} />
              {errors.photos && <p className="text-red-500 text-xs mt-1">{errors.photos}</p>}
              {previews.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img src={src} alt="" className="w-full h-20 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t.form.makeLabel} *</label>
                <input type="text" className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.make ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder={t.form.makePlaceholder} value={form.make} onChange={(e) => set('make', e.target.value)} />
                {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t.form.modelLabel} *</label>
                <input type="text" className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.model ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder={t.form.modelPlaceholder} value={form.model} onChange={(e) => set('model', e.target.value)} />
                {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t.form.yearLabel}</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={form.year} onChange={(e) => set('year', e.target.value)}>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t.form.mileageLabel} *</label>
                <input type="number" className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.mileage_km ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder={t.form.mileagePlaceholder} value={form.mileage_km} onChange={(e) => set('mileage_km', e.target.value)} />
                {errors.mileage_km && <p className="text-red-500 text-xs mt-1">{errors.mileage_km}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.form.conditionLabel}</label>
              <div className="flex flex-wrap gap-2">
                {(['excellent', 'good', 'fair', 'parts'] as Condition[]).map((c) => (
                  <OptionCard key={c} value={c} current={form.condition} label={t.conditions[c]} onClick={(v) => set('condition', v)} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.form.fuelLabel}</label>
              <div className="flex flex-wrap gap-2">
                {(['petrol', 'diesel', 'hybrid', 'electric'] as Fuel[]).map((f) => (
                  <OptionCard key={f} value={f} current={form.fuel} label={t.fuels[f]} onClick={(v) => set('fuel', v)} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.form.transmissionLabel}</label>
              <div className="flex gap-2">
                {(['auto', 'manual'] as Transmission[]).map((tr) => (
                  <OptionCard key={tr} value={tr} current={form.transmission} label={t.transmissions[tr]} onClick={(v) => set('transmission', v)} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t.form.colorLabel} *</label>
                <input type="text" className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.color ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder={t.form.colorPlaceholder} value={form.color} onChange={(e) => set('color', e.target.value)} />
                {errors.color && <p className="text-red-500 text-xs mt-1">{errors.color}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t.form.regionLabel}</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={form.region} onChange={(e) => set('region', e.target.value as Region)}>
                  {(['tbilisi', 'batumi', 'kutaisi', 'rustavi', 'other'] as Region[]).map((r) => (
                    <option key={r} value={r}>{t.regions[r]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t.form.descKaLabel}</label>
              <textarea rows={3} className={`w-full border rounded-lg px-3 py-2 text-sm resize-none ${errors.description_ka ? 'border-red-400' : 'border-slate-200'}`}
                placeholder={t.form.descPlaceholder} value={form.description_ka}
                onChange={(e) => set('description_ka', e.target.value)} />
              {errors.description_ka && <p className="text-red-500 text-xs mt-1">{errors.description_ka}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t.form.descRuLabel}</label>
              <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
                placeholder={t.form.descPlaceholder} value={form.description_ru}
                onChange={(e) => set('description_ru', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t.form.descEnLabel}</label>
              <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
                placeholder={t.form.descPlaceholder} value={form.description_en}
                onChange={(e) => set('description_en', e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-5">
            <h1 className="text-xl font-bold text-slate-900">{t.form.step3Title}</h1>

            {/* Review summary */}
            <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1 text-slate-700">
              <p className="font-bold">{form.make} {form.model} {form.year}</p>
              <p>{t.types[form.type]} · {t.regions[form.region]}</p>
              <p>{form.mileage_km} {t.detail.km} · {t.fuels[form.fuel]} · {t.transmissions[form.transmission]}</p>
              {form.price_gel && <p className="font-semibold text-[#27AE60]">{parseInt(form.price_gel).toLocaleString()} ₾</p>}
              <p className="text-slate-400">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t.form.phoneLabel}</label>
              <input type="tel" className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.contact_phone ? 'border-red-400' : 'border-slate-200'}`}
                placeholder={t.form.phonePlaceholder} value={form.contact_phone}
                onChange={(e) => set('contact_phone', e.target.value)} />
              {errors.contact_phone && <p className="text-red-500 text-xs mt-1">{errors.contact_phone}</p>}
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded"
                checked={form.whatsapp_same} onChange={(e) => set('whatsapp_same', e.target.checked)} />
              <span className="text-sm text-slate-700">{t.form.whatsappLabel}</span>
            </label>

            {!form.whatsapp_same && (
              <div>
                <input type="tel" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder={t.form.whatsappPlaceholder} value={form.contact_whatsapp}
                  onChange={(e) => set('contact_whatsapp', e.target.value)} />
              </div>
            )}

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
                {errors.submit}
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
          {step > 1 ? (
            <button type="button" onClick={() => setStep(step - 1)}
              className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
              ← {t.form.back}
            </button>
          ) : <div />}

          {step < 3 ? (
            <button type="button" onClick={handleNext}
              className="px-6 py-2.5 rounded-lg bg-[#1B4F72] text-white font-semibold hover:bg-[#154060] transition-colors">
              {t.form.next} →
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="px-6 py-2.5 rounded-lg bg-[#27AE60] text-white font-semibold hover:bg-[#1E8449] disabled:opacity-50 transition-colors">
              {submitting ? t.form.submitting : t.form.submit}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PostPage() {
  return (
    <Suspense>
      <PostForm />
    </Suspense>
  );
}
