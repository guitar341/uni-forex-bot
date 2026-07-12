import { NextRequest, NextResponse } from 'next/server';
import { Candle } from '@/types';

// Simulated candle data generator
function generateCandles(asset: string, timeframe: string, limit: number): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const timeframeMs: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };

  const interval = timeframeMs[timeframe] || 3600000;
  const basePrice = asset === 'XAU/USD' ? 2000 : asset === 'BTC/USD' ? 43000 : 5000;

  for (let i = limit - 1; i >= 0; i--) {
    const timestamp = now - i * interval;
    const volatility = 0.005; // 0.5% volatility
    const change = (Math.random() - 0.5) * volatility * basePrice;

    const open = basePrice + (Math.random() - 0.5) * volatility * basePrice;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * basePrice * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * basePrice * 0.5;
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return candles;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const asset = searchParams.get('asset') || 'XAU/USD';
  const timeframe = searchParams.get('timeframe') || '1h';
  const limit = parseInt(searchParams.get('limit') || '500');

  const candles = generateCandles(asset, timeframe, limit);

  return NextResponse.json({
    candles,
    asset,
    timeframe,
    count: candles.length,
  });
}
