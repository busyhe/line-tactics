/**
 * Line Tactics WebSocket Worker
 * 
 * Entry point for Cloudflare Worker.
 * Routes WebSocket connections to GameRoom Durable Objects based on room ID.
 */

export { GameRoom } from './room.js';
export { RoomRegistry } from './registry.js';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Lobby WebSocket endpoint: /lobby-ws
    if (url.pathname === '/lobby-ws') {
      const registryId = env.ROOM_REGISTRY.idFromName('global');
      const registry = env.ROOM_REGISTRY.get(registryId);
      return registry.fetch(request);
    }

    // Room list endpoint: GET /rooms
    if (url.pathname === '/rooms' && request.method === 'GET') {
      const registryId = env.ROOM_REGISTRY.idFromName('global');
      const registry = env.ROOM_REGISTRY.get(registryId);
      const response = await registry.fetch(new Request('http://internal/rooms'));
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Clear rooms endpoint: POST /rooms/clear
    if (url.pathname === '/rooms/clear' && request.method === 'POST') {
      const registryId = env.ROOM_REGISTRY.idFromName('global');
      const registry = env.ROOM_REGISTRY.get(registryId);
      const response = await registry.fetch(new Request('http://internal/rooms/clear', {
        method: 'POST'
      }));
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Register room endpoint: POST /register
    if (url.pathname === '/register' && request.method === 'POST') {
      const registryId = env.ROOM_REGISTRY.idFromName('global');
      const registry = env.ROOM_REGISTRY.get(registryId);
      const response = await registry.fetch(new Request('http://internal/register', {
        method: 'POST',
        body: request.body
      }));
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // WebSocket endpoint: /websocket?room=ROOM_ID
    if (url.pathname === '/websocket') {
      const roomId = url.searchParams.get('room');

      if (!roomId) {
        return new Response('Missing room parameter', {
          status: 400,
          headers: corsHeaders
        });
      }

      // Get or create the Durable Object for this room
      const roomObjectId = env.GAME_ROOMS.idFromName(roomId);
      const roomObject = env.GAME_ROOMS.get(roomObjectId);

      // Forward the request to the Durable Object
      return roomObject.fetch(request);
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Line Tactics WebSocket Server', {
      headers: corsHeaders
    });
  }
};
