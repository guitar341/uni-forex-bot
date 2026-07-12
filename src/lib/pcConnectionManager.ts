// Desktop PC Connection Manager
import { AutoTrader } from './autoTrader';
import { MT5Connector } from './mt5Connector';

interface PCConnectionConfig {
  pcHost: string; // localhost or IP
  pcPort: number; // default 8080
  autoSync: boolean;
  syncInterval: number; // milliseconds
}

export class PCConnectionManager {
  private config: PCConnectionConfig;
  private autoTrader: AutoTrader | null = null;
  private mt5Connector: MT5Connector | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;

  constructor(config: Partial<PCConnectionConfig> = {}) {
    this.config = {
      pcHost: 'localhost',
      pcPort: 8080,
      autoSync: true,
      syncInterval: 5000,
      ...config,
    };
  }

  /**
   * Initialize connection to PC
   */
  async initialize(
    autoTrader: AutoTrader,
    mt5Connector: MT5Connector,
    mt5Config: any
  ): Promise<boolean> {
    this.autoTrader = autoTrader;
    this.mt5Connector = mt5Connector;

    try {
      // Test connection to PC bridge
      const pcConnected = await this.testPCConnection();
      if (!pcConnected) {
        console.warn('⚠️  Could not connect to PC bridge at', `${this.config.pcHost}:${this.config.pcPort}`);
        console.info('📝 Make sure the MT5 bridge application is running on your PC');
      }

      // Connect to MT5 via bridge
      const mt5Connected = await mt5Connector.connect(mt5Config);
      if (!mt5Connected) {
        console.warn('⚠️  Could not connect to MetaTrader 5');
        console.info('📝 Make sure MetaTrader 5 is running and the bridge is active');
      }

      this.isConnected = pcConnected && mt5Connected;

      if (this.isConnected && this.config.autoSync) {
        this.startSync();
      }

      return this.isConnected;
    } catch (error) {
      console.error('❌ PC Connection initialization failed:', error);
      return false;
    }
  }

  /**
   * Test PC connection
   */
  private async testPCConnection(): Promise<boolean> {
    try {
      const response = await fetch(`http://${this.config.pcHost}:${this.config.pcPort}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start synchronization between bot and MT5
   */
  private startSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      this.synchronize();
    }, this.config.syncInterval);

    console.log('🔄 PC/MT5 Synchronization started');
  }

  /**
   * Synchronize bot positions with MT5
   */
  private async synchronize(): Promise<void> {
    if (!this.autoTrader || !this.mt5Connector) return;

    try {
      // Get bot positions
      const botPositions = this.autoTrader.getOpenPositions();
      const mt5Orders = this.mt5Connector.getOpenOrders();

      // Sync: Bot -> MT5
      for (const botPos of botPositions) {
        const existingOrder = mt5Orders.find((o) => o.ticket.toString() === botPos.id);
        if (!existingOrder && botPos.status === 'OPEN') {
          // Execute on MT5
          await this.mt5Connector.executeOrder(
            botPos.asset,
            botPos.orderType,
            botPos.quantity,
            botPos.entryPrice,
            botPos.entryPrice * (botPos.orderType === 'BUY' ? 1.02 : 0.98), // TP at 2%
            botPos.entryPrice * (botPos.orderType === 'BUY' ? 0.99 : 1.01)  // SL at 1%
          );
        }
      }

      // Sync: MT5 -> Bot (update P&L)
      for (const mt5Order of mt5Orders) {
        const botPos = botPositions.find((p) => p.id === mt5Order.ticket.toString());
        if (botPos) {
          botPos.pnl = mt5Order.profit;
          botPos.pnlPercent = (mt5Order.profit / (mt5Order.volume * mt5Order.openPrice)) * 100;
        }
      }
    } catch (error) {
      console.error('❌ Synchronization error:', error);
    }
  }

  /**
   * Stop synchronization
   */
  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️  PC/MT5 Synchronization stopped');
    }
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean;
    pcConnected: boolean;
    mt5Connected: boolean;
    syncing: boolean;
  } {
    return {
      connected: this.isConnected,
      pcConnected: this.isConnected, // PC connection via WebSocket
      mt5Connected: this.mt5Connector?.isConnectedToMT5() || false,
      syncing: this.syncInterval !== null,
    };
  }

  /**
   * Disconnect all
   */
  disconnect(): void {
    this.stopSync();
    this.mt5Connector?.disconnect();
    this.isConnected = false;
    console.log('🔌 Disconnected from PC and MetaTrader 5');
  }
}

export const pcConnectionManager = new PCConnectionManager();
