import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'autogacvla.ge — გაცვალე ან გაყიდე მანქანა',
  description: 'საქართველოს ავტომობილების გაცვლისა და გაყიდვის პლატფორმა',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-[Inter,sans-serif]">
        <LanguageProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="bg-[#1B4F72] text-white text-center py-6 text-sm mt-auto">
            <p>© 2024 autogacvla.ge — გაცვალე ან გაყიდე შენი მანქანა</p>
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
