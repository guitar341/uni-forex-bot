'use client';

import React, { useState, useEffect } from 'react';
import { TradingChart } from '@/components/TradingChart';
import { PredictionCard } from '@/components/PredictionCard';
import { Dashboard } from '@/components/Dashboard';
import { BacktestPanel } from '@/components/BacktestPanel';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { AutoTraderControl } from '@/components/AutoTraderControl';
import { useTradingStore } from '@/store/tradingStore';
import { useAutoTrader } from '@/hooks/useAutoTrader';
import { forexClient } from '@/lib/forexDataClient';
import { calculateIndicators } from '@/lib/indicators';
import { ensembleManager } from '@/lib/strategyEnsemble';
import { Candle, Prediction, ForecastStep, BacktestConfig, BacktestResult } from '@/types';
import { Activity, TrendingUp, BarChart3, Zap } from 'lucide-react';

export default function Home() {
  const store = useTradingStore();
  const autoTrader = useAutoTrader();
  const [candles, setCandles] = useState<Candle[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trading' | 'dashboard' | 'backtest' | 'autotrader'>('trading');

  // Initialize on mount
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
        reason: `Ensemble voted ${signal} with ${(confidence * 100).toFixed(1)}% confidence`,
        timestamp: Date.now(),
      },
      {
        step: 2,
        action: 'HOLD',
        targetPrice: currentPrice * (signal === 'BUY' ? 1.01 : 0.99),
        expectedRange: {
          min: currentPrice * 0.98,
          max: currentPrice * 1.02,
        },
        probability: 0.7,
        timeToTarget: 30,
        reason: 'Trend continuation',
        timestamp: Date.now(),
      },
      {
        step: 3,
        action: 'CLOSE',
        targetPrice: currentPrice * (signal === 'BUY' ? 1.015 : 0.985),
        expectedRange: {
          min: currentPrice * 0.97,
          max: currentPrice * 1.03,
        },
        probability: 0.65,
        timeToTarget: 45,
        reason: 'Take profit',
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

  const handleRunBacktest = async (config: BacktestConfig): Promise<BacktestResult> => {
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
    if (lower.includes('start') || lower.includes('trade')) {
      autoTrader.startTrading();
    } else if (lower.includes('stop')) {
      autoTrader.stopTrading();
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
            <p className="text-slate-400">10,000 Strategies | Auto Trading | Real-time Predictions</p>
          </div>
          <div className="flex items-center gap-2">
            {autoTrader.isActive ? (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-bold">AutoTrading Active</span>
              </>
            ) : (
              <>
                <Activity className="w-6 h-6 text-slate-400" />
                <span className="text-slate-400 font-bold">Standby</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-slate-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('trading')}
          className={`px-4 py-2 font-semibold transition whitespace-nowrap ${
            activeTab === 'trading' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" /> Trading
        </button>
        <button
          onClick={() => setActiveTab('autotrader')}
          className={`px-4 py-2 font-semibold transition whitespace-nowrap ${
            activeTab === 'autotrader' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 inline mr-2" /> AutoTrader
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-semibold transition whitespace-nowrap ${
            activeTab === 'dashboard' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" /> Dashboard
        </button>
        <button
          onClick={() => setActiveTab('backtest')}
          className={`px-4 py-2 font-semibold transition whitespace-nowrap ${
            activeTab === 'backtest' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Backtest
        </button>
      </div>

      {/* AutoTrader Tab */}
      {activeTab === 'autotrader' && (
        <div className="space-y-6">
          <AutoTraderControl
            onStart={autoTrader.startTrading}
            onStop={autoTrader.stopTrading}
            isActive={autoTrader.isActive}
            stats={{
              balance: autoTrader.balance,
              openPositions: autoTrader.openPositions,
              totalPnL: autoTrader.totalPnL,
              winRate: autoTrader.winRate,
              totalTrades: autoTrader.totalTrades,
            }}
          />

          {/* Live Trading Feed */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">📊 Trading Activity</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {autoTrader.openPositions.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No active positions. Start trading to begin!</p>
              ) : (
                autoTrader.openPositions.map((pos) => (
                  <div key={pos.id} className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center border-l-4" style={{
                    borderColor: pos.pnl >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {pos.orderType} {pos.asset}
                      </p>
                      <p className="text-xs text-slate-400">Entry: ${pos.entryPrice.toFixed(2)} | Qty: {pos.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pos.pnl >= 0 ? '+' : ''}
                        ${pos.pnl.toFixed(2)}
                      </p>
                      <p className={`text-xs ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pos.pnlPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trading Tab */}
      {activeTab === 'trading' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <h2 className="text-lg font-bold text-white mb-4">XAU/USD Chart</h2>
              <TradingChart
                candles={candles}
                currentPrice={candles.length > 0 ? candles[candles.length - 1].close : 0}
              />
            </div>
            {prediction && <PredictionCard prediction={prediction} isOpen={true} />}
          </div>
          <div className="space-y-6">
            <VoiceAssistant onCommand={handleVoiceCommand} isListening={false} />
          </div>
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <Dashboard metrics={store.dashboardMetrics} strategies={store.strategies} />
      )}

      {/* Backtest Tab */}
      {activeTab === 'backtest' && <BacktestPanel onRunBacktest={handleRunBacktest} />}
    </div>
  );
}
