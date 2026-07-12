# MetaTrader 5 Integration & Live Trading Setup

## Overview

Uni Forex Bot now supports live trading on MetaTrader 5. The bot can automatically execute trades directly to your MT5 account.

## Prerequisites

1. **MetaTrader 5 Installation**
   - Download from: https://www.metatrader5.com/
   - Install and create/import an account

2. **MT5 Bridge Service** (PC Application)
   - Download the MT5 Bridge from: [bridge-release-link]
   - Unzip and run: `mt5-bridge.exe` (Windows) or `./mt5-bridge` (Mac/Linux)
   - Default port: 8080

3. **Enable Expert Advisors**
   - In MT5: Tools → Options → Expert Advisors
   - Check "Allow live trading" ✓
   - Check "Allow WebSocket connections" ✓

## Installation Steps

### Step 1: Setup MT5 Bridge on PC

```bash
# Download and extract (Windows)
Extract mt5-bridge.zip
cd mt5-bridge
.\mt5-bridge.exe

# Or on Mac/Linux
tar -xzf mt5-bridge.tar.gz
cd mt5-bridge
./mt5-bridge
```

You should see:
```
✅ MT5 Bridge started on port 8080
✅ Listening for connections from Uni Forex Bot
✅ Waiting for MetaTrader 5...
```

### Step 2: Configure Bot Connection

1. Open Uni Forex Bot in browser (http://localhost:3000)
2. Navigate to **"AutoTrader"** tab
3. Click the **"Connection"** button
4. Enter your MT5 credentials:
   - **Account Number**: Your MT5 account number
   - **Account Password**: Your MT5 investor password
   - **Server**: MetaQuotes-Demo or your broker's server
   - **API Key**: (Leave blank if not required by your broker)
5. Click **"Connect to MT5"**

### Step 3: Start Live Trading

1. Click **"START TRADING"** in AutoTrader panel
2. Bot will begin executing trades on MT5 automatically
3. Monitor positions in real-time

## Connection Architecture

```
┌─────────────────────┐
│  Your PC / Laptop   │
├─────────────────────┤
│ MetaTrader 5 (Live) │
│ + MT5 Bridge (8080) │
└──────────┬──────────┘
           │
           │ WebSocket
           │ ws://localhost:8080
           ↓
┌─────────────────────┐
│  Uni Forex Bot      │
│  (Web/Browser)      │
├─────────────────────┤
│ AutoTrader Engine   │
│ Strategy Ensemble   │
│ Order Execution     │
└─────────────────────┘
```

## Real-Time Synchronization

The bot automatically syncs with MT5 every 5 seconds:

- **Bot → MT5**: Executes new trades
- **MT5 → Bot**: Updates P&L and order status
- **Conflict Resolution**: If both systems try to close a position, MT5 takes precedence

## Trade Execution Flow

```typescript
// 1. Bot generates signal with 10,000 strategies
const { signal, confidence } = ensembleManager.generateConsensusSignal();

// 2. If signal meets criteria
if (signal === 'BUY' && confidence > 0.55) {
  
  // 3. Execute on MT5
  const ticket = await mt5Connector.executeOrder(
    'XAU/USD',
    'BUY',
    quantity,
    entryPrice,
    takeProfit,
    stopLoss
  );
  
  // 4. Track position
  positions.push({
    id: ticket,
    asset: 'XAU/USD',
    orderType: 'BUY',
    status: 'OPEN'
  });
}
```

## Configuration Options

### AutoTrader Settings

```typescript
interface TradeConfig {
  autoTrade: true;              // Enable auto trading
  maxOpenPositions: 5;           // Max concurrent trades
  positionSize: 0.1;            // 10% of balance per trade
  takeProfit: 0.02;             // 2% profit target
  stopLoss: 0.01;               // 1% stop loss
  minConfidence: 0.55;          // Minimum 55% ensemble confidence
  checkInterval: 5000;          // Check every 5 seconds
}
```

### MT5 Connection

```typescript
interface MT5Config {
  accountNumber: string;        // Your MT5 account
  accountPassword: string;      // Investor password (read-only)
  accountServer: string;        // Broker server
  apiKey: string;               // API key (if required)
  platform: 'MetaTrader5';
}
```

## Safety Features

✅ **Position Limits**: Maximum 5 concurrent positions
✅ **Risk Management**: Auto stop-loss on all trades
✅ **Confidence Threshold**: Only trades with 55%+ confidence
✅ **Account Balance Check**: Verifies funds before trading
✅ **Real-time P&L Monitoring**: Closes positions at profit/loss targets
✅ **Sync Verification**: Validates trades were executed on MT5
✅ **Emergency Stop**: One-click stop all trading

## Monitoring Your Trades

### In Uni Bot Interface

- **AutoTrader Tab**: Live trading status and positions
- **Dashboard**: Performance metrics and statistics
- **Balance Display**: Real-time account balance from MT5
- **P&L Tracker**: Individual position profitability

### In MetaTrader 5

- **Terminal → Trade**: See all executed orders
- **Terminal → History**: View closed trades
- **Account Info**: Balance updates in real-time

## Troubleshooting

### ❌ "Could not connect to PC bridge"

**Solution:**
1. Ensure MT5 Bridge is running: `mt5-bridge.exe`
2. Check port 8080 is not blocked by firewall
3. Verify bridge logs show: "Listening on port 8080"

### ❌ "MetaTrader 5 connection failed"

**Solution:**
1. Verify MT5 is running and not in demo mode
2. Check credentials are correct
3. Enable Expert Advisors in MT5 settings
4. Restart MT5 and try again

### ❌ "Orders not executing on MT5"

**Solution:**
1. Check account has sufficient balance
2. Verify spread is acceptable (not too wide)
3. Check market is open for the asset
4. Review MT5 journal for error messages

### ❌ "P&L not updating"

**Solution:**
1. Verify sync is active (see status indicator)
2. Check WebSocket connection is stable
3. Restart the bot connection
4. Check MT5 for order updates

## Advanced: Custom Server Configuration

```typescript
// For custom brokers or servers
const config = {
  accountNumber: '12345678',
  accountPassword: 'your-password',
  accountServer: 'your-broker-server.com:443',
  apiKey: 'your-api-key-if-needed',
  platform: 'MetaTrader5'
};

await mt5Connector.connect(config);
```

## Performance Metrics

- **Order Execution**: < 500ms
- **Position Sync**: < 100ms
- **P&L Update**: Real-time every tick
- **Reconnection**: Automatic with exponential backoff

## Important Notes

⚠️ **Paper Trading vs Live**
- Bot uses **Paper Trading** by default (no real trades)
- To enable **Live Trading**, connect to MT5
- Once connected, ALL trades go LIVE to your MT5 account

⚠️ **Account Security**
- Use **Investor Password** (read-only), not Master Password
- Change password after testing
- Never share credentials
- Keep Bridge service updated

⚠️ **Risk Disclaimer**
- Past performance ≠ future results
- Trading involves significant risk
- Start with small position sizes
- Only trade during liquid market hours
- Monitor trades actively initially

## Support & Updates

- Check for Bridge updates: https://github.com/guitar341/mt5-bridge/releases
- Report issues: https://github.com/guitar341/uni-forex-bot/issues
- Documentation: https://docs.example.com

---

**Ready to trade? Click "Connect to MT5" and watch your bot trade live!** 🚀
