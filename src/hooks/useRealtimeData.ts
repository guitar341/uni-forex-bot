// React hook for real-time data updates
import { useEffect, useState, useCallback } from 'react';
import { Candle, QuoteData, Prediction } from '@/types';
import { forexClient } from '@/lib/forexDataClient';

interface UseRealtimeDataOptions {
  asset: string;
  updateInterval?: number;
}

export const useRealtimeData = (options: UseRealtimeDataOptions) => {
  const { asset, updateInterval = 1000 } = options;
  const [candles, setCandles] = useState<Candle[]>([]);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const data = await forexClient.getCandles(asset as any, '1h', 500);
        setCandles(data);
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [asset]);

  // Subscribe to live updates
  useEffect(() => {
    const unsubscribe = forexClient.subscribeToLive(asset as any, (newQuote) => {
      setQuote(newQuote);
    });

    return unsubscribe;
  }, [asset]);

  return { candles, quote, isLoading, error };
};

// React hook for prediction updates
export const usePrediction = (asset: string) => {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePrediction = useCallback(async () => {
    setIsUpdating(true);
    try {
      // Fetch prediction from API
      const response = await fetch(`/api/prediction?asset=${asset}`);
      if (response.ok) {
        const data = await response.json();
        setPrediction(data.prediction);
      }
    } catch (error) {
      console.error('Error fetching prediction:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [asset]);

  useEffect(() => {
    updatePrediction();
    const interval = setInterval(updatePrediction, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [updatePrediction]);

  return { prediction, isUpdating, updatePrediction };
};
