'use client';

import React, { useState, useEffect } from 'react';
import { PaperTrade, Position } from '@/types';
import { Trash2, X } from 'lucide-react';

interface PaperTradingPanelProps {
  paperTrade: PaperTrade;
  onStartTrade: (asset: string, quantity: number, orderType: string) => void;
  onCloseTrade: (positionId: string) => void;
  onSetLeverage: (leverage: number) => void;
}

export const PaperTradingPanel: React.FC<PaperTradingPanelProps> = ({
  paperTrade,
  onStartTrade,
  onCloseTrade,
  onSetLeverage,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [leverage, setLeverageLocal] = useState(paperTrade.leverage);

  const handleLeverageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLeverage = parseFloat(e.target.value);
    setLeverageLocal(newLeverage);
    onSetLeverage(newLeverage);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
      {/* Account Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Balance</p>
          <p className="text-2xl font-bold text-white">${paperTrade.balance.toFixed(2)}</p>
        </div>
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Equity</p>
          <p className="text-2xl font-bold text-blue-400">${paperTrade.equity.toFixed(2)}</p>
        </div>
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Used Margin</p>
          <p className="text-lg font-bold text-red-400">${paperTrade.usedMargin.toFixed(2)}</p>
        </div>
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Available Margin</p>
          <p className="text-lg font-bold text-green-400">${paperTrade.availableMargin.toFixed(2)}</p>
        </div>
      </div>

      {/* P&L Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Total P&L</p>
          <p className={`text-lg font-bold ${paperTrade.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${paperTrade.totalPnL.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Win Rate</p>
          <p className="text-lg font-bold text-white">{(paperTrade.winRate * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Win Trades</p>
          <p className="text-lg font-bold text-green-400">{paperTrade.winTrades}</p>
        </div>
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Loss Trades</p>
          <p className="text-lg font-bold text-red-400">{paperTrade.lossTrades}</p>
        </div>
      </div>

      {/* Leverage Control */}
      <div className="border-t border-slate-700 pt-4">
        <label className="block text-sm font-semibold text-white mb-3">Leverage (1x - 10x)</label>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={leverage}
          onChange={handleLeverageChange}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <p className="text-center text-lg font-bold text-blue-400 mt-2">{leverage}x Leverage</p>
      </div>

      {/* Trade Input */}
      <div className="border-t border-slate-700 pt-4">
        <label className="block text-sm font-semibold text-white mb-2">Trade Size</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
          className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter quantity"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onStartTrade('XAU/USD', quantity, 'BUY')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition"
          >
            BUY
          </button>
          <button
            onClick={() => onStartTrade('XAU/USD', quantity, 'SELL')}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition"
          >
            SELL
          </button>
        </div>
      </div>

      {/* Open Positions */}
      {paperTrade.positions.length > 0 && (
        <div className="border-t border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-white mb-3">Open Positions ({paperTrade.positions.length})</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {paperTrade.positions
              .filter((p) => p.status === 'OPEN')
              .map((position) => (
                <div key={position.id} className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-white">
                      {position.orderType} {position.asset}
                    </p>
                    <p className={`text-xs ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.pnl >= 0 ? '+' : ''}
                      ${position.pnl.toFixed(2)} ({position.pnlPercent.toFixed(2)}%)
                    </p>
                  </div>
                  <button
                    onClick={() => onCloseTrade(position.id)}
                    className="text-red-400 hover:text-red-300 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
