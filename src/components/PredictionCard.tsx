'use client';

import React from 'react';
import { Prediction, ForecastStep } from '@/types';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

interface PredictionCardProps {
  prediction: Prediction;
  isOpen: boolean;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ prediction, isOpen }) => {
  const currentStep = prediction.steps[prediction.currentStep];

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'SELL':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'HOLD':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'WAIT':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'CLOSE':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Live Prediction - {prediction.asset}</h2>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-400">Live</span>
        </div>
      </div>

      {currentStep && isOpen && (
        <>
          {/* Current Step */}
          <div className={`mb-4 p-4 rounded-lg border ${getActionColor(currentStep.action)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Current Step</p>
                <p className="text-2xl font-bold">{currentStep.action}</p>
              </div>
              <div>
                {currentStep.action === 'BUY' && <TrendingUp className="w-8 h-8" />}
                {currentStep.action === 'SELL' && <TrendingDown className="w-8 h-8" />}
              </div>
            </div>
          </div>

          {/* Step Details */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-700/50 p-3 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Target Price</p>
              <p className="text-lg font-bold text-white">${currentStep.targetPrice.toFixed(2)}</p>
            </div>
            <div className="bg-slate-700/50 p-3 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Probability</p>
              <p className="text-lg font-bold text-white">{(currentStep.probability * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-slate-700/50 p-3 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Expected Range</p>
              <p className="text-sm font-bold text-white">
                ${currentStep.expectedRange.min.toFixed(2)} - ${currentStep.expectedRange.max.toFixed(2)}
              </p>
            </div>
            <div className="bg-slate-700/50 p-3 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Time to Target</p>
              <p className="text-lg font-bold text-white">{currentStep.timeToTarget} min</p>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-slate-700/30 p-3 rounded-lg mb-4">
            <p className="text-xs text-slate-400 mb-1">Why?</p>
            <p className="text-sm text-slate-200">{currentStep.reason}</p>
          </div>

          {/* Overall Prediction Confidence */}
          <div className="mb-4">
            <p className="text-xs text-slate-400 mb-2">Ensemble Confidence</p>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${prediction.confidence * 100}%` }}
              />
            </div>
            <p className="text-sm font-bold text-white mt-1">{(prediction.confidence * 100).toFixed(1)}%</p>
          </div>

          {/* Step Flow */}
          <div className="border-t border-slate-700 pt-4">
            <p className="text-xs text-slate-400 mb-3">Forecast Steps</p>
            <div className="flex gap-2 overflow-x-auto">
              {prediction.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg transition-all ${
                    idx === prediction.currentStep
                      ? 'bg-blue-500/50 border border-blue-400 text-white font-bold'
                      : idx < prediction.currentStep
                      ? 'bg-slate-600/50 border border-slate-500 text-slate-300 line-through'
                      : 'bg-slate-700/50 border border-slate-600 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{step.action}</span>
                    {idx < prediction.currentStep && <span className="text-xs">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
