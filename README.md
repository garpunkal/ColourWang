# 🎨 ColourWang

**The Ultimate Multi-Screen Palette Challenge**

ColourWang is a high-energy, real-time multiplayer party game where players compete to identify colours and patterns. Designed for a "Host + Mobile Controller" setup, it features a premium glassmorphic UI, high-impact animations, and intense, game-changing mechanics.

---

## 🚀 Features

- **Multi-Screen Architecture**: One host screen (TV/Monitor) and multiple player controllers (Smartphones).
- **Real-Time Sync**: Powered by Socket.IO for sub-100ms latency between screens.
- **Premium Aesthetics**: Custom-built design system using Tailwind CSS v4, featuring glassmorphism, neon glows, fluid motion, and animated mesh backgrounds.
- **Performance Optimized**: Fine-tuned animations and rendering for smooth gameplay even on older mobile devices.
- **Progressive Web App**: PWA support with service worker for offline functionality and native app-like experience.
- **Centralized Configuration**: Single source of truth for all game settings, timing, and content.
- **Responsive Design**: Adapts seamlessly from mobile controllers to large host screens.
- **Synchronized Countdowns**: Full-screen countdowns keep all players in sync before every question.
- **Steal Mechanics**: Players can trigger "STEAL!" events that disrupt opponents by randomly disabling their options and announcing the theft with scrolling banners.
- **Streak Rewards**: Earn a **1.5x score multiplier** by getting 3 or more answers correct in a row.
- **Fastest Finger Bonus**: Be the first to answer correctly for a **+5 point bonus**.
- **Host Curation**: Hosts can remove questions from the rotation in real-time during the results screen.
- **Fully Customisable**: Toggle Streaks, Shields, and Speed Bonuses on or off in the Lobby Setup.
- **Accessibility First**: Forced text labels for all colour cards to assist players with colour vision deficiency.
- **Grand Finale**: A high-impact "Supernova" celebration for the winner at the end of the game.
- **QR Integration**: Seamless join flow via generated QR codes on the host screen.
- **Rich Question Database**: Over 20 trivia categories with hundreds of questions across diverse topics.

---

## 🛠️ Tech Stack

- **Frontend**: React 19.2, Vite 7.2, Framer Motion 12, Lucide React, Socket.IO Client 4.8
- **Backend**: Node.js, Express 5.2, Socket.IO 4.8
- **Styling**: Tailwind CSS v4.1 (Modern Engine), Outfit Font Family
- **Security**: vite-plugin-mkcert for local SSL certificates
- **Language**: TypeScript 5.9 for end-to-end type safety
- **Development**: Concurrently for parallel dev servers, ESLint 9, Nodemon

---

## 🏁 Getting Started

### Prerequisites

- **Node.js**: v18 or later recommended.
- **Network**: All devices (Host and Mobile) must be on the same Wi-Fi network for local play.

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

> **Important**: On first run, the client will automatically generate SSL certificates in the `/certs` directory. Start the client first to generate certificates, then the server will automatically detect and use them. You may need to accept the certificate warning in your browser for local development.

---

## 🔐 Secure Development & External Access

### HTTPS & SSL
ColourWang uses HTTPS by default to support modern browser features on mobile and PWA functionality:
- The client uses `vite-plugin-mkcert` to automatically generate SSL certificates in the `/certs` directory
- The server automatically detects and uses these certificates for secure connections
- Self-signed certificates are expected for local development - accept certificate warnings in your browser
- **Important**: Start the client first to generate certificates, then start the server

