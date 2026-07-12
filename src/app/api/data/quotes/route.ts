import { NextRequest, NextResponse } from 'next/server';
import { QuoteData } from '@/types';

function generateQuote(asset: string): QuoteData {
  const basePrices: Record<string, number> = {
    'XAU/USD': 2000,
    'BTC/USD': 43000,
    'US30': 38000,
    'GER30': 17500,
  };

  const basePrice = basePrices[asset] || 2000;
  const change = (Math.random() - 0.5) * basePrice * 0.01;
  const changePercent = (change / basePrice) * 100;
  const spread = basePrice * 0.00002;

  return {
    asset: asset as any,
    bid: basePrice - spread / 2,
    ask: basePrice + spread / 2,
    last: basePrice + change,
    timestamp: Date.now(),
    change,
    changePercent,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const assets = body.assets || ['XAU/USD', 'BTC/USD', 'US30', 'GER30'];

    const quotes: Record<string, QuoteData> = {};
    assets.forEach((asset: string) => {
      quotes[asset] = generateQuote(asset);
    });

    return NextResponse.json({ quotes });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
