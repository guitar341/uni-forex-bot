import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    // Simulated backtest results
    const results = {
      asset: config.asset,
      timeframe: config.timeframe,
      totalTrades: Math.floor(Math.random() * 200) + 100,
      winTrades: Math.floor(Math.random() * 120) + 50,
      lossTrades: Math.floor(Math.random() * 80) + 30,
      winRate: Math.random() * 0.7 + 0.3,
      totalPnL: (Math.random() - 0.3) * 10000,
      maxDrawdown: Math.random() * 0.3,
      profitFactor: Math.random() * 2 + 0.5,
      sharpeRatio: Math.random() * 2 + 0.5,
      equityHistory: [
        { timestamp: config.startDate, equity: config.initialBalance },
        { timestamp: config.endDate, equity: config.initialBalance + Math.random() * 10000 },
      ],
    };

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Backtest failed' }, { status: 500 });
  }
}
