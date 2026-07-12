// Technical indicator calculations
import { Candle, Indicators } from '@/types';
import Decimal from 'decimal.js';

export const calculateRSI = (candles: Candle[], period: number = 14): number => {
  if (candles.length < period + 1) return 50;

  let gains = new Decimal(0);
  let losses = new Decimal(0);

  for (let i = candles.length - period; i < candles.length; i++) {
    const change = new Decimal(candles[i].close).minus(candles[i - 1].close);
    if (change.greaterThan(0)) {
      gains = gains.plus(change);
    } else {
      losses = losses.plus(change.abs());
    }
  }

  const avgGain = gains.dividedBy(period);
  const avgLoss = losses.dividedBy(period);

  if (avgLoss.equals(0)) return 100;
  const rs = avgGain.dividedBy(avgLoss);
  const rsi = 100 - 100 / (1 + rs.toNumber());

  return rsi;
};

export const calculateMACD = (candles: Candle[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
  const closes = candles.map((c) => c.close);
  const ema12 = calculateEMA(closes, fastPeriod);
  const ema26 = calculateEMA(closes, slowPeriod);
  const macdLine = ema12 - ema26;

  // Calculate signal line (EMA of MACD)
  const macdValues = closes.map((_, i) => {
    if (i < slowPeriod - 1) return null;
    const e12 = calculateEMA(closes.slice(0, i + 1), fastPeriod);
    const e26 = calculateEMA(closes.slice(0, i + 1), slowPeriod);
    return e12 - e26;
  });

  const signalLine = calculateEMA(macdValues.filter((v) => v !== null) as number[], signalPeriod);
  const histogram = macdLine - signalLine;

  return { line: macdLine, signal: signalLine, histogram };
};

const calculateEMA = (values: number[], period: number): number => {
  const k = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((a, b) => a + b) / period;

  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }

  return ema;
};

export const calculateFairValueGaps = (candles: Candle[]): Array<{ high: number; low: number; timestamp: number }> => {
  const gaps: Array<{ high: number; low: number; timestamp: number }> = [];

  for (let i = 2; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const prev2 = candles[i - 2];

    // Bullish FVG: current low > prev high
    if (current.low > prev.high && prev.high > prev2.low) {
      gaps.push({
        high: current.low,
        low: prev.high,
        timestamp: current.timestamp,
      });
    }

    // Bearish FVG: current high < prev low
    if (current.high < prev.low && prev.low < prev2.high) {
      gaps.push({
        high: prev.low,
        low: current.high,
        timestamp: current.timestamp,
      });
    }
  }

  return gaps;
};

export const calculateAccumulationDistribution = (candles: Candle[]): number => {
  let ad = 0;

  for (const candle of candles) {
    const clv = ((candle.close - candle.low) - (candle.high - candle.close)) / (candle.high - candle.low) || 0;
    ad += clv * candle.volume;
  }

  return ad;
};

export const calculateDistribution = (candles: Candle[]): number => {
  // Distribution is typically shown as negative accumulation
  return -calculateAccumulationDistribution(candles);
};

export const calculateVolume = (candles: Candle[], period: number = 20) => {
  const recentCandles = candles.slice(-period);
  const current = candles[candles.length - 1].volume;
  const average = recentCandles.reduce((sum, c) => sum + c.volume, 0) / period;

  return {
    current,
    average,
    ratio: current / average,
  };
};

export const calculateIndicators = (candles: Candle[]): Indicators => {
  const fvgZones = calculateFairValueGaps(candles);
  const ad = calculateAccumulationDistribution(candles);
  const vol = calculateVolume(candles);
  const rsi = calculateRSI(candles);
  const macd = calculateMACD(candles);

  const adTrend = ad > 0 ? 'UP' : ad < 0 ? 'DOWN' : 'NEUTRAL';
  const distTrend = ad < 0 ? 'UP' : ad > 0 ? 'DOWN' : 'NEUTRAL';

  return {
    fvg: {
      zones: fvgZones,
      filled: fvgZones.map(() => false),
    },
    accumulation: {
      value: ad,
      trend: adTrend,
      intensity: Math.abs(ad) / 1000, // Normalized
    },
    distribution: {
      value: -ad,
      trend: distTrend,
      intensity: Math.abs(ad) / 1000,
    },
    volume: vol,
    rsi,
    macd,
  };
};
