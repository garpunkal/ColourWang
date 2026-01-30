# 🎨 ColourWang

**The Ultimate Multi-Screen Palette Challenge**

ColourWang is a high-energy, real-time multiplayer party game where players compete to identify colors and patterns. Designed for a "Host + Mobile Controller" setup, it features a premium glassmorphic UI, high-impact animations, and intense "STEAL!" mechanics.

---

## 🚀 Features

- **Multi-Screen Architecture**: One host screen (TV/Monitor) and multiple player controllers (Smartphones).
- **Real-Time Sync**: Powered by Socket.IO for sub-100ms latency between screens.
- **Premium Aesthetics**: A custom-built design system using Tailwind CSS v4, featuring glassmorphism, neon glows, and fluid motion.
- **Steal Mechanics**: Players can use "Steal Cards" to disrupt opponents with full-screen scrolling announcements and randomly disabled options.
- **Dynamic Avatars**: Unique, color-coded avatars for every player.
- **QR Integration**: Seamless join flow via generated QR codes on the host screen.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Framer Motion, Lucide React, Socket.IO Client.
- **Backend**: Node.js, Express, Socket.IO.
- **Styling**: Tailwind CSS v4 (Modern Engine).
- **Language**: TypeScript throughout for type-safe game logic.

---

## 🏁 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or yarn

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/garpunkal/ColourWang.git
   cd ColourWang
   ```

2. **Install dependencies**:
   Run this in the root directory to install both client and server dependencies:

   ```bash
   npm install
   ```

3. **Run the application**:
   Start both the backend and frontend simultaneously with:
   ```bash
   npm run dev
   ```

The application will be available at:

- **Host Screen**: `http://localhost:5173`
- **Socket Server**: `http://localhost:3001`

---

## 🎮 How to Play

1. **Launch the Host**: One person opens the application and selects **HOST**.
2. **Players Join**: Participants scan the QR code or enter the 4-digit room code on their mobile devices after selecting **JOIN**.
3. **Start the Game**: Once everyone is in, the host starts the session.
4. **Answer Questions**: Select the correct color palette as quickly as possible.
5. **Use Steal Cards**: If you're trailing, use your Steal Card to block other players' options for a round!

---

## 📁 Project Structure

```text
ColourWang/
├── client/             # Vite + React Frontend
│   ├── src/
│   │   ├── components/ # Game screens (Host, Player, Lobby)
│   │   ├── hooks/      # Socket and Game state management
│   │   ├── constants/  # Avatars and color tokens
│   │   └── types/      # Shared TypeScript interfaces
├── server/             # Node.js + Socket.IO Backend
│   ├── src/
│   │   ├── socket/     # Game event handlers
│   │   └── models/     # Backend game state logic
└── package.json        # Root scripts for concurrent execution
```

---

## ⚖️ License

MIT © [garpunkal](https://github.com/garpunkal)
