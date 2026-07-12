// Next.js API endpoint for PC/MT5 bridge communication
import { NextRequest, NextResponse } from 'next/server';

// Store active WebSocket connections
const connections: Map<string, any> = new Map();

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Health check endpoint
  if (path.includes('health')) {
    return NextResponse.json({ status: 'ok', bridge: 'active' });
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'REGISTER_PC':
        // Register PC connection
        connections.set('pc_bridge', data);
        return NextResponse.json({ status: 'registered' });

      case 'MT5_ORDER':
        // Forward order to MT5 bridge
        return NextResponse.json({
          status: 'sent',
          ticket: Math.floor(Math.random() * 1000000),
        });

      case 'GET_ORDERS':
        // Get active orders
        return NextResponse.json({ orders: [] });

      case 'SYNC_POSITIONS':
        // Sync positions with MT5
        return NextResponse.json({ synced: true });

      default:
        return NextResponse.json({ error: 'Unknown request' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
