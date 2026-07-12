# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### Market Data

#### Get Candles

```http
GET /data/candles?asset=XAU/USD&timeframe=1h&limit=500
```

**Query Parameters:**
- `asset` (string): Asset symbol (XAU/USD, BTC/USD, US30, GER30)
- `timeframe` (string): 1m, 5m, 15m, 1h, 4h, 1d
- `limit` (number): Number of candles (default: 500, max: 5000)

**Response:**
```json
{
  "candles": [
    {
      "timestamp": 1626120000000,
      "open": 1999.5,
      "high": 2001.2,
      "low": 1998.8,
      "close": 2000.1,
      "volume": 1234567
    }
  ],
  "asset": "XAU/USD",
  "timeframe": "1h",
  "count": 500
}
```

#### Get Quote

```http
GET /data/quote?asset=XAU/USD
```

**Query Parameters:**
- `asset` (string): Asset symbol

**Response:**
```json
{
  "quote": {
    "asset": "XAU/USD",
    "bid": 1999.95,
    "ask": 2000.05,
    "last": 2000.01,
    "timestamp": 1626120000000,
    "change": 0.5,
    "changePercent": 0.025
  }
}
```

#### Get Multiple Quotes

```http
POST /data/quotes
Content-Type: application/json

{
  "assets": ["XAU/USD", "BTC/USD", "US30"]
}
```

**Response:**
```json
{
  "quotes": {
    "XAU/USD": { /* quote object */ },
    "BTC/USD": { /* quote object */ },
    "US30": { /* quote object */ }
  }
}
```

### Predictions

#### Generate Prediction

```http
GET /prediction?asset=XAU/USD
```

**Query Parameters:**
- `asset` (string): Asset symbol

**Response:**
```json
{
  "prediction": {
    "asset": "XAU/USD",
    "currentStep": 0,
    "steps": [
      {
        "step": 1,
        "action": "BUY",
        "targetPrice": 2010.5,
        "expectedRange": {
          "min": 1980.0,
          "max": 2020.0
        },
        "probability": 0.75,
        "timeToTarget": 15,
        "reason": "Ensemble voted BUY with 75% confidence...",
        "timestamp": 1626120000000
      }
    ],
    "confidence": 0.75,
    "nextAction": "BUY",
    "timestamp": 1626120000000,
    "updateFrequency": 60
  },
  "signal": "BUY",
  "confidence": 0.75,
  "asset": "XAU/USD",
  "timestamp": 1626120000000
}
```

### Backtesting

#### Run Backtest

```http
POST /backtest
Content-Type: application/json

{
  "config": {
    "asset": "XAU/USD",
    "timeframe": "1h",
    "startDate": 1609459200000,
    "endDate": 1640995200000,
    "barLimit": 500,
    "slippage": 0.0002,
    "commission": 0.0001,
    "initialBalance": 10000,
    "leverage": 1
  }
}
```

**Response:**
```json
{
  "asset": "XAU/USD",
  "totalTrades": 150,
  "winTrades": 95,
  "lossTrades": 55,
  "winRate": 0.633,
  "totalPnL": 5420.5,
  "maxDrawdown": 0.15,
  "profitFactor": 2.3,
  "sharpeRatio": 1.87,
  "strategyPerformance": [
    {
      "id": "strategy_0",
      "name": "Strategy 0",
      "winRate": 0.65,
      "totalTrades": 20,
      "profitFactor": 2.1,
      "avgWin": 150.5,
      "avgLoss": 75.2,
      "maxDrawdown": 0.12,
      "totalPnL": 1250.5,
      "status": "ACTIVE",
      "confidence": 0.85,
      "weight": 0.0001
    }
  ],
  "trades": [ /* array of Position objects */ ],
  "equityHistory": [
    {
      "timestamp": 1609459200000,
      "equity": 10000
    },
    {
      "timestamp": 1640995200000,
      "equity": 15420.5
    }
  ]
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid request parameters"
}
```

### 404 Not Found

```json
{
  "error": "Asset or data not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## WebSocket Events

### Subscribe to Live Updates

```javascript
const socket = io('http://localhost:3000');
socket.emit('subscribe', 'XAU/USD:candles');
```

### Events

**Candle Update:**
```javascript
socket.on('candle', (data) => {
  console.log(data.asset, data.candle);
});
```

**Quote Update:**
```javascript
socket.on('quote', (quote) => {
  console.log(quote);
});
```

**Prediction Update:**
```javascript
socket.on('prediction', (data) => {
  console.log(data.prediction);
});
```

**Alert:**
```javascript
socket.on('alert', (alert) => {
  console.log(alert.message, alert.type);
});
```

## Rate Limiting

- API Calls: 100 requests per minute
- WebSocket: Real-time (no limit)
- Backtest: 10 requests per hour

## Authentication

Currently no authentication required for development.

For production, implement:
- API key validation
- JWT tokens
- Rate limiting per user

## Examples

### Python

```python
import requests

# Get candles
response = requests.get(
    'http://localhost:3000/api/data/candles',
    params={'asset': 'XAU/USD', 'timeframe': '1h'}
)
candles = response.json()['candles']

# Get prediction
response = requests.get(
    'http://localhost:3000/api/prediction',
    params={'asset': 'XAU/USD'}
)
prediction = response.json()['prediction']
```

### JavaScript/TypeScript

```typescript
// Get candles
const response = await fetch(
  '/api/data/candles?asset=XAU/USD&timeframe=1h'
);
const { candles } = await response.json();

// Run backtest
const backtest = await fetch('/api/backtest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      asset: 'XAU/USD',
      initialBalance: 10000,
      leverage: 1
    }
  })
});
const results = await backtest.json();
```

### cURL

```bash
# Get prediction
curl -X GET 'http://localhost:3000/api/prediction?asset=XAU/USD'

# Run backtest
curl -X POST http://localhost:3000/api/backtest \
  -H 'Content-Type: application/json' \
  -d '{
    "config": {
      "asset": "XAU/USD",
      "initialBalance": 10000
    }
  }'
```

## Versioning

Current API Version: v1

Future versions will be available at `/api/v2/`, etc.
