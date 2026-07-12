import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Uni Forex Bot - 10,000 Strategies Trading',
  description: 'Advanced forex trading bot with AI predictions, paper trading, and backtesting',
  keywords: 'forex, trading, bot, strategies, XAU/USD, BTC/USD, paper trading',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white">
        {children}
      </body>
    </html>
  );
}
