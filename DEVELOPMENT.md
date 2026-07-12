# Development Guide

## Project Structure

```
uni-forex-bot/
├── src/
│   ├── app/                      # Next.js pages and API routes
│   │   ├── page.tsx              # Main dashboard page
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   └── api/                  # API routes
│   │       ├── data/
│   │       │   ├── candles/      # Historical candlestick data
│   │       │   ├── quote/        # Live quote data
│   │       │   └── quotes/       # Multiple quotes
│   │       ├── prediction/       # Prediction generation
│   │       └── backtest/         # Backtesting
│   ├── components/               # React components
│   │   ├── TradingChart.tsx      # Chart visualization
│   │   ├── PredictionCard.tsx    # Prediction display
│   │   ├── PaperTradingPanel.tsx # Paper trading UI
│   │   ├── Dashboard.tsx         # Analytics dashboard
│   │   ├── BacktestPanel.tsx     # Backtest interface
│   │   └── VoiceAssistant.tsx    # Voice commands
│   ├── lib/                      # Utility libraries
│   │   ├── indicators.ts         # Technical indicators
│   │   ├── strategyEnsemble.ts   # 10,000 strategy voting
│   │   ├── backtestEngine.ts     # Backtest simulation
│   │   ├── predictionEngine.ts   # Forecast generation
│   │   ├── forexDataClient.ts    # Data fetching
│   │   └── websocketManager.ts   # Real-time updates
│   ├── hooks/                    # Custom React hooks
│   │   └── useRealtimeData.ts    # Real-time data subscription
│   ├── store/                    # Zustand state management
│   │   └── tradingStore.ts       # Trading state
│   └── types/                    # TypeScript definitions
│       └── index.ts              # Core types
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/guitar341/uni-forex-bot.git
cd uni-forex-bot

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your API keys
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
npm run build
npm run start
```

## Architecture Overview

### 10,000 Strategy Ensemble

The bot uses a weighted voting system across 10,000 independent trading strategies:

```typescript
// Each strategy evaluates technical indicators
const signal = ensembleManager.generateConsensusSignal(
  asset,
  candles,
  indicators
);

// Returns:
// - signal: BUY | SELL | HOLD | WAIT | CLOSE
// - confidence: 0-1 probability
// - reasoning: vote counts per action
```

**Strategy Weight Calculation:**
- Based on historical win rate (60% weight)
- Based on profit factor (40% weight)
- Dynamically adjusted based on performance

### Technical Indicators

**Implemented Indicators:**
1. **RSI (Relative Strength Index)**
   - Period: 14
   - Overbought: > 70
   - Oversold: < 30

2. **MACD (Moving Average Convergence Divergence)**
   - Fast EMA: 12
   - Slow EMA: 26
   - Signal Line: 9
   - Histogram for momentum

3. **Fair Value Gaps (FVG)**
   - Bullish: Current low > Previous high
   - Bearish: Current high < Previous low
   - Tracks gap fill probability

4. **Volume Analysis**
   - Current vs Average ratio
   - Volume intensity measurement
   - On-balance volume trends

5. **Accumulation/Distribution**
   - Cumulative volume analysis
   - Money flow direction
   - Trend confirmation

### Paper Trading

**Features:**
- Simulated trading against live prices
- Margin and leverage simulation (1x - 10x)
- Real-time P&L tracking
- Position management (OPEN, CLOSED, PENDING)
- Win rate and statistics calculation

**Position Management:**
```typescript
interface Position {
  id: string;
  asset: Asset;
  entryPrice: number;
  quantity: number;
  orderType: OrderType; // BUY | SELL | HOLD | WAIT | CLOSE
  status: TradeStatus;  // OPEN | CLOSED | PENDING
  pnl: number;         // Profit/Loss
  pnlPercent: number;  // P&L %
  leverage: number;    // Position leverage
}
```

### Backtesting Engine

**Configuration:**
```typescript
interface BacktestConfig {
  asset: Asset;          // XAU/USD, BTC/USD, etc.
  timeframe: TimeFrame;  // 1m, 5m, 15m, 1h, 4h, 1d
  startDate: number;     // Timestamp
  endDate: number;       // Timestamp
  barLimit: number;      // Max candles
  slippage: number;      // 0.0002 = 0.02%
  commission: number;    // 0.0001 = 0.01%
  initialBalance: number;
  leverage: number;
}
```

