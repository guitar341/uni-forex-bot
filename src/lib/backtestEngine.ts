// Backtesting engine for strategy validation
import { Candle, Position, StrategyMetrics, BacktestConfig, BacktestResult } from '@/types';
import { calculateIndicators } from './indicators';
import { ensembleManager } from './strategyEnsemble';
import Decimal from 'decimal.js';

export class BacktestEngine {
  private config: BacktestConfig;
  private candles: Candle[] = [];
  private positions: Position[] = [];
  private balance: Decimal;
  private trades: Array<{
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    pnl: number;
    isWin: boolean;
  }> = [];

  constructor(config: BacktestConfig) {
    this.config = config;
    this.balance = new Decimal(config.initialBalance);
  }

  /**
   * Run backtest simulation
   */
  async run(historicalData: Candle[]): Promise<BacktestResult> {
    this.candles = historicalData;
    const strategyMetrics = new Map<string, StrategyMetrics>();

    // Initialize strategy metrics
    ensembleManager.getStrategies().forEach((strategy) => {
      strategyMetrics.set(strategy.id, {
        ...strategy,
        totalTrades: 0,
        winTrades: 0,
        totalPnL: 0,
        maxDrawdown: 0,
      });
    });

    const equityHistory: Array<{ timestamp: number; equity: number }> = [];
    let maxEquity = this.config.initialBalance;
    let maxDrawdown = new Decimal(0);

    // Process each candle
    for (let i = 0; i < this.candles.length; i++) {
      const candle = this.candles[i];
      const pastCandles = this.candles.slice(Math.max(0, i - 100), i + 1);

      if (pastCandles.length < 20) continue;

      const indicators = calculateIndicators(pastCandles);
      const { signal, confidence } = ensembleManager.generateConsensusSignal(
        this.config.asset,
        pastCandles,
        indicators
      );

      // Execute trades based on signal
      this.executeTrade(signal, candle, confidence, strategyMetrics);

      // Update P&L
      this.updatePositionPnL(candle.close);

      // Track equity
      const currentEquity = this.balance.plus(this.getOpenPositionsPnL()).toNumber();
      equityHistory.push({
        timestamp: candle.timestamp,
        equity: currentEquity,
      });

      // Track drawdown
      if (currentEquity > maxEquity) {
        maxEquity = currentEquity;
      }
      const drawdown = new Decimal(maxEquity - currentEquity).dividedBy(maxEquity);
      if (drawdown.greaterThan(maxDrawdown)) {
        maxDrawdown = drawdown;
      }
    }

    // Calculate results
    return this.calculateResults(strategyMetrics, maxDrawdown, equityHistory);
  }

  private executeTrade(
    signal: string,
    candle: Candle,
    confidence: number,
    strategyMetrics: Map<string, StrategyMetrics>
  ): void {
    if (signal === 'BUY' || signal === 'SELL') {
      const quantity = this.calculatePositionSize(candle.close, confidence);
      const positionCost = new Decimal(candle.close).times(quantity).dividedBy(this.config.leverage);

      if (this.balance.greaterThanOrEqualTo(positionCost)) {
        this.balance = this.balance.minus(positionCost);

        const position: Position = {
          id: `pos_${Date.now()}`,
          asset: this.config.asset,
          entryPrice: candle.close,
          quantity,
          orderType: signal as any,
          openTime: candle.timestamp,
          status: 'OPEN',
          pnl: 0,
          pnlPercent: 0,
          leverage: this.config.leverage,
          margin: positionCost.toNumber(),
          isFullMargin: this.config.leverage > 1,
        };

        this.positions.push(position);
      }
    } else if (signal === 'CLOSE') {
      this.closeAllPositions(candle.close);
    }
  }

  private calculatePositionSize(price: number, confidence: number): number {
    const riskPerTrade = this.config.initialBalance * 0.02; // 2% risk per trade
    const positionSize = riskPerTrade / (price * 0.01); // 1% stop loss
    return Math.floor(positionSize * (0.5 + confidence * 0.5)); // Scale by confidence
  }

  private updatePositionPnL(currentPrice: number): void {
    this.positions.forEach((position) => {
      if (position.status === 'OPEN') {
        const priceDiff = position.orderType === 'BUY' ? currentPrice - position.entryPrice : position.entryPrice - currentPrice;
        position.pnl = priceDiff * position.quantity - this.config.commission;
        position.pnlPercent = (priceDiff / position.entryPrice) * 100;
      }
    });
  }

  private getOpenPositionsPnL(): Decimal {
    return this.positions
      .filter((p) => p.status === 'OPEN')
      .reduce((sum, p) => sum.plus(p.pnl), new Decimal(0));
  }

  private closeAllPositions(exitPrice: number): void {
    this.positions.forEach((position) => {
      if (position.status === 'OPEN') {
        const priceDiff = position.orderType === 'BUY' ? exitPrice - position.entryPrice : position.entryPrice - exitPrice;
        const pnl = priceDiff * position.quantity - this.config.commission;
        const margin = new Decimal(position.margin);

        this.balance = this.balance.plus(margin).plus(pnl);
        this.trades.push({
          entryPrice: position.entryPrice,
          exitPrice,
          quantity: position.quantity,
          pnl,
          isWin: pnl > 0,
        });

        position.status = 'CLOSED';
        position.closeTime = Date.now();
        position.pnl = pnl;
      }
    });
  }

  private calculateResults(
    strategyMetrics: Map<string, StrategyMetrics>,
    maxDrawdown: Decimal,
    equityHistory: Array<{ timestamp: number; equity: number }>
  ): BacktestResult {
    const totalTrades = this.trades.length;
    const winTrades = this.trades.filter((t) => t.isWin).length;
    const lossTrades = totalTrades - winTrades;
    const winRate = totalTrades > 0 ? winTrades / totalTrades : 0;

    const totalPnL = this.trades.reduce((sum, t) => sum + t.pnl, 0) + this.balance.minus(this.config.initialBalance).toNumber();

    // Calculate profit factor
    const wins = this.trades.filter((t) => t.isWin).reduce((sum, t) => sum + t.pnl, 0);
    const losses = Math.abs(this.trades.filter((t) => !t.isWin).reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = losses > 0 ? wins / losses : wins > 0 ? 999 : 0;

    // Calculate Sharpe ratio
    const returns = equityHistory.map((e, i) => (i > 0 ? (e.equity - equityHistory[i - 1].equity) / equityHistory[i - 1].equity : 0));
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.map((r) => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
    const sharpeRatio = stdDev > 0 ? (avgReturn * 252) / (stdDev * Math.sqrt(252)) : 0;

    return {
      asset: this.config.asset,
      totalTrades,
      winTrades,
      lossTrades,
      winRate,
      totalPnL,
      maxDrawdown: maxDrawdown.toNumber(),
      profitFactor,
      sharpeRatio: Math.max(sharpeRatio, 0),
      strategyPerformance: Array.from(strategyMetrics.values()),
      trades: this.positions,
      equityHistory,
    };
  }
}
