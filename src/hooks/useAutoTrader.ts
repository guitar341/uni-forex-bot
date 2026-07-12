'use client';

import { useTradingStore } from '@/store/tradingStore';
import { autoTrader } from '@/lib/autoTrader';
import { useEffect, useState } from 'react';
import { Position } from '@/types';

export const useAutoTrader = () => {
  const store = useTradingStore();
  const [isActive, setIsActive] = useState(false);
  const [balance, setBalance] = useState(10000);
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);

  useEffect(() => {
    const updateStats = setInterval(() => {
      if (autoTrader.isActive()) {
        setBalance(autoTrader.getBalance());
        setOpenPositions(autoTrader.getOpenPositions());
        setTotalPnL(autoTrader.getTotalPnL());
        setWinRate(autoTrader.getWinRate());
        setTotalTrades(autoTrader.getAllPositions().length);
        setIsActive(true);
      } else {
        setIsActive(false);
      }
    }, 1000);

    return () => clearInterval(updateStats);
  }, []);

  const startTrading = () => {
    autoTrader.start();
    setIsActive(true);
  };

  const stopTrading = () => {
    autoTrader.stop();
    setIsActive(false);
  };

  return {
    isActive,
    balance,
    openPositions,
    totalPnL,
    winRate,
    totalTrades,
    startTrading,
    stopTrading,
    autoTrader,
  };
};
