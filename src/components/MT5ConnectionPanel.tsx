'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Link2, Unlink2 } from 'lucide-react';

interface ConnectionStatus {
  connected: boolean;
  pcConnected: boolean;
  mt5Connected: boolean;
  syncing: boolean;
}

interface MT5ConnectionPanelProps {
  onConnect: (config: any) => Promise<boolean>;
  onDisconnect: () => void;
  status: ConnectionStatus;
}

export const MT5ConnectionPanel: React.FC<MT5ConnectionPanelProps> = ({
  onConnect,
  onDisconnect,
  status,
}) => {
  const [accountNumber, setAccountNumber] = useState('123456789');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountServer, setAccountServer] = useState('MetaQuotes-Demo');
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    const success = await onConnect({
      accountNumber,
      accountPassword,
      accountServer,
      apiKey,
      platform: 'MetaTrader5',
    });
    setIsConnecting(false);
    if (success) {
      setShowSettings(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-4 h-4 rounded-full ${
              status.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          ></div>
          <h3 className="text-xl font-bold text-white">🖥️ MetaTrader 5 Connection</h3>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-slate-400 hover:text-white transition"
        >
          <Link2 className="w-5 h-5" />
        </button>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-700/50 p-3 rounded-lg border" style={{
          borderColor: status.pcConnected ? '#10b981' : '#ef4444'
        }}>
          <p className="text-xs text-slate-400 mb-1">PC Bridge</p>
          <p className={`text-sm font-bold ${status.pcConnected ? 'text-green-400' : 'text-red-400'}`}>
            {status.pcConnected ? '🟢 Connected' : '🔴 Offline'}
          </p>
        </div>
        <div className="bg-slate-700/50 p-3 rounded-lg border" style={{
          borderColor: status.mt5Connected ? '#10b981' : '#ef4444'
        }}>
          <p className="text-xs text-slate-400 mb-1">MetaTrader 5</p>
          <p className={`text-sm font-bold ${status.mt5Connected ? 'text-green-400' : 'text-red-400'}`}>
            {status.mt5Connected ? '🟢 Connected' : '🔴 Offline'}
          </p>
        </div>
        <div className="bg-slate-700/50 p-3 rounded-lg border" style={{
          borderColor: status.syncing ? '#3b82f6' : '#64748b'
        }}>
          <p className="text-xs text-slate-400 mb-1">Sync Status</p>
          <p className={`text-sm font-bold ${status.syncing ? 'text-blue-400' : 'text-slate-400'}`}>
            {status.syncing ? '🔄 Syncing' : '⏸️ Paused'}
          </p>
        </div>
      </div>

      {/* Connection Settings */}
      {showSettings && (
        <div className="bg-slate-700/50 p-4 rounded-lg mb-6 space-y-4 border border-slate-600">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Account Password</label>
            <input
              type="password"
              value={accountPassword}
              onChange={(e) => setAccountPassword(e.target.value)}
              className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your MT5 password"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Server</label>
            <select
              value={accountServer}
              onChange={(e) => setAccountServer(e.target.value)}
              className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>MetaQuotes-Demo</option>
              <option>MetaQuotes-Live</option>
              <option>Custom Server</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your API key"
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg">
            <p className="text-xs text-blue-300">
              💡 Make sure MetaTrader 5 is running and the PC bridge service is active on port 8080
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!status.connected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting || !accountNumber || !accountPassword}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Wifi className="w-5 h-5" />
            {isConnecting ? 'Connecting...' : 'Connect to MT5'}
          </button>
        ) : (
          <button
            onClick={onDisconnect}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <WifiOff className="w-5 h-5" />
            Disconnect
          </button>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
        <p className="text-xs text-slate-300 mb-2">
          <strong>🔗 Live Trading:</strong> When connected, your AutoTrader will automatically execute trades on MetaTrader 5
        </p>
        <p className="text-xs text-slate-300">
          <strong>📊 Synchronization:</strong> All positions are synced in real-time. Your P&L updates automatically.
        </p>
      </div>
    </div>
  );
};
