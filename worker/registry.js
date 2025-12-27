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
    this.sessions = new Set();
  }

  async fetch(request) {
    const url = new URL(request.url);

    // Handle WebSocket upgrade for Lobby
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      server.accept();
      this.sessions.add(server);

      // Clean up and send initial data immediately
      const rooms = await this.cleanupRooms();
      const totalOnlineCount = this.sessions.size;
      const data = this.prepareRoomData(rooms, totalOnlineCount);
      server.send(JSON.stringify(data));

      // Broadcast update when someone joins
      this.broadcastUpdate(rooms, totalOnlineCount);

      server.addEventListener('close', async () => {
        this.sessions.delete(server);
        // Broadcast update when someone leaves
        const currentRooms = await this.state.storage.get('rooms') || {};
        this.broadcastUpdate(currentRooms, this.sessions.size);
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    // POST /rooms/clear - Manually clear all rooms
    if (request.method === 'POST' && url.pathname === '/rooms/clear') {
      await this.state.storage.put('rooms', {});
      this.broadcastUpdate({}, this.sessions.size);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /rooms - List all rooms that need players
    if (request.method === 'GET' && url.pathname === '/rooms') {
      const rooms = await this.cleanupRooms();
      const data = this.prepareRoomData(rooms, this.sessions.size);
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /register - Register or update a room
    if (request.method === 'POST' && url.pathname === '/register') {
      const { roomId, color, action } = await request.json();
      const rooms = await this.state.storage.get('rooms') || {};
      const totalOnlineCount = this.sessions.size;
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

        // Auto-assign color if requested color is taken
        let finalColor = color;
        if (color === 'red' && rooms[roomId].redPlayer) finalColor = 'blue';
        if (color === 'blue' && rooms[roomId].bluePlayer) finalColor = 'red';

        // Check if room is full
        if (rooms[roomId].redPlayer && rooms[roomId].bluePlayer) {
          return new Response(JSON.stringify({ success: false, error: 'ROOM_FULL' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        rooms[roomId].lastActivity = now;
        if (finalColor === 'red') rooms[roomId].redPlayer = true;
        if (finalColor === 'blue') rooms[roomId].bluePlayer = true;

        await this.state.storage.put('rooms', rooms);
        this.broadcastUpdate(rooms, totalOnlineCount);
        return new Response(JSON.stringify({ success: true, assignedColor: finalColor }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (action === 'leave') {
        if (rooms[roomId]) {
          if (color === 'red') rooms[roomId].redPlayer = false;
          if (color === 'blue') rooms[roomId].bluePlayer = false;

          // Remove room if empty (last player left)
          if (!rooms[roomId].redPlayer && !rooms[roomId].bluePlayer) {
            delete rooms[roomId];
          }
          await this.state.storage.put('rooms', rooms);
          this.broadcastUpdate(rooms, totalOnlineCount);
        }
      } else if (action === 'heartbeat') {
        // Update activity timestamp
        if (rooms[roomId]) {
          rooms[roomId].lastActivity = now;
          await this.state.storage.put('rooms', rooms);
        }
      }

      await this.state.storage.put('rooms', rooms);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /update-count - Return current global session count
    if (request.method === 'POST' && url.pathname === '/update-count') {
      const totalOnlineCount = this.sessions.size;
      return new Response(JSON.stringify({ totalOnlineCount }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }

  prepareRoomData(rooms, totalOnlineCount) {
    const allRooms = Object.entries(rooms)
      .map(([roomId, info]) => ({
        roomId,
        hasRed: info.redPlayer,
        hasBlue: info.bluePlayer,
        createdAt: info.createdAt,
        isFull: info.redPlayer && info.bluePlayer,
        isAvailable: !info.redPlayer || !info.bluePlayer
      }));

    // Sort: 
    // 1. Available rooms first (one slot open)
    // 2. Both slots taken (full)
    // 3. Within groups, by createdAt descending (newest first)
    allRooms.sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return b.createdAt - a.createdAt;
    });

    return { rooms: allRooms, totalOnlineCount };
  }

  broadcastUpdate(rooms, totalOnlineCount) {
    const data = JSON.stringify(this.prepareRoomData(rooms, totalOnlineCount));
    for (const ws of this.sessions) {
      try {
        ws.send(data);
      } catch (e) {
        console.error('Failed to send broadcast:', e);
        this.sessions.delete(ws);
      }
    }
  }

  async cleanupRooms() {
    const rooms = await this.state.storage.get('rooms') || {};
    const totalOnlineCount = this.sessions.size;
    const now = Date.now();
    let hasExpired = false;

    for (const [roomId, info] of Object.entries(rooms)) {
      if (now - info.lastActivity > ROOM_TIMEOUT_MS) {
        delete rooms[roomId];
        hasExpired = true;
      }
    }

    if (hasExpired) {
      await this.state.storage.put('rooms', rooms);
      this.broadcastUpdate(rooms, totalOnlineCount);
    }
    return rooms;
  }
}
