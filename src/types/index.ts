// Core trading types
export type Asset = 'XAU/USD' | 'BTC/USD' | 'US30' | 'GER30';
export type OrderType = 'BUY' | 'SELL' | 'HOLD' | 'WAIT' | 'CLOSE';
export type TradeStatus = 'OPEN' | 'CLOSED' | 'PENDING' | 'CANCELLED';
export type StrategyStatus = 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'ERROR';
export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

// Price data types
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface QuoteData {
  asset: Asset;
  bid: number;
  ask: number;
  last: number;
  timestamp: number;
  change: number;
  changePercent: number;
}

// Trading position types
export interface Position {
  id: string;
  asset: Asset;
  entryPrice: number;
  quantity: number;
  orderType: OrderType;
  openTime: number;
  closeTime?: number;
  status: TradeStatus;
  pnl: number;
  pnlPercent: number;
  leverage: number;
  margin: number;
  isFullMargin: boolean;
}

export interface PaperTrade {
  positions: Position[];
  balance: number;
  equity: number;
  usedMargin: number;
  availableMargin: number;
  leverage: number;
  totalPnL: number;
  totalPnLPercent: number;
  winRate: number;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
}

// Strategy types
export interface StrategyMetrics {
  id: string;
  name: string;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  totalPnL: number;
  status: StrategyStatus;
  lastSignal?: OrderType;
  confidence: number;
  weight: number; // For weighted voting in ensemble
}

export interface StrategySignal {
  strategyId: string;
  asset: Asset;
  signal: OrderType;
  confidence: number;
  timestamp: number;
  targetPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  reason: string;
}

// Prediction types
export interface ForecastStep {
  step: number;
  action: OrderType;
  targetPrice: number;
  expectedRange: {
    min: number;
    max: number;
  };
  probability: number;
  timeToTarget: number; // in minutes
  reason: string;
  timestamp: number;
}

export interface Prediction {
  asset: Asset;
  currentStep: number;
  steps: ForecastStep[];
  confidence: number;
  nextAction: OrderType;
  timestamp: number;
  updateFrequency: number; // in seconds
}

// Technical indicators
export interface Indicators {
  fvg: {
    zones: Array<{ high: number; low: number; timestamp: number }>;
    filled: boolean[];
  };
  accumulation: {
    value: number;
    trend: 'UP' | 'DOWN' | 'NEUTRAL';
    intensity: number;
  };
  distribution: {
    value: number;
    trend: 'UP' | 'DOWN' | 'NEUTRAL';
    intensity: number;
  };
  volume: {
    current: number;
    average: number;
    ratio: number;
  };
  rsi: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
  };
}

// Backtest types
export interface BacktestConfig {
  asset: Asset;
  timeframe: TimeFrame;
  startDate: number;
  endDate: number;
  barLimit: number;
  slippage: number;
  commission: number;
  initialBalance: number;
  leverage: number;
  strategyIds?: string[];
}

export interface BacktestResult {
  asset: Asset;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  winRate: number;
  totalPnL: number;
  maxDrawdown: number;
  profitFactor: number;
  sharpeRatio: number;
  strategyPerformance: StrategyMetrics[];
  trades: Position[];
  equityHistory: Array<{ timestamp: number; equity: number }>;
}

// Dashboard types
export interface DashboardMetrics {
  totalProfit: number;
  winRate: number;
  activePositions: number;
  totalStrategies: number;
  activeStrategies: number;
  bestStrategy: StrategyMetrics;
  worstStrategy: StrategyMetrics;
  assetPerformance: Record<Asset, {
    pnl: number;
    winRate: number;
    trades: number;
  }>;
}

// Voice types
export interface VoiceCommand {
  command: string;
  asset?: Asset;
  action?: OrderType;
  confidence: number;
  timestamp: number;
}

export interface VoiceResponse {
  text: string;
  audio?: AudioBuffer;
  timestamp: number;
}
