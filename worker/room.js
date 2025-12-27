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
    const _url = new URL(request.url);

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
    this.sessions.set(server, { id: sessionId });
    this.updateOnlineCount(sessionId, 'join');

    server.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        // Add sender info and broadcast to all other clients
        msg.senderId = sessionId;
        this.broadcast(msg, server);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });

    server.addEventListener('close', () => {
      this.sessions.delete(server);
      this.updateOnlineCount(sessionId, 'leave');
      // Notify others about disconnect
      this.broadcast({ type: 'PLAYER_LEFT', senderId: sessionId }, server);
    });

    server.addEventListener('error', () => {
      this.sessions.delete(server);
      this.updateOnlineCount(sessionId, 'leave');
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  async updateOnlineCount(sessionId, action) {
    try {
      const registryId = this.env.ROOM_REGISTRY.idFromName('global');
      const registry = this.env.ROOM_REGISTRY.get(registryId);
      const response = await registry.fetch(new Request('http://internal/update-count', {
        method: 'POST',
        body: JSON.stringify({ sessionId, action })
      }));
      const { totalOnlineCount } = await response.json();

      // Broadcast the new count to all clients in this room
      this.broadcast({ type: 'ONLINE_COUNT', payload: totalOnlineCount });
    } catch (e) {
      console.error('Failed to update online count:', e);
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
