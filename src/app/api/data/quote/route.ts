import { NextRequest, NextResponse } from 'next/server';
import { QuoteData } from '@/types';

// Simulated quote data
function generateQuote(asset: string): QuoteData {
  const basePrices: Record<string, number> = {
    'XAU/USD': 2000,
    'BTC/USD': 43000,
    'US30': 38000,
    'GER30': 17500,
  };

  const basePrice = basePrices[asset] || 2000;
  const change = (Math.random() - 0.5) * basePrice * 0.01; // ±1% change
  const changePercent = (change / basePrice) * 100;
  const spread = basePrice * 0.00002; // 0.002% spread

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const asset = searchParams.get('asset') || 'XAU/USD';

  const quote = generateQuote(asset);

  return NextResponse.json({ quote });
}
