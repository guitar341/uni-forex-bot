'use client';

import React, { useState, useEffect } from 'react';
import { BacktestConfig, BacktestResult } from '@/types';
import { Play, Settings } from 'lucide-react';

interface BacktestPanelProps {
  onRunBacktest: (config: BacktestConfig) => Promise<BacktestResult>;
}

export const BacktestPanel: React.FC<BacktestPanelProps> = ({ onRunBacktest }) => {
  const [config, setConfig] = useState<Partial<BacktestConfig>>({
    asset: 'XAU/USD',
    timeframe: '1h',
    barLimit: 500,
    slippage: 0.0002,
    commission: 0.0001,
    initialBalance: 10000,
    leverage: 1,
  });

  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunBacktest = async () => {
    setIsRunning(true);
    try {
      // Calculate date range (last 1 year)
      const endDate = Date.now();
      const startDate = endDate - 365 * 24 * 60 * 60 * 1000;

      const fullConfig: BacktestConfig = {
        ...config,
        startDate,
        endDate,
      } as BacktestConfig;

      const backtestResult = await onRunBacktest(fullConfig);
      setResult(backtestResult);
    } catch (error) {
      console.error('Backtest error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" /> Backtest Configuration
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Asset</label>
            <select
              value={config.asset}
              onChange={(e) => setConfig({ ...config, asset: e.target.value as any })}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>XAU/USD</option>
              <option>BTC/USD</option>
              <option>US30</option>
              <option>GER30</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Timeframe</label>
            <select
              value={config.timeframe}
              onChange={(e) => setConfig({ ...config, timeframe: e.target.value as any })}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>1m</option>
              <option>5m</option>
              <option>15m</option>
              <option>1h</option>
              <option>4h</option>
              <option>1d</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Bar Limit</label>
            <input
              type="number"
              value={config.barLimit}
              onChange={(e) => setConfig({ ...config, barLimit: parseInt(e.target.value) })}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Initial Balance</label>
            <input
              type="number"
              value={config.initialBalance}
              onChange={(e) => setConfig({ ...config, initialBalance: parseFloat(e.target.value) })}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Slippage</label>
            <input
              type="number"
              step="0.0001"
              value={config.slippage}
              onChange={(e) => setConfig({ ...config, slippage: parseFloat(e.target.value) })}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Commission</label>
            <input
              type="number"
              step="0.0001"
              value={config.commission}
              onChange={(e) => setConfig({ ...config, commission: parseFloat(e.target.value) })}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleRunBacktest}
          disabled={isRunning}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" /> {isRunning ? 'Running Backtest...' : 'Run Backtest'}
        </button>
      </div>

      {/* Results Panel */}
      {result && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Backtest Results</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Total Trades</p>
              <p className="text-2xl font-bold text-white">{result.totalTrades}</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-green-400">{(result.winRate * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Total P&L</p>
              <p className={`text-2xl font-bold ${result.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${result.totalPnL.toFixed(2)}
              </p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Max Drawdown</p>
              <p className="text-2xl font-bold text-red-400">{(result.maxDrawdown * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Profit Factor</p>
              <p className="text-2xl font-bold text-blue-400">{result.profitFactor.toFixed(2)}</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Sharpe Ratio</p>
              <p className="text-2xl font-bold text-purple-400">{result.sharpeRatio.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
