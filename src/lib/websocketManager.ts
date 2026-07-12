// WebSocket handler for real-time updates
import { Server, Socket } from 'socket.io';
import { Candle, QuoteData } from '@/types';

class WebSocketManager {
  private io: Server | null = null;
  private subscribers: Map<string, Set<string>> = new Map();

  initialize(server: any) {
    this.io = new Server(server, {
      cors: { origin: '*' },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('subscribe', (channel: string) => {
        if (!this.subscribers.has(channel)) {
          this.subscribers.set(channel, new Set());
        }
        this.subscribers.get(channel)!.add(socket.id);
        socket.join(channel);
      });

      socket.on('unsubscribe', (channel: string) => {
        const subs = this.subscribers.get(channel);
        if (subs) {
          subs.delete(socket.id);
          socket.leave(channel);
        }
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.subscribers.forEach((subs) => subs.delete(socket.id));
      });
    });
  }

  /**
   * Broadcast candle update to all subscribers
   */
  broadcastCandle(asset: string, candle: Candle) {
    const channel = `${asset}:candles`;
    if (this.io) {
      this.io.to(channel).emit('candle', { asset, candle, timestamp: Date.now() });
    }
  }

  /**
   * Broadcast quote update
   */
  broadcastQuote(quote: QuoteData) {
    const channel = `${quote.asset}:quote`;
    if (this.io) {
      this.io.to(channel).emit('quote', quote);
    }
  }

  /**
   * Broadcast prediction update
   */
  broadcastPrediction(asset: string, prediction: any) {
    const channel = `${asset}:prediction`;
    if (this.io) {
      this.io.to(channel).emit('prediction', { asset, prediction, timestamp: Date.now() });
    }
  }

  /**
   * Broadcast alert
   */
  broadcastAlert(message: string, type: 'info' | 'warning' | 'error' | 'success') {
    if (this.io) {
      this.io.emit('alert', { message, type, timestamp: Date.now() });
    }
  }
}

export const wsManager = new WebSocketManager();
