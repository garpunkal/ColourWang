# 🎨 ColourWang

**The Ultimate Multi-Screen Palette Challenge**

ColourWang is a high-energy, real-time multiplayer party game where players compete to identify colors and patterns. Designed for a "Host + Mobile Controller" setup, it features a premium glassmorphic UI, high-impact animations, and intense, game-changing mechanics.

---

## 🚀 Features

- **Multi-Screen Architecture**: One host screen (TV/Monitor) and multiple player controllers (Smartphones).
- **Real-Time Sync**: Powered by Socket.IO for sub-100ms latency between screens.
- **Premium Aesthetics**: Custom-built design system using Tailwind CSS v4, featuring glassmorphism, neon glows, fluid motion, and animated mesh backgrounds.
- **Synchronized Countdowns**: Full-screen countdowns keep all players in sync before every question.
- **Steal Mechanics**: Players can trigger "STEAL!" events that disrupt opponents by randomly disabling their options and announcing the theft with scrolling banners.
- **Question Curation**: Hosts can remove questions from the rotation in real-time during the results screen, ensuring the best content for their group.
- **Grand Finale**: A high-impact "Supernova" celebration for the winner at the end of the game.
- **QR Integration**: Seamless join flow via generated QR codes on the host screen.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Framer Motion, Lucide React, Socket.IO Client.
- **Backend**: Node.js, Express, Socket.IO.
- **Styling**: Tailwind CSS v4 (Modern Engine).
- **Language**: TypeScript for end-to-end type safety.

---

## 🏁 Getting Started

### Prerequisites

- **Node.js**: v18 or later recommended.
- **Network**: All devices (Host and Mobile) must be on the same Wi-Fi network.

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/garpunkal/ColourWang.git
   cd ColourWang
   ```

2. **Install all dependencies**:
   Run this helper script in the root directory to install dependencies for the root, client, and server:

   ```bash
   npm run install:all
   ```

3. **Run the application**:
   Start both the backend and frontend simultaneously with:
   ```bash
   npm run dev
   ```

The application will be available at:

- **Host Screen**: `http://localhost:5173` (Use this on your TV/Monitor)
- **Local Access**: Check your IP address (e.g., `http://192.168.1.XX:5173`) to join from mobile devices.

---

## 🎮 How to Play

1. **Launch the Host**: One person opens the application on a large screen and selects **HOST**.
2. **Players Join**: Participants scan the QR code on the host screen or enter the 4-digit room code at the join URL on their mobile devices.
3. **Pacing**: A 5-second countdown will precede each question to ensure everyone is ready.
4. **Answer Quickly**: The faster you answer, the more points you earn.
5. **Use Steal Cards**: If you're trailing, use your Steal Card to block other players' options for a round!
6. **Curation**: Notice a buggy or boring question? The host can click "Remove Question" during the results to delete it from the server's question pool permanently.

---

## 📁 Project Structure

```text
ColourWang/
├── client/             # Vite + React Frontend
│   ├── src/
│   │   ├── components/ # Game screens (Host, Player, Lobby)
│   │   ├── hooks/      # Socket and Game state management
│   │   ├── store/      # Global state for game logic
│   │   └── types/      # Shared TypeScript interfaces
├── server/             # Node.js + Socket.IO Backend
│   ├── src/
│   │   ├── socket/     # Event handlers for game rooms
│   │   ├── config/     # Questions and game settings
│   │   └── models/     # Persistence and room logic
└── package.json        # Root scripts for monorepo management
```

---

## ⚖️ License

MIT © [garpunkal](https://github.com/garpunkal)
