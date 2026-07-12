// Automated trading executor
import { Position, Asset, OrderType, Candle } from '@/types';
import { ensembleManager } from './strategyEnsemble';
import { calculateIndicators } from './indicators';
import Decimal from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';

interface TradeConfig {
  autoTrade: boolean;
  maxOpenPositions: number;
  positionSize: number; // percentage of balance
  takeProfit: number; // percentage
  stopLoss: number; // percentage
  minConfidence: number; // 0-1
  checkInterval: number; // milliseconds
}

export class AutoTrader {
  private config: TradeConfig;
  private isRunning: boolean = false;
  private tradeInterval: NodeJS.Timeout | null = null;
  private balance: Decimal;
  private positions: Position[] = [];
  private tradeHistory: Array<{
    timestamp: number;
    asset: Asset;
    action: OrderType;
    price: number;
    quantity: number;
    result: 'WIN' | 'LOSS' | 'PENDING';
  }> = [];

  constructor(config: Partial<TradeConfig> = {}) {
    this.config = {
      autoTrade: true,
      maxOpenPositions: 5,
      positionSize: 0.1, // 10% of balance per trade
      takeProfit: 0.02, // 2% profit target
      stopLoss: 0.01, // 1% stop loss
      minConfidence: 0.55, // Minimum 55% confidence
      checkInterval: 5000, // Check every 5 seconds
      ...config,
    };
    this.balance = new Decimal(10000);
  }

  /**
   * Start automated trading
   */
  start(): void {
    if (this.isRunning) {
      console.log('AutoTrader already running');
      return;
    }

    this.isRunning = true;
    console.log('✅ AutoTrader started');

    this.tradeInterval = setInterval(() => {
      this.executeTradeLogic();
    }, this.config.checkInterval);
  }

  /**
   * Stop automated trading
   */
  stop(): void {
    if (this.tradeInterval) {
      clearInterval(this.tradeInterval);
      this.tradeInterval = null;
    }
    this.isRunning = false;
    console.log('⛔ AutoTrader stopped');
  }

  /**
   * Main trading logic - executes on interval
   */
  private async executeTradeLogic(): Promise<void> {
    if (!this.config.autoTrade) return;

    const assets: Asset[] = ['XAU/USD', 'BTC/USD', 'US30', 'GER30'];

    for (const asset of assets) {
      try {
        await this.evaluateAndTrade(asset);
      } catch (error) {
        console.error(`Error trading ${asset}:`, error);
      }
    }

    // Update existing positions
    await this.updateOpenPositions();
  }

  /**
   * Evaluate asset and execute trade if conditions met
   */
  private async evaluateAndTrade(asset: Asset): Promise<void> {
    // Check if we have too many open positions
    const openPositions = this.positions.filter((p) => p.status === 'OPEN');
    if (openPositions.length >= this.config.maxOpenPositions) {
      return;
    }

    // Check if already trading this asset
    if (openPositions.some((p) => p.asset === asset)) {
      return;
    }

    // Fetch market data
    const candles = await this.fetchCandles(asset);
    if (candles.length < 20) return;

    // Calculate indicators
    const indicators = calculateIndicators(candles);

    // Get ensemble signal
    const { signal, confidence } = ensembleManager.generateConsensusSignal(
      asset,
      candles,
      indicators
    );

    // Check confidence threshold
    if (confidence < this.config.minConfidence) {
      return;
    }

    // Execute trade
    if (signal === 'BUY' || signal === 'SELL') {
      const currentPrice = candles[candles.length - 1].close;
      const quantity = this.calculatePositionSize(currentPrice);

      if (quantity > 0 && this.hasEnoughBalance(currentPrice, quantity)) {
        this.executeTrade(asset, signal as any, quantity, currentPrice, confidence);
      }
    }
  }

  /**
   * Execute a trade
   */
  private executeTrade(
    asset: Asset,
    orderType: OrderType,
    quantity: number,
    entryPrice: number,
    confidence: number
  ): void {
    const position: Position = {
      id: uuidv4(),
      asset,
      entryPrice,
      quantity,
      orderType,
      openTime: Date.now(),
      status: 'OPEN',
      pnl: 0,
      pnlPercent: 0,
      leverage: 1,
      margin: new Decimal(entryPrice).times(quantity).toNumber(),
      isFullMargin: false,
    };

    // Deduct from balance
    this.balance = this.balance.minus(position.margin);
    this.positions.push(position);

    console.log(`🟢 ${orderType} ${asset} | Qty: ${quantity} | Price: $${entryPrice.toFixed(2)} | Confidence: ${(confidence * 100).toFixed(1)}%`);

    // Record trade
    this.tradeHistory.push({
      timestamp: Date.now(),
      asset,
      action: orderType,
      price: entryPrice,
      quantity,
      result: 'PENDING',
    });
  }

