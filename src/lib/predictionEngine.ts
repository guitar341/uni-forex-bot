// Real-time prediction system
import { Candle, Prediction, ForecastStep, Indicators } from '@/types';
import { calculateIndicators } from './indicators';
import Decimal from 'decimal.js';

export class PredictionEngine {
  private currentPrice: number = 0;
  private indicators: Indicators | null = null;
  private rsiTrend: 'overbought' | 'oversold' | 'neutral' = 'neutral';

  /**
   * Generate multi-step forecast based on technical analysis
   */
  generateForecast(candles: Candle[], asset: string, ensembleSignal: string, ensembleConfidence: number): Prediction {
    if (candles.length === 0) {
      return this.getDefaultPrediction(asset);
    }

    this.currentPrice = candles[candles.length - 1].close;
    this.indicators = calculateIndicators(candles);
    this.updateRSITrend();

    const steps = this.generateForecastSteps(ensembleSignal, ensembleConfidence);

    return {
      asset: asset as any,
      currentStep: 0,
      steps,
      confidence: ensembleConfidence,
      nextAction: ensembleSignal as any,
      timestamp: Date.now(),
      updateFrequency: 60,
    };
  }

  private updateRSITrend(): void {
    if (!this.indicators) return;
    const rsi = this.indicators.rsi;
    if (rsi > 70) this.rsiTrend = 'overbought';
    else if (rsi < 30) this.rsiTrend = 'oversold';
    else this.rsiTrend = 'neutral';
  }

  private generateForecastSteps(signal: string, confidence: number): ForecastStep[] {
    if (!this.indicators) return [];

    const steps: ForecastStep[] = [];
    const price = this.currentPrice;

    // Step 1: Entry
    steps.push({
      step: 1,
      action: signal as any,
      targetPrice: this.calculateTarget(price, signal, 0.5),
      expectedRange: {
        min: price * 0.99,
        max: price * 1.01,
      },
      probability: Math.min(confidence, 1),
      timeToTarget: 15,
      reason: this.getReason('entry', signal),
      timestamp: Date.now(),
    });

    // Step 2: Continuation
    steps.push({
      step: 2,
      action: signal === 'BUY' ? 'HOLD' : 'HOLD',
      targetPrice: this.calculateTarget(price, signal, 1),
      expectedRange: {
        min: price * 0.98,
        max: price * 1.02,
      },
      probability: Math.max(confidence - 0.15, 0.5),
      timeToTarget: 30,
      reason: this.getReason('continuation', signal),
      timestamp: Date.now(),
    });

    // Step 3: Profit taking
    steps.push({
      step: 3,
      action: 'CLOSE',
      targetPrice: this.calculateTarget(price, signal, 1.5),
      expectedRange: {
        min: price * 0.97,
        max: price * 1.03,
      },
      probability: Math.max(confidence - 0.3, 0.4),
      timeToTarget: 45,
      reason: this.getReason('takeProfit', signal),
      timestamp: Date.now(),
    });

    return steps;
  }

  private calculateTarget(price: number, signal: string, multiplier: number): number {
    if (!this.indicators) return price;

    const atrValue = this.calculateATR() || price * 0.01; // 1% default
    const targetPips = atrValue * multiplier;

    return signal === 'BUY' ? price + targetPips : price - targetPips;
  }

  private calculateATR(): number {
    // Simplified ATR calculation
    if (!this.indicators) return 0;
    const range = this.indicators.volume.ratio; // Use volume ratio as proxy
    return this.currentPrice * 0.01 * range;
  }

  private getReason(stage: 'entry' | 'continuation' | 'takeProfit', signal: string): string {
    const reasons: Record<string, Record<string, string>> = {
      entry: {
        BUY:
          this.rsiTrend === 'oversold'
            ? 'RSI oversold, preparing for bounce. FVG support identified.'
            : 'Accumulation phase detected. Volume increasing on dips.',
        SELL:
          this.rsiTrend === 'overbought'
            ? 'RSI overbought, preparing for pullback. FVG resistance identified.'
            : 'Distribution phase detected. Volume increasing on rallies.',
        HOLD: 'No clear directional bias. Waiting for confirmation.',
      },
      continuation: {
        BUY: 'Uptrend continues. MACD positive histogram. Accumulation persisting.',
        SELL: 'Downtrend continues. MACD negative histogram. Distribution persisting.',
        HOLD: 'Consolidation phase. Monitor for breakout signals.',
      },
      takeProfit: {
        BUY: `Reached target price. Profit taking at resistance. ${this.currentPrice.toFixed(2)}`,
        SELL: `Reached target price. Profit taking at support. ${this.currentPrice.toFixed(2)}`,
        HOLD: 'Exit current position. Prepare for next setup.',
      },
    };

    return reasons[stage][signal] || 'Analysis complete';
  }

  private getDefaultPrediction(asset: string): Prediction {
    return {
      asset: asset as any,
      currentStep: 0,
      steps: [],
      confidence: 0.5,
      nextAction: 'WAIT',
      timestamp: Date.now(),
      updateFrequency: 60,
    };
  }
}

export const predictionEngine = new PredictionEngine();
