'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/contexts/LanguageContext';
import type { Lang } from '@/lib/translations';

export default function Header() {
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);

  const langs: Lang[] = ['ka', 'ru', 'en'];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <svg className="w-7 h-7 text-[#1B4F72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span className="font-bold text-[#1B4F72] text-lg leading-none">
            autogacvla<span className="text-[#E67E22]">.ge</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-[#1B4F72] transition-colors">{t.nav.home}</Link>
          <Link href="/listings" className="hover:text-[#1B4F72] transition-colors">{t.nav.browse}</Link>
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language switcher */}
          <div className="flex items-center gap-1 text-xs font-semibold">
            {langs.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-1 rounded transition-colors uppercase ${
                  lang === l
                    ? 'bg-[#1B4F72] text-white'
                    : 'text-slate-500 hover:text-[#1B4F72]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <Link
            href="/post"
            className="bg-[#27AE60] hover:bg-[#1E8449] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + {t.nav.post}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded text-slate-600"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pb-4 pt-2 flex flex-col gap-3">
          <Link href="/" className="text-slate-700 font-medium py-2" onClick={() => setMenuOpen(false)}>
            {t.nav.home}
          </Link>
          <Link href="/listings" className="text-slate-700 font-medium py-2" onClick={() => setMenuOpen(false)}>
            {t.nav.browse}
          </Link>
          <Link
            href="/post"
            className="bg-[#27AE60] text-white font-semibold px-4 py-2 rounded-lg text-center"
            onClick={() => setMenuOpen(false)}
          >
            + {t.nav.post}
          </Link>
          <div className="flex items-center gap-2 pt-1">
            {langs.map((l) => (
              <button
                key={l}
                onClick={() => { setLang(l); setMenuOpen(false); }}
                className={`px-3 py-1 rounded text-xs font-bold uppercase border transition-colors ${
                  lang === l
                    ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                    : 'border-slate-300 text-slate-500'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
