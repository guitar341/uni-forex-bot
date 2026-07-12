// MetaTrader 5 Integration
import { Position, Asset, OrderType } from '@/types';
import Decimal from 'decimal.js';

interface MT5Config {
  accountNumber: string;
  accountPassword: string;
  accountServer: string;
  apiKey: string;
  platform: 'MetaTrader5';
}

interface MT5Order {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL' | 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP';
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  commission: number;
  profit: number;
  openTime: number;
  closeTime: number | null;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
}

export class MT5Connector {
  private config: MT5Config | null = null;
  private isConnected: boolean = false;
  private orders: Map<string, MT5Order> = new Map();
  private accountBalance: Decimal = new Decimal(0);
  private accountEquity: Decimal = new Decimal(0);
  private wsConnection: WebSocket | null = null;

  /**
   * Initialize MetaTrader 5 connection
   */
  async connect(config: MT5Config): Promise<boolean> {
    try {
      this.config = config;

      // Connect via WebSocket to local MT5 bridge
      return await this.connectViaWebSocket();
    } catch (error) {
      console.error('❌ MT5 Connection failed:', error);
      return false;
    }
  }

  /**
   * Connect via WebSocket to local MT5 bridge
   */
  private async connectViaWebSocket(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Connect to local WebSocket server (must be running on PC)
        this.wsConnection = new WebSocket('ws://localhost:8080/mt5');

        this.wsConnection.onopen = () => {
          console.log('✅ MetaTrader 5 WebSocket connected');
          this.isConnected = true;

          // Send authentication
          if (this.config) {
            this.wsConnection?.send(
              JSON.stringify({
                type: 'AUTH',
                accountNumber: this.config.accountNumber,
                accountPassword: this.config.accountPassword,
                accountServer: this.config.accountServer,
                apiKey: this.config.apiKey,
              })
            );
          }

          resolve(true);
        };

        this.wsConnection.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleMT5Message(data);
        };

        this.wsConnection.onerror = (error) => {
          console.error('❌ MT5 WebSocket error:', error);
          this.isConnected = false;
          resolve(false);
        };

        this.wsConnection.onclose = () => {
          console.log('⚠️  MT5 WebSocket disconnected');
          this.isConnected = false;
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            console.warn('⚠️  MT5 connection timeout - ensure MT5 bridge is running');
            resolve(false);
          }
        }, 5000);
      } catch (error) {
        console.error('❌ WebSocket connection error:', error);
        resolve(false);
      }
    });
  }

  /**
   * Handle messages from MT5 bridge
   */
  private handleMT5Message(data: any): void {
    switch (data.type) {
      case 'AUTH_SUCCESS':
        console.log('✅ MT5 Authentication successful');
        this.accountBalance = new Decimal(data.balance);
        this.accountEquity = new Decimal(data.equity);
        break;

      case 'ORDERS_UPDATE':
        this.updateOrders(data.orders);
        break;

      case 'ACCOUNT_UPDATE':
        this.accountBalance = new Decimal(data.balance);
        this.accountEquity = new Decimal(data.equity);
        console.log(`💰 MT5 Account: Balance $${this.accountBalance.toFixed(2)} | Equity $${this.accountEquity.toFixed(2)}`);
        break;

      case 'ORDER_OPENED':
        console.log(`🟢 MT5 Order opened: ${data.ticket} - ${data.symbol}`);
        break;

      case 'ORDER_CLOSED':
        console.log(`🔴 MT5 Order closed: ${data.ticket} - P&L: $${data.profit.toFixed(2)}`);
        break;

      case 'ERROR':
        console.error(`❌ MT5 Error: ${data.message}`);
        break;
    }
  }

  /**
   * Update orders from MT5
   */
  private updateOrders(mt5Orders: MT5Order[]): void {
    mt5Orders.forEach((order) => {
      this.orders.set(order.ticket.toString(), order);
    });
  }

  /**
   * Execute order on MetaTrader 5
   */
  async executeOrder(
    asset: Asset,
    orderType: OrderType,
    volume: number,
    entryPrice: number,
    takeProfit: number,
    stopLoss: number
  ): Promise<number | null> {
    if (!this.isConnected || !this.wsConnection) {
      console.error('❌ MT5 not connected');
      return null;
    }

    const mt5OrderType = this.convertOrderType(orderType);
    const symbol = this.convertAssetToSymbol(asset);

    const orderRequest = {
      type: 'SEND_ORDER',
      symbol,
      mt5OrderType,
      volume,
      price: entryPrice,
      takeProfit,
      stopLoss,
    };

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('⚠️  MT5 order timeout');
        resolve(null);
      }, 5000);

      // Send order
      this.wsConnection?.send(JSON.stringify(orderRequest));

      // Wait for response (in real implementation, use event emitter)
      const checkResponse = setInterval(() => {
        const lastOrder = Array.from(this.orders.values()).pop();
        if (lastOrder && lastOrder.status === 'OPEN') {
          clearInterval(checkResponse);
          clearTimeout(timeout);
          resolve(lastOrder.ticket);
        }
      }, 100);
    });
  }

  /**
   * Close order on MetaTrader 5
   */
  async closeOrder(ticket: number, volume: number, closePrice: number): Promise<boolean> {
    if (!this.isConnected || !this.wsConnection) {
      console.error('❌ MT5 not connected');
      return false;
    }

    const closeRequest = {
      type: 'CLOSE_ORDER',
      ticket,
      volume,
      price: closePrice,
    };

    this.wsConnection.send(JSON.stringify(closeRequest));
    return true;
  }

  /**
   * Convert order type to MT5 format
   */
  private convertOrderType(orderType: OrderType): string {
    const map: Record<OrderType, string> = {
      BUY: 'BUY',
      SELL: 'SELL',
      HOLD: 'HOLD',
      WAIT: 'WAIT',
      CLOSE: 'CLOSE',
    };
    return map[orderType] || 'BUY';
  }

  /**
   * Convert asset to MT5 symbol
   */
  private convertAssetToSymbol(asset: Asset): string {
    const map: Record<Asset, string> = {
      'XAU/USD': 'XAUUSD',
      'BTC/USD': 'BTCUSD',
      'US30': 'US30',
      'GER30': 'GER30',
    };
    return map[asset] || 'XAUUSD';
  }

  /**
   * Get all open orders
   */
  getOpenOrders(): MT5Order[] {
    return Array.from(this.orders.values()).filter((o) => o.status === 'OPEN');
  }

  /**
   * Get account balance
   */
  getBalance(): number {
    return this.accountBalance.toNumber();
  }

  /**
   * Get account equity
   */
  getEquity(): number {
    return this.accountEquity.toNumber();
  }

  /**
   * Check if connected
   */
  isConnectedToMT5(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from MT5
   */
  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.isConnected = false;
      console.log('🔌 Disconnected from MetaTrader 5');
    }
  }
}

export const mt5Connector = new MT5Connector();
