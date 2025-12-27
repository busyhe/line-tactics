/**
 * GameRoom Durable Object
 * 
 * Manages WebSocket connections for a single game room.
 * Handles player join/leave and message broadcasting.
 */
export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map(); // WebSocket -> { id }
  }

  async fetch(request) {
    const url = new URL(request.url);

    // Store roomId from query params for later use in informRegistryOfLeave
    const roomId = url.searchParams.get('room');
    if (roomId) {
      this.roomId = roomId;
    }

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    return new Response('Expected WebSocket', { status: 400 });
  }

  handleWebSocket(_request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Generate unique session ID
    const sessionId = crypto.randomUUID();

    server.accept();
    this.sessions.set(server, { id: sessionId, lastSeen: Date.now() });

    server.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Handle Heartbeat
        if (msg.type === 'PING') {
          const session = this.sessions.get(server);
          if (session) {
            session.lastSeen = Date.now();
            if (msg.sender) session.color = msg.sender;
            server.send(JSON.stringify({ type: 'PONG' }));
            if (session.color) {
              this.broadcast({ type: 'PRESENCE', sender: session.color }, server);
            }
          }
          return;
        }

        // Add sender info and broadcast to all other clients
        msg.senderId = sessionId;
        if (msg.sender) {
          const session = this.sessions.get(server);
          if (session) session.color = msg.sender;
        }
        this.broadcast(msg, server);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });

    server.addEventListener('close', () => {
      const session = this.sessions.get(server);
      this.sessions.delete(server);

      if (session && session.color) {
        this.informRegistryOfLeave(session.color);
      }

      // Notify others about disconnect
      this.broadcast({ type: 'PLAYER_LEFT', senderId: sessionId }, server);
    });

    server.addEventListener('error', () => {
      const session = this.sessions.get(server);
      this.sessions.delete(server);
      if (session && session.color) {
        this.informRegistryOfLeave(session.color);
      }
    });

    // Stale connection cleanup timer (Check every 5 seconds)
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [ws, session] of this.sessions.entries()) {
        if (now - session.lastSeen > 10000) { // 10 seconds timeout
          ws.close(1001, "Stale connection");
          this.sessions.delete(ws);
          if (session.color) {
            this.informRegistryOfLeave(session.color);
          }
          this.broadcast({ type: 'PLAYER_LEFT', senderId: session.id });
        }
      }
      if (this.sessions.size === 0) {
        clearInterval(cleanupInterval);
      }
    }, 5000);

    return new Response(null, { status: 101, webSocket: client });
  }

  async informRegistryOfLeave(color) {
    const registryId = this.env.ROOM_REGISTRY.idFromName('global');
    const registry = this.env.ROOM_REGISTRY.get(registryId);
    try {
      await registry.fetch(new Request('http://internal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.roomId,
          color,
          action: 'leave'
        })
      }));
    } catch (e) {
      console.error('Failed to notify registry of player leave:', e);
    }
  }

  /**
   * Broadcast message to all connected clients except sender
   */
  broadcast(msg, sender = null) {
    const message = JSON.stringify(msg);
    for (const [ws] of this.sessions) {
      if (ws !== sender && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }
}
