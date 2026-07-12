# Uni Forex Bot 🤖💱

An advanced multi-asset algorithmic trading bot with 10,000 concurrent strategies, paper trading simulation, real-time predictions, and voice interactions.

## Features

✨ **Core Features**
- 🎯 10,000 simultaneous trading strategies
- 📊 Real-time XAU/USD, BTC/USD, US30, GER30 charts
- 💼 Paper trading with full margin simulation
- 🔮 AI-powered price predictions
- 🎤 Voice command interface ("Uni" bot)
- 📈 Backtesting engine with historical data
- 📉 Advanced indicators: FVG, Accumulation/Distribution, Volume
- 🎨 Interactive dashboard with performance metrics
- 🚨 Real-time alerts and notifications

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/guitar341/uni-forex-bot.git
cd uni-forex-bot
npm install
```

### Configuration

```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

## Project Structure

```
uni-forex-bot/
├── src/
│   ├── components/          # React components
│   ├── lib/                 # Utility functions
│   ├── strategies/          # 10,000 trading strategies
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Next.js pages
│   ├── store/               # Zustand state management
│   ├── types/               # TypeScript types
│   ├── api/                 # API routes
│   ├── backtest/            # Backtesting engine
│   └── voice/               # Voice interaction
├── public/                  # Static assets
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Trading Features

### Paper Trading
- Simulated trading against live prices
- Margin and leverage controls
- Real-time P&L tracking
- Position management (BUY/SELL/HOLD/WAIT/CLOSE)

### Prediction System
- Real-time forecast steps
- Target price calculations
- Expected range projections
- Probability metrics

### Strategy Ensemble
- 10,000 independent strategies
- Weighted voting mechanism
- Performance-based strategy ranking
- Individual strategy P&L tracking

### Backtesting
- Historical data replay
- Configurable slippage and fees
- Multi-timeframe analysis
- Strategy performance validation

## Voice Commands

- "Uni, what's the XAU/USD outlook?"
- "Execute paper trade"
- "Close position"
- "Show dashboard"
- "Run backtest"
- "What's my P&L?"

## API Integration

- **Live Data**: Real-time forex/crypto feeds
- **Charts**: Dynamic chart rendering with overlays
- **Indicators**: FVG, Accumulation, Distribution, Volume
- **Alerts**: WebSocket-based notifications

## Architecture

### Frontend (React + Next.js)
- Real-time chart rendering
- Interactive dashboard
- Paper trading interface
- Voice input/output UI

### Backend (Next.js API Routes)
- Strategy execution
- Data aggregation
- Backtesting engine
- WebSocket connections

### Data Layer
- Multi-source data feeds
- Caching and aggregation
- Real-time quote streaming

## Performance Optimization

- Strategy execution in Web Workers
- Chart rendering optimization
- Data caching and deduplication
- Efficient state management with Zustand

## Roadmap

- [ ] Machine learning strategy generation
- [ ] Advanced risk management
- [ ] Social trading features
- [ ] Mobile app
- [ ] Real money trading (with security)

## License

MIT

## Support

For issues and feature requests, please create an issue on GitHub.
