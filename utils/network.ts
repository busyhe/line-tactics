import { NetworkMessage } from '../types';

type MessageCallback = (msg: NetworkMessage) => void;

/**
 * NetworkService
 *
 * Handles communication between players.
 *
 * MODE:
 * 1. 'BroadcastChannel' (Default): Works across tabs on the same device. Serverless. Great for demos.
 * 2. 'WebSocket': Connects to a Cloudflare Worker (or any WS server).
 *
 * To enable Cloudflare Worker support, set VITE_WS_URL environment variable.
 * Example: VITE_WS_URL=wss://your-worker.workers.dev/websocket
 */
export class NetworkService {
  private channel: BroadcastChannel | null = null;
  private socket: WebSocket | null = null;
  private onMessage: MessageCallback | null = null;
  private roomId: string = '';

  // Read WebSocket URL from environment variable
  private wsUrl = import.meta.env.VITE_WS_URL || '';

  // Auto-detect URL from browser location if not configured
  constructor(onMessage: MessageCallback) {
    this.onMessage = onMessage;

    if (!this.wsUrl && typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.wsUrl = `${protocol}//${window.location.host}/websocket`;
    }
  }

  private useWebSocket = true; // Always try WebSocket first if auto-detected

  connect(roomId: string) {
    this.roomId = roomId;

    if (this.useWebSocket) {
      this.connectWebSocket(roomId);
    } else {
      this.connectBroadcastChannel(roomId);
    }
  }

  private connectBroadcastChannel(roomId: string) {
    console.log(`[Network] Connecting via BroadcastChannel to room: ${roomId}`);
    this.channel = new BroadcastChannel(`line-tactics-${roomId}`);
    this.channel.onmessage = (event) => {
      if (this.onMessage) {
        this.onMessage(event.data as NetworkMessage);
      }
    };
    // Announce join
    this.send({ type: 'JOIN' });
  }

  private connectWebSocket(roomId: string) {
    console.log(`[Network] Connecting via WebSocket to room: ${roomId}`);
    // Append Room ID to URL query or path
    this.socket = new WebSocket(`${this.wsUrl}?room=${roomId}`);

    this.socket.onopen = () => {
      console.log('[Network] WS Connected');
      this.send({ type: 'JOIN' });
    };

    this.socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (this.onMessage) this.onMessage(msg);
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    this.socket.onclose = () => {
      console.log('[Network] WS Disconnected');
    };
  }

  send(msg: NetworkMessage) {
    if (
      this.useWebSocket &&
      this.socket &&
      this.socket.readyState === WebSocket.OPEN
    ) {
      this.socket.send(JSON.stringify(msg));
    } else if (this.channel) {
      this.channel.postMessage(msg);
    }
  }

  disconnect() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