  /**
   * Update all open positions and close if targets hit
   */
  private async updateOpenPositions(): Promise<void> {
    const openPositions = this.positions.filter((p) => p.status === 'OPEN');

    for (const position of openPositions) {
      try {
        const currentPrice = await this.fetchCurrentPrice(position.asset);
        if (!currentPrice) continue;

        // Calculate P&L
        const priceDiff =
          position.orderType === 'BUY' ? currentPrice - position.entryPrice : position.entryPrice - currentPrice;
        const pnl = priceDiff * position.quantity;
        const pnlPercent = (priceDiff / position.entryPrice) * 100;

        position.pnl = pnl;
        position.pnlPercent = pnlPercent;

        // Check take profit
        if (pnlPercent >= this.config.takeProfit * 100) {
          this.closePosition(position.id, currentPrice, 'TAKE_PROFIT');
        }
        // Check stop loss
        else if (pnlPercent <= -this.config.stopLoss * 100) {
          this.closePosition(position.id, currentPrice, 'STOP_LOSS');
        }
      } catch (error) {
        console.error(`Error updating position ${position.id}:`, error);
      }
    }
  }

  /**
   * Close a position
   */
  private closePosition(positionId: string, closePrice: number, reason: string): void {
    const position = this.positions.find((p) => p.id === positionId);
    if (!position) return;

    const priceDiff =
      position.orderType === 'BUY' ? closePrice - position.entryPrice : position.entryPrice - closePrice;
    const pnl = priceDiff * position.quantity;
    const isWin = pnl > 0;

    position.status = 'CLOSED';
    position.closeTime = Date.now();
    position.pnl = pnl;

    // Return margin + profit/loss to balance
    this.balance = this.balance.plus(position.margin).plus(pnl);

    const emoji = isWin ? '💰' : '📉';
    console.log(
      `${emoji} CLOSED ${position.asset} | P&L: $${pnl.toFixed(2)} (${position.pnlPercent.toFixed(2)}%) | Reason: ${reason}`
    );

    // Update trade history
    const trade = this.tradeHistory[this.tradeHistory.length - 1];
    if (trade) {
      trade.result = isWin ? 'WIN' : 'LOSS';
    }
  }

  /**
   * Calculate position size based on balance
   */
  private calculatePositionSize(price: number): number {
    const riskAmount = this.balance.times(this.config.positionSize);
    const quantity = riskAmount.dividedBy(price).toNumber();
    return Math.floor(quantity);
  }

  /**
   * Check if we have enough balance for a trade
   */
  private hasEnoughBalance(price: number, quantity: number): boolean {
    const requiredMargin = new Decimal(price).times(quantity);
    return this.balance.greaterThanOrEqualTo(requiredMargin);
  }

  /**
   * Fetch candles from API
   */
  private async fetchCandles(asset: Asset): Promise<Candle[]> {
    try {
      const response = await fetch(`/api/data/candles?asset=${asset}&timeframe=1h&limit=100`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.candles || [];
    } catch (error) {
      console.error(`Error fetching candles for ${asset}:`, error);
      return [];
    }
  }

  /**
   * Fetch current price
   */
  private async fetchCurrentPrice(asset: Asset): Promise<number | null> {
    try {
      const response = await fetch(`/api/data/quote?asset=${asset}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.quote?.last || null;
    } catch (error) {
      console.error(`Error fetching price for ${asset}:`, error);
      return null;
    }
  }

  // Getters for monitoring
  getBalance(): number {
    return this.balance.toNumber();
  }

  getOpenPositions(): Position[] {
    return this.positions.filter((p) => p.status === 'OPEN');
  }

  getAllPositions(): Position[] {
    return this.positions;
  }

  getTradeHistory(): typeof this.tradeHistory {
    return this.tradeHistory;
  }

  getTotalPnL(): number {
    const closedPositions = this.positions.filter((p) => p.status === 'CLOSED');
    return closedPositions.reduce((sum, p) => sum + p.pnl, 0);
  }

  getWinRate(): number {
    const closedPositions = this.positions.filter((p) => p.status === 'CLOSED');
    if (closedPositions.length === 0) return 0;
    const wins = closedPositions.filter((p) => p.pnl > 0).length;
    return wins / closedPositions.length;
  }

  getConfig(): TradeConfig {
    return this.config;
  }

  updateConfig(newConfig: Partial<TradeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ AutoTrader config updated:', this.config);
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const autoTrader = new AutoTrader({
  autoTrade: true,
  maxOpenPositions: 5,
  positionSize: 0.1,
  takeProfit: 0.02,
  stopLoss: 0.01,
  minConfidence: 0.55,
  checkInterval: 5000,
});
