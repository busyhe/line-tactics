
# Line Tactics

[English](README.md) | [简体中文](README_zh.md)

A minimalist multiplayer strategy board game built with React, Vite, and Cloudflare Workers. Direct your pieces, claim the line, and outsmart your opponent in this fast-paced tactical game.

## ✨ Features

- 🎮 **Dual Game Modes**: Play locally with a friend or jump into an online room for multiplayer action.
- 🌐 **Real-time Multiplayer**: Powered by Cloudflare Workers and Durable Objects for low-latency gameplay.
- 🌍 **Internationalization**: Full support for English and Chinese languages.
- 🎨 **Minimalist Design**: Clean, modern UI with smooth animations powered by Framer Motion.
- 🔥 **Reactive UI**: Built on React 19 for a responsive and performant experience.

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Backend/Networking**: [Cloudflare Workers](https://workers.cloudflare.com/), [Durable Objects](https://developers.cloudflare.com/workers/learning/using-durable-objects/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/) (v8 or later)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/line-tactics.git
   cd line-tactics
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:

   ```env
   VITE_WS_URL=wss://your-worker-subdomain.workers.dev/websocket
   ```

### Development

Run the development server:

```bash
pnpm dev
```

### Deployment

Deploy the Cloudflare Worker:

```bash
pnpm deploy
```

## 📜 How to Play

1. **Objective**: Capture your opponent's pieces until they have fewer than 2 left.
2. **Setup**: Each player starts with 4 pieces on a 4x4 grid.
3. **Movement**: Pieces move to adjacent empty squares (horizontally, vertically, or diagonally).
4. **Capturing**: Capture an opponent's piece by "sandwiching" it between two of your own pieces in a straight line.
5. **Win**: You win when your opponent is reduced to 1 or 0 pieces.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.
