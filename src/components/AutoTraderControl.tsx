'use client';

import React, { useEffect, useState } from 'react';
import { Position } from '@/types';
import { Play, Pause, Settings2, Zap } from 'lucide-react';

interface AutoTraderControlProps {
  onStart: () => void;
  onStop: () => void;
  isActive: boolean;
  stats: {
    balance: number;
    openPositions: Position[];
    totalPnL: number;
    winRate: number;
    totalTrades: number;
  };
}

export const AutoTraderControl: React.FC<AutoTraderControlProps> = ({
  onStart,
  onStop,
  isActive,
  stats,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-2 border-blue-500/50 rounded-lg p-6 shadow-lg shadow-blue-500/20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <h2 className="text-2xl font-black text-white">🤖 AutoTrader</h2>
          <span className="text-sm font-bold px-3 py-1 rounded-full" style={{
            backgroundColor: isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: isActive ? '#22c55e' : '#ef4444'
          }}>
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-slate-300 hover:text-white transition"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-slate-700/50 p-3 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Balance</p>
          <p className="text-lg font-bold text-blue-400">${stats.balance.toFixed(2)}</p>
        </div>
        <div className="bg-slate-700/50 p-3 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Open Positions</p>
          <p className="text-lg font-bold text-yellow-400">{stats.openPositions.length}</p>
        </div>
        <div className="bg-slate-700/50 p-3 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Total P&L</p>
          <p className={`text-lg font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats.totalPnL.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-700/50 p-3 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Win Rate</p>
          <p className="text-lg font-bold text-white">{(stats.winRate * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-slate-700/50 p-3 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Total Trades</p>
          <p className="text-lg font-bold text-white">{stats.totalTrades}</p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3 mb-6">
        {!isActive ? (
          <button
            onClick={onStart}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-lg"
          >
            <Play className="w-5 h-5" /> START TRADING
          </button>
        ) : (
          <button
            onClick={onStop}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-lg"
          >
            <Pause className="w-5 h-5" /> STOP TRADING
          </button>
        )}
      </div>

      {/* Open Positions */}
      {stats.openPositions.length > 0 && (
        <div className="border-t border-slate-600 pt-4 mb-4">
          <p className="text-sm font-bold text-white mb-3">📊 Open Positions ({stats.openPositions.length})</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {stats.openPositions.map((pos) => (
              <div key={pos.id} className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-white">
                    {pos.orderType} {pos.asset}
                  </p>
                  <p className={`text-xs ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pos.pnl >= 0 ? '+' : ''}
                    ${pos.pnl.toFixed(2)} ({pos.pnlPercent.toFixed(2)}%)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">${pos.entryPrice.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">Qty: {pos.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-t border-slate-600 pt-4">
          <p className="text-sm font-bold text-white mb-3">⚙️ Settings</p>
          <div className="bg-slate-700/50 p-4 rounded-lg text-sm text-slate-300 space-y-2">
            <p>• Max Open Positions: 5</p>
            <p>• Position Size: 10% of balance</p>
            <p>• Take Profit: 2%</p>
            <p>• Stop Loss: 1%</p>
            <p>• Min Confidence: 55%</p>
            <p>• Check Interval: Every 5 seconds</p>
            <div className="mt-3 p-2 bg-blue-500/10 rounded border border-blue-500/30">
              <p className="text-xs text-blue-300 font-semibold">💡 AutoTrader is now managing your trades automatically!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
