<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Line Tactics (线段博弈)

[English](README.md) | [简体中文](README_zh.md)

一个基于 React、Vite 和 Cloudflare Workers 构建的极简多人对弈战棋游戏。在这个快节奏的战术游戏中，指挥你的棋子，占据连线，智取对手。

## ✨ 特性

- 🎮 **双重游戏模式**：既可本地与好友对战，也可进入在线房间进行多人游戏。
- 🌐 **实时多人对战**：由 Cloudflare Workers 和 Durable Objects 提供支持，确保低延迟游戏体验。
- 🌍 **国际化支持**：完整支持中英文语言切换。
- 🎨 **极简设计**：简洁现代的 UI，辅以 Framer Motion 驱动的平滑动画。
- 🔥 **响应式 UI**：基于 React 19 构建，提供流畅的交互性能。

## 🛠️ 技术栈

- **前端**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **动画**: [Framer Motion](https://www.framer.com/motion/)
- **后端/网络**: [Cloudflare Workers](https://workers.cloudflare.com/), [Durable Objects](https://developers.cloudflare.com/workers/learning/using-durable-objects/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)

## 🚀 快速开始

### 前置条件

- [Node.js](https://nodejs.org/) (v18 或更高版本)
- [pnpm](https://pnpm.io/) (v8 或更高版本)

### 安装步骤

1. 克隆仓库：

   ```bash
   git clone https://github.com/your-username/line-tactics.git
   cd line-tactics
   ```

2. 安装依赖：

   ```bash
   pnpm install
   ```

3. 配置环境变量：
   在根目录下创建 `.env.local` 文件：

   ```env
   VITE_WS_URL=wss://your-worker-subdomain.workers.dev/websocket
   ```

### 开发模式

启动开发服务器：

```bash
pnpm dev
```

### 部署上线

部署 Cloudflare Worker：

```bash
pnpm deploy
```

## 📜 游戏玩法

1. **目标**：捕获对手的棋子，直到对方剩余棋子少于 2 个。
2. **初始化**：每位玩家在 4x4 的棋盘上各拥有 4 枚棋子。
3. **移动**：棋子可以移动到相邻的空位（水平、垂直或对角线方向）。
4. **捕获**：通过将对手的棋子“夹”在自己的两枚棋子之间（连成直线）来进行捕获。
5. **胜利**：当对手的棋子减少到 1 枚或 0 枚时，你将获得胜利。

## 📄 开源协议

本项目采用 MIT 协议 - 详情请参阅 [LICENSE](LICENSE) 文件。
