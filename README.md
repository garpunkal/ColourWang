# 🎨 ColourWang

**The Ultimate Multi-Screen Palette Challenge**

ColourWang is a high-energy, real-time multiplayer party game where players compete to identify colors and patterns. Designed for a "Host + Mobile Controller" setup, it features a premium glassmorphic UI, high-impact animations, and intense, game-changing mechanics.

---

## 🚀 Features

- **Multi-Screen Architecture**: One host screen (TV/Monitor) and multiple player controllers (Smartphones).
- **Real-Time Sync**: Powered by Socket.IO for sub-100ms latency between screens.
- **Premium Aesthetics**: Custom-built design system using Tailwind CSS v4, featuring glassmorphism, neon glows, fluid motion, and animated mesh backgrounds.
- **Performance Optimized**: Fine-tuned animations and rendering for smooth gameplay even on older mobile devices.
- **Synchronized Countdowns**: Full-screen countdowns keep all players in sync before every question.
- **Steal Mechanics**: Players can trigger "STEAL!" events that disrupt opponents by randomly disabling their options and announcing the theft with scrolling banners.
- **Streak Rewards**: Earn a **1.5x score multiplier** by getting 3 or more answers correct in a row.
- **Fastest Finger Bonus**: Be the first to answer correctly for a **+5 point bonus**.
- **Host Curation**: Hosts can remove questions from the rotation in real-time during the results screen.
- **Fully Customisable**: Toggle Streaks, Shields, and Speed Bonuses on or off in the Lobby Setup.
- **Accessibility First**: Forced text labels for all color cards to assist players with color vision deficiency.
- **Grand Finale**: A high-impact "Supernova" celebration for the winner at the end of the game.
- **QR Integration**: Seamless join flow via generated QR codes on the host screen.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 7, Framer Motion, Lucide React, Socket.IO Client.
- **Backend**: Node.js, Express, Socket.IO.
- **Styling**: Tailwind CSS v4 (Modern Engine).
- **Security**: vite-plugin-mkcert for local SSL.
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

- **Host Screen**: `https://localhost:5173` (Use this on your TV/Monitor)
- **Local Access**: Check your IP address (e.g., `https://192.168.1.XX:5173`) to join from mobile devices.

> **Note**: On first run, the client will automatically generate SSL certificates in the `/certs` directory. Ensure you accept the certificate in your browser for local development.

---

## 🔐 Secure Development & External Access

### HTTPS & SSL
ColourWang uses HTTPS by default to support modern browser features on mobile. 
- The client uses `vite-plugin-mkcert` to manage certificates.
- The server automatically detects these certificates in the `/certs` folder.
- If you see a "Not Secure" warning in your browser, it's expected for local self-signed certs; click "Advanced" and "Proceed".

### External Access (Ngrok)
To play with friends over the internet, you can use [ngrok](https://ngrok.com/):
1. Start the app locally: `npm run dev`
2. Run ngrok on the client port: `ngrok http 5173`
3. Share the ngrok URL (e.g., `https://random-id.ngrok-free.app`) with your players.
4. The built-in proxy will handle both the React app and the Socket.IO traffic through a single tunnel.

---

## 🎮 How to Play

1. **Launch the Host**: One person opens the application on a large screen and selects **HOST**.
2. **Players Join**: Participants scan the QR code on the host screen or enter the 4-digit room code at the join URL.
   - *Note: Join info is hidden once the game starts to maximize screen real estate.*
3. **Pacing**: A 5-second countdown will precede each question to ensure everyone is ready.
4. **Answer Quickly**: The faster you answer, the more points you earn. The first person to answer correctly gets the **⚡ Fastest Finger Bonus** (+5).
5. **Keep the Streak**: Get 3 correct in a row to start a **🔥 Streak** (1.5x Multiplier).
6. **Strategic Disruption**: Use **Steal Cards** to disable opponents' options, or activate a **🛡️ Shield** to block incoming steals.
7. **Curation**: Notice a buggy or boring question? The host can click "Remove Question" (trash icon) during the results to delete it from the server's pool permanently.

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
