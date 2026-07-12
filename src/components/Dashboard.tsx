'use client';

import React, { useState } from 'react';
import { DashboardMetrics, StrategyMetrics } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  metrics: DashboardMetrics | null;
  strategies: StrategyMetrics[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Dashboard: React.FC<DashboardProps> = ({ metrics, strategies }) => {
  const [selectedAsset, setSelectedAsset] = useState<string>('XAU/USD');

  if (!metrics) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
        <p className="text-slate-400">No dashboard data available</p>
      </div>
    );
  }

  const strategyData = strategies
    .slice(0, 20) // Top 20 strategies
    .map((s) => ({
      name: `S${s.id.split('_')[1]}`,
      winRate: s.winRate * 100,
      pnl: s.totalPnL,
    }));

  const assetData = Object.entries(metrics.assetPerformance).map(([asset, perf]) => ({
    name: asset,
    value: perf.pnl,
    trades: perf.trades,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Total Profit</p>
          <p className={`text-2xl font-bold ${metrics.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${metrics.totalProfit.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Win Rate</p>
          <p className="text-2xl font-bold text-blue-400">{(metrics.winRate * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Active Strategies</p>
          <p className="text-2xl font-bold text-purple-400">{metrics.activeStrategies} / 10000</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Open Positions</p>
          <p className="text-2xl font-bold text-yellow-400">{metrics.activePositions}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Win Rate by Strategy */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-bold text-white mb-4">Top 20 Strategies (Win Rate %)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={strategyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                }}
              />
              <Bar dataKey="winRate" fill="#3b82f6" name="Win Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Performance */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-bold text-white mb-4">Profit by Asset</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={assetData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {assetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strategy Performance Breakdown */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-bold text-white mb-4">Per-Strategy Performance (Top 10)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-2 text-slate-400">Strategy</th>
                <th className="text-left py-2 px-2 text-slate-400">Trades</th>
                <th className="text-left py-2 px-2 text-slate-400">Win Rate</th>
                <th className="text-left py-2 px-2 text-slate-400">P&L</th>
                <th className="text-left py-2 px-2 text-slate-400">Max DD</th>
              </tr>
            </thead>
            <tbody>
              {strategies.slice(0, 10).map((strategy) => (
                <tr key={strategy.id} className="border-b border-slate-700/50 hover:bg-slate-700/50">
                  <td className="py-3 px-2 text-white font-semibold">{strategy.name}</td>
                  <td className="py-3 px-2 text-slate-300">{strategy.totalTrades}</td>
                  <td className="py-3 px-2 text-green-400 font-semibold">{(strategy.winRate * 100).toFixed(1)}%</td>
                  <td className={`py-3 px-2 font-semibold ${strategy.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${strategy.totalPnL.toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-red-400">{(strategy.maxDrawdown * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