### External Access (Ngrok)
To play with friends over the internet, you can use [ngrok](https://ngrok.com/):
1. Start the app locally: `npm run dev`
2. Run ngrok on the client port: `ngrok http 5173`
3. Share the ngrok URL (e.g., `https://random-id.ngrok-free.app`) with your players
4. The built-in Vite proxy handles both the React app and Socket.IO traffic through a single tunnel

### Development Commands

- `npm run dev` - Start both client and server in development mode
- `npm run dev:client` - Start only the frontend development server
- `npm run dev:server` - Start only the backend development server
- `npm run install:all` - Install dependencies for root, client, and server
- `cd client && npm run build` - Build the client for production
- `cd server && npm run kill-port` - Kill any process using the server port

---

## 📱 Progressive Web App Features

ColourWang includes full PWA support for enhanced mobile experience:

- **Service Worker**: Enables offline functionality and faster loading
- **Web App Manifest**: Allows installation as a native-like app on mobile devices
- **Add to Home Screen**: Players can install the game directly to their phone's home screen
- **Offline Support**: Core game assets cached for improved performance
- **Mobile-First Design**: Optimized touch controls and responsive layout

To install as a PWA:
1. Open the game in your mobile browser
2. Look for "Add to Home Screen" or "Install App" prompt
3. Follow the installation prompts
4. Launch from your home screen like a native app

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
├── config/                  # 🆕 Centralized Configuration
│   ├── questions/           # Game questions database by category
│   │   ├── trivia_animals.json
│   │   ├── trivia_cars.json
│   │   ├── trivia_general.json
│   │   └── ... (22 categories total)
│   ├── palette.json         # Color definitions with names and hex codes
│   ├── avatars.json         # Player avatar settings and configurations
│   ├── rounds.json          # Round metadata and category mappings
│   ├── gameDefaults.json    # Default game settings and feature toggles
│   ├── music.json           # Background music track definitions
│   ├── server.json          # Server/network configuration and timings
│   ├── environment.json     # Environment-specific settings
│   ├── deployment.json      # Production and deployment configuration
│   └── README.md            # Comprehensive configuration guide
├── certs/                   # Auto-generated SSL certificates
│   ├── config.json          # SSL configuration
│   ├── localhost-key.pem    # SSL private key
│   └── localhost.pem        # SSL certificate
├── client/                  # Vite + React 19 Frontend
│   ├── public/
│   │   ├── manifest.webmanifest  # PWA manifest
│   │   ├── service-worker.js     # PWA service worker
│   │   ├── assets/              # Static assets and icons
│   │   └── bgm/                 # Background music files
│   └── src/
│       ├── components/          # Game UI components
│       │   ├── host/           # Host screen components
│       │   ├── player/         # Player screen components
│       │   └── shared/         # Shared UI components
│       ├── hooks/              # React hooks for state management
│       │   ├── useSocketConnection.ts
│       │   ├── useSocketGameState.ts
│       │   └── useSparkle.ts
│       ├── contexts/           # React context providers
│       │   └── SettingsContext.tsx
│       ├── config/             # Configuration wrappers
│       ├── constants/          # Static constants and enums
│       ├── types/              # TypeScript type definitions
│       └── utils/              # Utility functions and helpers
├── server/                  # Node.js + Express + Socket.IO Backend
│   └── src/
│       ├── socket/          # Socket.IO event handlers
│       │   └── handlers.ts
│       ├── models/          # Game state and data models
│       │   ├── gameState.ts
│       │   └── player.ts
│       ├── game/            # Game logic and room management
│       │   └── gamesMap.ts
│       ├── scripts/         # Database migration and utility scripts
│       └── utils/           # Server utilities and helpers
│           ├── logger.ts
│           ├── generateCode.ts
│           └── questionLoader.ts
└── package.json             # Root monorepo scripts and dependencies
```

---

## ⚙️ Configuration Management

ColourWang features a **centralized configuration system** where all settings are managed from the `/config` directory. This eliminates duplicate configuration files and makes customization much easier.

### Key Configuration Files:

- **`server.json`**: Network settings (ports, SSL, CORS), socket configuration, timing values, and logging controls
- **`gameDefaults.json`**: Default game settings (rounds, questions per round, timers, feature toggles)
- **`questions/`**: Individual JSON files for each trivia category (22 categories total)
- **`palette.json`**: Color palette definitions with names and hex codes used throughout the game
- **`avatars.json`**: Player avatar configurations including colors, styles, and names
- **`rounds.json`**: Round metadata with titles, descriptions, and category mappings
- **`music.json`**: Background music track definitions and configurations
- **`environment.json`**: Development vs production settings and feature flags
- **`deployment.json`**: Production deployment and optimization settings

### Question Categories Available:

The game includes 22+ diverse trivia categories:
- Animals, Cars, Celebrities, Disney, Fashion
- Flags, Food, General Knowledge, Geography
- History, Household Items, Logos, Movies & TV
- Music, Nature, Netflix, Pop Culture, Science
- Sports, Superheroes, Toys, Video Games

### Easy Customization:

```json
// config/server.json - Adjust game timing
{
  "timings": {
    "roundIntroDelay": 5000,    // Time before countdown starts
    "countdownDelay": 4800,     // Countdown duration
    "autoStartTimer": 30,       // Lobby auto-start timer
    "stealNoticeDelay": 3500    // Steal notification display time
  },
  "logging": {
    "enabled": false,           // Master logging switch
    "levels": {
      "info": true,
      "warn": true, 
      "error": true,
      "debug": false
    }
  }
}
```

```json
// config/gameDefaults.json - Game feature toggles
{
  "features": {
    "streaksEnabled": true,     // Enable streak multipliers
    "shieldsEnabled": true,     // Enable steal protection
    "speedBonusEnabled": true   // Enable fastest finger bonus
  },
  "gameplay": {
    "questionsPerRound": 10,
    "maxRounds": 3,
    "answerTimeLimit": 15000
  }
}
```

See [`/config/README.md`](config/README.md) for complete configuration documentation.

---

## 🛠️ Development & Troubleshooting

### Common Issues

**Server won't start / Port already in use:**
```bash
cd server
npm run kill-port
npm run dev
```

**SSL Certificate warnings:**
- Start the client first: `npm run dev:client`
- Wait for certificates to generate in `/certs` directory
- Then start the server: `npm run dev:server`
- Accept certificate warnings in your browser (expected for local development)

**Players can't connect to host:**
- Ensure all devices are on the same Wi-Fi network
- Check your local IP address and use `https://192.168.1.XX:5173`
- Temporarily disable firewall/antivirus if connection issues persist
- For mobile devices, you may need to accept the certificate warning

**Questions not loading:**
- Check that files exist in `/config/questions/` directory
- Verify JSON format in question files
- Check server console for any parsing errors

### Development Tips

- Enable server logging by setting `"enabled": true` in `config/server.json`
- Use browser dev tools to inspect WebSocket connections
- Check the network tab for failed API calls or resource loading issues
- Mobile debugging: Use Chrome DevTools remote debugging for mobile devices

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`  
3. Make your changes and test thoroughly
4. Commit with clear, descriptive messages
5. Push to your fork and submit a pull request

### Development Guidelines

- Follow TypeScript best practices and maintain type safety
- Test on both desktop and mobile devices
- Update configuration documentation when adding new settings
- Maintain consistent code formatting with ESLint rules
- Add new question categories in `/config/questions/` following existing format

---

## ⚖️ License

MIT © [garpunkal](https://github.com/garpunkal)

### Third-Party Licenses

- React: MIT License
- Socket.IO: MIT License
- Tailwind CSS: MIT License
- Framer Motion: MIT License
- Express: MIT License

For a complete list of dependencies and their licenses, see the `package.json` files in the client and server directories.
