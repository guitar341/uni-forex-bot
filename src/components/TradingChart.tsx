'use client';

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Candle, ForecastStep } from '@/types';

interface ChartProps {
  candles: Candle[];
  forecastSteps?: ForecastStep[];
  currentPrice?: number;
  overlayTargets?: { price: number; label: string; color: string }[];
}

export const TradingChart: React.FC<ChartProps> = ({
  candles,
  forecastSteps = [],
  currentPrice,
  overlayTargets = [],
}) => {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const data = candles.map((candle) => ({
      timestamp: new Date(candle.timestamp).toLocaleTimeString(),
      close: candle.close,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      volume: candle.volume,
    }));
    setChartData(data);
  }, [candles]);

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg p-4">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="timestamp" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
            }}
            formatter={(value) => `$${Number(value).toFixed(2)}`}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Legend />
          
          {/* Main price line */}
          <Line
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            dot={false}
            isAnimationActive={false}
            name="Close Price"
          />

          {/* Current price line */}
          {currentPrice && <ReferenceLine y={currentPrice} stroke="#10b981" strokeDasharray="5 5" label="Current" />}

          {/* Forecast target lines */}
          {overlayTargets.map((target, idx) => (
            <ReferenceLine
              key={idx}
              y={target.price}
              stroke={target.color}
              strokeDasharray="3 3"
              label={{ value: target.label, position: 'right', fill: target.color }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
