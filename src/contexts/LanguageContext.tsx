'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import translations, { Lang, T } from '@/lib/translations';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: T;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ka',
  setLang: () => {},
  t: translations.ka as unknown as T,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ka');

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Lang | null;
    if (stored && ['ka', 'ru', 'en'].includes(stored)) {
      setLangState(stored);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] as unknown as T }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
