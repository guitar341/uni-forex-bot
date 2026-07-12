// API client for real-time data feeds
import axios, { AxiosInstance } from 'axios';
import { Asset, Candle, QuoteData } from '@/types';

class ForexDataClient {
  private client: AxiosInstance;
  private ws: WebSocket | null = null;
  private subscriptions = new Set<string>();

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
      timeout: 5000,
    });
  }

  /**
   * Fetch historical candles for an asset
   */
  async getCandles(asset: Asset, timeframe: string, limit: number = 500): Promise<Candle[]> {
    try {
      const response = await this.client.get(`/api/data/candles`, {
        params: { asset, timeframe, limit },
      });
      return response.data.candles || [];
    } catch (error) {
      console.error(`Error fetching candles for ${asset}:`, error);
      return [];
    }
  }

  /**
   * Get latest quote for an asset
   */
  async getQuote(asset: Asset): Promise<QuoteData | null> {
    try {
      const response = await this.client.get(`/api/data/quote`, {
        params: { asset },
      });
      return response.data.quote || null;
    } catch (error) {
      console.error(`Error fetching quote for ${asset}:`, error);
      return null;
    }
  }

  /**
   * Get multiple quotes
   */
  async getMultipleQuotes(assets: Asset[]): Promise<Record<string, QuoteData>> {
    try {
      const response = await this.client.post(`/api/data/quotes`, { assets });
      return response.data.quotes || {};
    } catch (error) {
      console.error('Error fetching multiple quotes:', error);
      return {};
    }
  }

  /**
   * Subscribe to WebSocket for real-time updates
   */
  subscribeToLive(asset: Asset, callback: (quote: QuoteData) => void): () => void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connectWebSocket();
    }

    const subscription = `${asset}:live`;
    this.subscriptions.add(subscription);

    // Send subscription message
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'subscribe', channel: subscription }));
    }

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(subscription);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: 'unsubscribe', channel: subscription }));
      }
    };
  }

  private connectWebSocket(): void {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(() => this.connectWebSocket(), 3000);
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const forexClient = new ForexDataClient();
