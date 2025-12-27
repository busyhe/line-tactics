/**
 * RoomRegistry Durable Object
 * 
 * Manages global list of active rooms with player info.
 * Stores: { roomId: { redPlayer: bool, bluePlayer: bool, createdAt: timestamp, lastActivity: timestamp } }
 * 
 * Auto-cleanup:
 * - Rooms with no players are deleted immediately
 * - Rooms inactive for 10 minutes are cleaned up
 */

const ROOM_TIMEOUT_MS = 1 * 60 * 1000; // 1 minutes

export class RoomRegistry {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    // GET /rooms - List all rooms that need players
    if (request.method === 'GET' && url.pathname === '/rooms') {
      const rooms = await this.state.storage.get('rooms') || {};
      const totalOnlineCount = await this.state.storage.get('totalOnlineCount') || 0;
      const now = Date.now();

      // Clean up expired rooms first
      let hasExpired = false;
      for (const [roomId, info] of Object.entries(rooms)) {
        if (now - info.lastActivity > ROOM_TIMEOUT_MS) {
          delete rooms[roomId];
          hasExpired = true;
        }
      }
      if (hasExpired) {
        await this.state.storage.put('rooms', rooms);
      }

      // Filter rooms that are waiting for players (not full)
      const availableRooms = Object.entries(rooms)
        .filter(([_, info]) => !info.redPlayer || !info.bluePlayer)
        .map(([roomId, info]) => ({
          roomId,
          hasRed: info.redPlayer,
          hasBlue: info.bluePlayer,
          createdAt: info.createdAt
        }));

      return new Response(JSON.stringify({ rooms: availableRooms, totalOnlineCount }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /register - Register or update a room
    if (request.method === 'POST' && url.pathname === '/register') {
      const { roomId, color, action } = await request.json();
      const rooms = await this.state.storage.get('rooms') || {};
      const now = Date.now();

      if (action === 'join') {
        if (!rooms[roomId]) {
          rooms[roomId] = {
            redPlayer: false,
            bluePlayer: false,
            createdAt: now,
            lastActivity: now
          };
        }
        rooms[roomId].lastActivity = now;
        if (color === 'red') rooms[roomId].redPlayer = true;
        if (color === 'blue') rooms[roomId].bluePlayer = true;
      } else if (action === 'leave') {
        if (rooms[roomId]) {
          if (color === 'red') rooms[roomId].redPlayer = false;
          if (color === 'blue') rooms[roomId].bluePlayer = false;

          // Remove room if empty (last player left)
          if (!rooms[roomId].redPlayer && !rooms[roomId].bluePlayer) {
            delete rooms[roomId];
          }
        }
      } else if (action === 'heartbeat') {
        // Update activity timestamp
        if (rooms[roomId]) {
          rooms[roomId].lastActivity = now;
        }
      }

      await this.state.storage.put('rooms', rooms);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /update-count - Update global session count from a room
    if (request.method === 'POST' && url.pathname === '/update-count') {
      const { sessionId, action } = await request.json();
      let sessions = await this.state.storage.get('globalSessions') || {};

      const now = Date.now();
      if (action === 'join') {
        sessions[sessionId] = now;
      } else if (action === 'leave') {
        delete sessions[sessionId];
      }

      // Cleanup old sessions (older than 2 minutes)
      for (const [sid, lastSeen] of Object.entries(sessions)) {
        if (now - lastSeen > 120000) {
          delete sessions[sid];
          changed = true;
        }
      }

      const totalOnlineCount = Object.keys(sessions).length;
      await this.state.storage.put('globalSessions', sessions);
      await this.state.storage.put('totalOnlineCount', totalOnlineCount);

      return new Response(JSON.stringify({ totalOnlineCount }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
}
