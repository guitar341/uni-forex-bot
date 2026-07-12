// API route for prediction generation
import { NextRequest, NextResponse } from 'next/server';
import { predictionEngine } from '@/lib/predictionEngine';
import { forexClient } from '@/lib/forexDataClient';
import { ensembleManager } from '@/lib/strategyEnsemble';
import { calculateIndicators } from '@/lib/indicators';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const asset = searchParams.get('asset') || 'XAU/USD';

  try {
    // Fetch latest candles
    const candles = await forexClient.getCandles(asset as any, '1h', 100);

    if (candles.length === 0) {
      return NextResponse.json(
        { error: 'No candle data available' },
        { status: 404 }
      );
    }

    // Get ensemble signal
    const indicators = calculateIndicators(candles);
    const { signal, confidence } = ensembleManager.generateConsensusSignal(
      asset as any,
      candles,
      indicators
    );

    // Generate prediction
    const prediction = predictionEngine.generateForecast(
      candles,
      asset,
      signal,
      confidence
    );

    return NextResponse.json({
      prediction,
      signal,
      confidence,
      asset,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}
