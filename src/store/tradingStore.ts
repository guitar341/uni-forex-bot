import create from 'zustand';
import { PaperTrade, Position, StrategyMetrics, Prediction, DashboardMetrics } from '@/types';

interface TradingStore {
  // Paper Trading State
  paperTrade: PaperTrade;
  isPaperTrading: boolean;
  startPaperTrade: (initialBalance: number, leverage: number) => void;
  closePaperTrade: () => void;
  updateBalance: (amount: number) => void;
  addPosition: (position: Position) => void;
  closePosition: (positionId: string, closePrice: number) => void;
  updatePositionPnL: (positionId: string, currentPrice: number) => void;

  // Strategies
  strategies: StrategyMetrics[];
  loadStrategies: (strategies: StrategyMetrics[]) => void;
  updateStrategyMetrics: (strategyId: string, metrics: Partial<StrategyMetrics>) => void;

  // Predictions
  predictions: Record<string, Prediction>;
  updatePrediction: (asset: string, prediction: Prediction) => void;

  // Dashboard
  dashboardMetrics: DashboardMetrics | null;
  updateDashboardMetrics: (metrics: DashboardMetrics) => void;

  // UI State
  selectedAsset: string;
  setSelectedAsset: (asset: string) => void;
  showPredictionCard: boolean;
  setShowPredictionCard: (show: boolean) => void;
  showBacktestPanel: boolean;
  setShowBacktestPanel: (show: boolean) => void;
}

export const useTradingStore = create<TradingStore>((set) => ({
  // Paper Trading
  paperTrade: {
    positions: [],
    balance: 0,
    equity: 0,
    usedMargin: 0,
    availableMargin: 0,
    leverage: 1,
    totalPnL: 0,
    totalPnLPercent: 0,
    winRate: 0,
    totalTrades: 0,
    winTrades: 0,
    lossTrades: 0,
  },
  isPaperTrading: false,

  startPaperTrade: (initialBalance, leverage) =>
    set({
      isPaperTrading: true,
      paperTrade: {
        positions: [],
        balance: initialBalance,
        equity: initialBalance,
        usedMargin: 0,
        availableMargin: initialBalance,
        leverage,
        totalPnL: 0,
        totalPnLPercent: 0,
        winRate: 0,
        totalTrades: 0,
        winTrades: 0,
        lossTrades: 0,
      },
    }),

  closePaperTrade: () => set({ isPaperTrading: false }),

  updateBalance: (amount) =>
    set((state) => ({
      paperTrade: {
        ...state.paperTrade,
        balance: state.paperTrade.balance + amount,
      },
    })),

  addPosition: (position) =>
    set((state) => ({
      paperTrade: {
        ...state.paperTrade,
        positions: [...state.paperTrade.positions, position],
      },
    })),

  closePosition: (positionId, closePrice) =>
    set((state) => {
      const positions = state.paperTrade.positions.map((p) =>
        p.id === positionId
          ? {
              ...p,
              status: 'CLOSED' as const,
              closeTime: Date.now(),
              pnl: p.orderType === 'BUY' ? (closePrice - p.entryPrice) * p.quantity : (p.entryPrice - closePrice) * p.quantity,
            }
          : p
      );
      return { paperTrade: { ...state.paperTrade, positions } };
    }),

  updatePositionPnL: (positionId, currentPrice) =>
    set((state) => ({
      paperTrade: {
        ...state.paperTrade,
        positions: state.paperTrade.positions.map((p) =>
          p.id === positionId
            ? {
                ...p,
                pnl: p.orderType === 'BUY' ? (currentPrice - p.entryPrice) * p.quantity : (p.entryPrice - currentPrice) * p.quantity,
                pnlPercent: ((currentPrice - p.entryPrice) / p.entryPrice) * 100,
              }
            : p
        ),
      },
    })),

  // Strategies
  strategies: [],
  loadStrategies: (strategies) => set({ strategies }),

  updateStrategyMetrics: (strategyId, metrics) =>
    set((state) => ({
      strategies: state.strategies.map((s) => (s.id === strategyId ? { ...s, ...metrics } : s)),
    })),

  // Predictions
  predictions: {},
  updatePrediction: (asset, prediction) =>
    set((state) => ({
      predictions: { ...state.predictions, [asset]: prediction },
    })),

  // Dashboard
  dashboardMetrics: null,
  updateDashboardMetrics: (metrics) => set({ dashboardMetrics: metrics }),

  // UI State
  selectedAsset: 'XAU/USD',
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),
  showPredictionCard: true,
  setShowPredictionCard: (show) => set({ showPredictionCard: show }),
  showBacktestPanel: false,
  setShowBacktestPanel: (show) => set({ showBacktestPanel: show }),
}));
