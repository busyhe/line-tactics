import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'zh' | 'en';

const translations = {
  zh: {
    title: '线阵策略',
    subtitle: '四子围猎',
    newGame: '新游戏',
    selectMode: '选择游戏模式开始',
    localMultiplayer: '本地对战',
    playOnDevice: '在当前设备上双人对战',
    onlineMultiplayer: '联网对战',
    syncDevices: '跨设备/标签页同步对战',
    roomId: '房间 ID',
    enterRoomName: '输入房间名称',
    selectColor: '选择你的棋子颜色',
    playAs: '你将作为 {color} 方',
    red: '红方',
    blue: '蓝方',
    joinAs: '加入为 {color}',
    selectRoomColor: '请选择房间和颜色',
    availableRooms: '当前可用房间',
    joined: '已加入',
    open: '待加入',
    cancel: '取消',
    exitToMenu: '退出到主菜单',
    howToPlay: '玩法说明',
    turnIndicator: '{color} 方回合',
    winnerTitle: '获胜者',
    blueWins: '蓝方获胜！',
    redWins: '红方获胜！',
    redEliminated: '红方全军覆没。',
    blueEliminated: '蓝方全军覆没。',
    resetGame: '重置游戏',
    rules: '规则',
    thinking: '对手正在思考...',
    logLocalStarted: '本地游戏开始。红方先行。',
    logJoinedRoom: '已加入房间: {room}，身份: {role}',
    logResetByPlayer: '游戏已被玩家重置。',
    logCaptured: '{color}方 捕获了 {count} 个棋子！',
    logOpponentReset: '对手重置了游戏。',
    logPlayerJoined: '玩家已加入房间。游戏开始！',
    objectiveTitle: '目标',
    objectiveDesc:
      '消灭对手的棋子。当对手只剩 <strong>1 个棋子</strong> 时，你就赢了。',
    movementTitle: '移动',
    movementDesc1: '玩家轮流移动 <strong>一个棋子</strong>。',
    movementDesc2:
      '棋子可以水平或垂直移动 <strong>一个格</strong> 到相邻的空位。',
    captureTitle: '捕获 (二打一)',
    captureDesc:
      '如果你移动棋子后形成了 <strong>三个</strong> 棋子的连线，且模式为以下之一，则敌方棋子被移除：',
    captureNote: '注意：必须是你主动移动形成的模式才会触发捕获。',
    specialRulesTitle: '特殊规则',
    safeApproach:
      '<strong>安全接近：</strong> 如果两个敌方棋子已经相邻，你移动到它们旁边（形成 [敌]-[敌]-[你]），你的棋子 <strong>不会</strong> 被捕获。只有攻击方主动形成一对时才会发生捕获。',
    fullLineImmunity:
      '<strong>满线免疫：</strong> 如果一行或一列已满（4 个棋子），该线上 <strong>不会</strong> 发生捕获，即使存在捕获模式。',
    gotIt: '明白了，开始对战！',
    loadingRooms: '正在加载房间...',
    online: '人在线',
    vsBot: '机器人对战',
    playWithAI: '挑战不同难度的 AI',
    selectDifficulty: '选择难度等级',
    easy: '简单',
    medium: '中等',
    hard: '困难（挑战）',
    botThinking: '机器人正在思考...',
    botWins: '机器人获胜！',
    playerWins: '恭喜！你击败了机器人。',
  },
  en: {
    title: 'Line Tactics',
    subtitle: 'The Four Pieces Strategy',
    newGame: 'New Game',
    selectMode: 'Select a game mode to begin',
    localMultiplayer: 'Local Multiplayer',
    playOnDevice: 'Play on this device',
    onlineMultiplayer: 'Online Multiplayer',
    syncDevices: 'Sync across devices/tabs',
    roomId: 'Room ID',
    enterRoomName: 'ENTER ROOM NAME',
    selectColor: 'Select Your Color',
    playAs: 'You will play as {color}',
    red: 'RED',
    blue: 'BLUE',
    joinAs: 'Join as {color}',
    selectRoomColor: 'Select Room & Color',
    availableRooms: 'Available Rooms',
    joined: 'Joined',
    open: 'Open',
    cancel: 'Cancel',
    exitToMenu: 'Exit to Menu',
    howToPlay: 'How to Play',
    turnIndicator: "{color}'s Turn",
    winnerTitle: 'Winner',
    blueWins: 'Blue wins!',
    redWins: 'Red wins!',
    redEliminated: 'Red eliminated.',
    blueEliminated: 'Blue eliminated.',
    resetGame: 'Reset Game',
    rules: 'Rules',
    thinking: 'Opponent is thinking...',
    logLocalStarted: "Local game started. Red's turn.",
    logJoinedRoom: 'Joined Room: {room} as {role}',
    logResetByPlayer: 'Game reset by player.',
    logCaptured: '{color} captured {count}!',
    logOpponentReset: 'Opponent reset the game.',
    logPlayerJoined: 'A player joined the room. Game starting!',
    objectiveTitle: 'Objective',
    objectiveDesc:
      'Eliminate opponent pieces. You win when the opponent has only <strong>1 piece left</strong>.',
    movementTitle: 'Movement',
    movementDesc1: 'Players take turns moving <strong>one piece</strong>.',
    movementDesc2:
      'A piece can move <strong>one step</strong> horizontally or vertically to an adjacent empty spot.',
    captureTitle: 'Capturing (The "Two-Against-One")',
    captureDesc:
      'An enemy piece is removed if you move your piece to form a connected line of <strong>three</strong> pieces in the pattern:',
    captureNote: 'Note: You must be the one moving to trigger the capture.',
    specialRulesTitle: 'Special Rules',
    safeApproach:
      '<strong>Safe Approach:</strong> If two enemy pieces are already adjacent, and you move next to them (creating [ENEMY]-[ENEMY]-[YOU]), your piece is <strong>NOT</strong> captured. Captures only happen when the aggressor forms the pair.',
    fullLineImmunity:
      '<strong>Full Line Immunity:</strong> If a row or column is completely full (4 pieces), <strong>NO</strong> captures can occur on that line, even if the capture pattern exists.',
    gotIt: "Got it, let's play!",
    loadingRooms: 'Loading rooms...',
    online: 'ONLINE',
    vsBot: 'VS Bot',
    playWithAI: 'Challenge different AI levels',
    selectDifficulty: 'Select Difficulty Level',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard (Expert)',
    botThinking: 'Bot is thinking...',
    botWins: 'Bot wins!',
    playerWins: 'Congratulations! You beat the bot.',
  },
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (
    key: keyof typeof translations.en,
    params?: Record<string, string | number>
  ) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [lang, setLang] = useState<Language>('zh');

  const t = (
    key: keyof typeof translations.en,
    params?: Record<string, string | number>
  ) => {
    let text = translations[lang][key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
};