**Output Metrics:**
- Total trades, win rate, profit factor
- Maximum drawdown, Sharpe ratio
- Equity curve history
- Per-strategy performance breakdown

### Real-Time Prediction

**3-Step Forecast:**

1. **Entry Signal** (15 min target)
   - Initial BUY/SELL based on ensemble vote
   - Target: 0.5% move

2. **Trend Continuation** (30 min target)
   - Hold position for secondary target
   - Target: 1% move

3. **Profit Taking** (45 min target)
   - Exit at resistance/support
   - Target: 1.5% move

**Prediction Structure:**
```typescript
interface Prediction {
  asset: Asset;
  currentStep: number;           // 0-2
  steps: ForecastStep[];         // 3 steps
  confidence: number;            // 0-1
  nextAction: OrderType;         // Next action
  timestamp: number;
  updateFrequency: number;       // In seconds
}
```

### Voice Interaction ("Uni" Bot)

**Supported Commands:**
- "Uni, what's the XAU/USD outlook?"
- "Execute a buy order"
- "Close my position"
- "Show my P&L"
- "Run backtest"
- "What's my win rate?"

**Implementation:**
- Web Speech API for speech recognition
- Text-to-speech for responses
- Command parsing and execution

## API Endpoints

### Data Endpoints

**GET /api/data/candles**
```bash
curl "http://localhost:3000/api/data/candles?asset=XAU/USD&timeframe=1h&limit=500"
```

**GET /api/data/quote**
```bash
curl "http://localhost:3000/api/data/quote?asset=XAU/USD"
```

**POST /api/data/quotes**
```bash
curl -X POST http://localhost:3000/api/data/quotes \
  -H "Content-Type: application/json" \
  -d '{"assets": ["XAU/USD", "BTC/USD", "US30"]}'
```

### Prediction Endpoint

**GET /api/prediction**
```bash
curl "http://localhost:3000/api/prediction?asset=XAU/USD"
```

Returns:
```json
{
  "prediction": {
    "asset": "XAU/USD",
    "currentStep": 0,
    "steps": [...],
    "confidence": 0.75,
    "nextAction": "BUY",
    "timestamp": 1234567890
  },
  "signal": "BUY",
  "confidence": 0.75
}
```

### Backtest Endpoint

**POST /api/backtest**
```bash
curl -X POST http://localhost:3000/api/backtest \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "asset": "XAU/USD",
      "timeframe": "1h",
      "initialBalance": 10000,
      "leverage": 1
    }
  }'
```

## State Management (Zustand)

**Main Store:**
```typescript
const store = useTradingStore();

// Paper Trading
store.startPaperTrade(initialBalance, leverage);
store.addPosition(position);
store.closePosition(positionId, exitPrice);
store.updateBalance(amount);

// Strategies
store.loadStrategies(strategies);
store.updateStrategyMetrics(strategyId, metrics);

// UI State
store.setSelectedAsset(asset);
store.setShowPredictionCard(true);
```

## Performance Optimization

**Best Practices:**
1. Memoize chart components with `React.memo()`
2. Use `useCallback` for event handlers
3. Implement virtual scrolling for large lists
4. Cache indicator calculations
5. Use Web Workers for strategy evaluation
6. Implement data debouncing for real-time updates

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Deployment

### Vercel (Recommended)

```bash
# Connect to Vercel
vercel

# Deploy
vercel --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Issue: Chart not rendering
- Ensure candle data has > 20 points
- Check browser console for errors
- Verify recharts installation

### Issue: Voice recognition not working
- Check browser permissions
- Ensure HTTPS (required for Web Speech API)
- Try Chrome or Edge browser

### Issue: Paper trading positions not updating
- Verify WebSocket connection
- Check store subscription
- Clear browser cache

## Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests:
- GitHub Issues: https://github.com/guitar341/uni-forex-bot/issues
- Email: support@example.com
