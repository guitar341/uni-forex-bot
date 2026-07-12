'use client';

import React, { useState, useEffect } from 'react';
import { TradingChart } from '@/components/TradingChart';
import { PredictionCard } from '@/components/PredictionCard';
import { PaperTradingPanel } from '@/components/PaperTradingPanel';
import { Dashboard } from '@/components/Dashboard';
import { BacktestPanel } from '@/components/BacktestPanel';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { useTradingStore } from '@/store/tradingStore';
import { forexClient } from '@/lib/forexDataClient';
import { calculateIndicators } from '@/lib/indicators';
import { ensembleManager } from '@/lib/strategyEnsemble';
import { Candle, Prediction, ForecastStep, Position, BacktestConfig, BacktestResult } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Activity, TrendingUp, BarChart3 } from 'lucide-react';

export default function Home() {
  const store = useTradingStore();
  const [candles, setCandles] = useState<Candle[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trading' | 'dashboard' | 'backtest'>('trading');

  // Initialize strategies on mount
  useEffect(() => {
    const strategies = ensembleManager.getStrategies();
    store.loadStrategies(strategies);
    store.startPaperTrade(10000, 1);
    fetchMarketData();
  }, []);

  // Fetch market data
  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      const data = await forexClient.getCandles('XAU/USD', '1h', 500);
      if (data.length > 0) {
        setCandles(data);
        generatePrediction(data);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate prediction from ensemble
  const generatePrediction = (chartData: Candle[]) => {
    if (chartData.length === 0) return;

    const indicators = calculateIndicators(chartData);
    const { signal, confidence } = ensembleManager.generateConsensusSignal(
      'XAU/USD',
      chartData,
      indicators
    );

    const currentPrice = chartData[chartData.length - 1].close;
    const steps: ForecastStep[] = [
      {
        step: 1,
        action: signal,
        targetPrice: currentPrice * (signal === 'BUY' ? 1.005 : 0.995),
        expectedRange: {
          min: currentPrice * 0.99,
          max: currentPrice * 1.01,
        },
        probability: confidence,
        timeToTarget: 15,
        reason: `Ensemble voted ${signal} with ${(confidence * 100).toFixed(1)}% confidence based on RSI, MACD, Volume, and FVG analysis`,
        timestamp: Date.now(),
      },
      {
        step: 2,
        action: signal === 'BUY' ? 'HOLD' : 'HOLD',
        targetPrice: currentPrice * (signal === 'BUY' ? 1.01 : 0.99),
        expectedRange: {
          min: currentPrice * 0.98,
          max: currentPrice * 1.02,
        },
        probability: 0.7,
        timeToTarget: 30,
        reason: 'Accumulation/Distribution confirming trend continuation',
        timestamp: Date.now(),
      },
      {
        step: 3,
        action: signal === 'BUY' ? 'CLOSE' : 'CLOSE',
        targetPrice: currentPrice * (signal === 'BUY' ? 1.015 : 0.985),
        expectedRange: {
          min: currentPrice * 0.97,
          max: currentPrice * 1.03,
        },
        probability: 0.65,
        timeToTarget: 45,
        reason: 'Take profit at calculated resistance/support level',
        timestamp: Date.now(),
      },
    ];

    const newPrediction: Prediction = {
      asset: 'XAU/USD',
      currentStep: 0,
      steps,
      confidence,
      nextAction: signal,
      timestamp: Date.now(),
      updateFrequency: 60,
    };

    setPrediction(newPrediction);
    store.updatePrediction('XAU/USD', newPrediction);
  };

  // Handle paper trading
  const handleStartTrade = (asset: string, quantity: number, orderType: string) => {
    const quote = candles[candles.length - 1];
    if (!quote) return;

    const position: Position = {
      id: uuidv4(),
      asset: asset as any,
      entryPrice: quote.close,
      quantity,
      orderType: orderType as any,
      openTime: Date.now(),
      status: 'OPEN',
      pnl: 0,
      pnlPercent: 0,
      leverage: store.paperTrade.leverage,
      margin: (quote.close * quantity) / store.paperTrade.leverage,
      isFullMargin: store.paperTrade.leverage > 1,
    };

    store.addPosition(position);
  };

  const handleCloseTrade = (positionId: string) => {
    const quote = candles[candles.length - 1];
    if (quote) {
      store.closePosition(positionId, quote.close);
    }
  };

  const handleRunBacktest = async (config: BacktestConfig): Promise<BacktestResult> => {
    // Simulated backtest results
    return {
      asset: config.asset,
      totalTrades: 150,
      winTrades: 95,
      lossTrades: 55,
      winRate: 0.633,
      totalPnL: 5420.5,
      maxDrawdown: 0.15,
      profitFactor: 2.3,
      sharpeRatio: 1.87,
      strategyPerformance: store.strategies.slice(0, 10),
      trades: store.paperTrade.positions,
      equityHistory: [
        { timestamp: Date.now() - 86400000, equity: 10000 },
        { timestamp: Date.now(), equity: 15420.5 },
      ],
    };
  };

  const handleVoiceCommand = (command: string) => {
    const lower = command.toLowerCase();
    if (lower.includes('buy')) {
      handleStartTrade('XAU/USD', 1, 'BUY');
    } else if (lower.includes('sell')) {
      handleStartTrade('XAU/USD', 1, 'SELL');
    } else if (lower.includes('close')) {
      const openPosition = store.paperTrade.positions.find((p) => p.status === 'OPEN');
      if (openPosition) handleCloseTrade(openPosition.id);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Uni Forex Bot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">
              🤖 Uni Forex Bot
            </h1>
            <p className="text-slate-400">10,000 Strategies | Paper Trading | Real-time Predictions</p>
          </div>
          <div className="flex gap-2">
            <Activity className="w-6 h-6 text-green-400" />
            <span className="text-green-400 font-bold">Live</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('trading')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'trading' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" /> Trading
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'dashboard' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" /> Dashboard
        </button>
        <button
          onClick={() => setActiveTab('backtest')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'backtest' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Backtest
        </button>
      </div>

      {/* Trading Tab */}
      {activeTab === 'trading' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Chart */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <h2 className="text-lg font-bold text-white mb-4">XAU/USD Chart</h2>
              <TradingChart
                candles={candles}
                currentPrice={candles.length > 0 ? candles[candles.length - 1].close : 0}
              />
            </div>

            {/* Prediction Card */}
            {prediction && (
              <PredictionCard prediction={prediction} isOpen={store.isPaperTrading} />
            )}
          </div>

          <div className="space-y-6">
            {/* Paper Trading Panel */}
            <PaperTradingPanel
              paperTrade={store.paperTrade}
              onStartTrade={handleStartTrade}
              onCloseTrade={handleCloseTrade}
              onSetLeverage={(leverage) => {
                // Update leverage in store
              }}
            />

            {/* Voice Assistant */}
            <VoiceAssistant onCommand={handleVoiceCommand} isListening={false} />
          </div>
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <Dashboard metrics={store.dashboardMetrics} strategies={store.strategies} />
      )}

      {/* Backtest Tab */}
      {activeTab === 'backtest' && (
        <BacktestPanel onRunBacktest={handleRunBacktest} />
      )}
    </div>
  );
}
