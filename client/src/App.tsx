import { useState, useEffect, lazy, Suspense } from 'react';

import { useSocketGameState } from './hooks/useSocketGameState';
import { io, Socket } from 'socket.io-client';
import type { GameState } from './types/game';
import { AnimatedBackground } from './components/AnimatedBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocketConnection, useReconnectionStatus } from './hooks/useSocketConnection';
import { Monitor, Smartphone, WifiOff } from 'lucide-react';
import { audioManager } from './utils/audioManager';
import { getNextTrack } from './config/musicConfig';
import socketConfig from './config/socketConfig.json';
import { Logo } from './components/Logo';
import { ReconnectionBanner } from './components/ReconnectionBanner';

// Lazy load role-specific screens to optimize bundle size
const HostScreen = lazy(() => import('./components/HostScreen.tsx'));
const PlayerScreen = lazy(() => import('./components/PlayerScreen.tsx'));

// In hosted environments (e.g. Render), set VITE_SOCKET_SERVER_URL to your backend URL.
// Supports legacy VITE_SERVER_URL as a fallback.
const rawSocketServerUrl =
  import.meta.env.VITE_SOCKET_SERVER_URL?.trim() ||
  import.meta.env.VITE_SERVER_URL?.trim() ||
  '';
const socketServerUrl = rawSocketServerUrl
  ? rawSocketServerUrl.replace(/\/+$/, '')
  : undefined;

const wakeBackend = () => {
  if (!socketServerUrl) return;

  fetch(`${socketServerUrl}/api/health`, { method: 'GET', cache: 'no-store' }).catch(() => {
    // Ignore wake failures; Socket.IO reconnect loop will continue.
  });
};

// Kick off an early wake request in hosted mode.
wakeBackend();

const socket: Socket = io(socketServerUrl, {
  path: '/socket.io',
  transports: socketConfig.socket.transports as ('websocket' | 'polling')[],
  reconnection: socketConfig.socket.reconnection,
  reconnectionDelay: Math.max(socketConfig.socket.reconnectionDelay, 1500),
  reconnectionDelayMax: 10000,
  reconnectionAttempts: Infinity,
  timeout: 20000
});

console.log(`Socket.IO connecting to ${socketServerUrl ?? 'same-origin backend'}`);

socket.on('connect_error', () => {
  wakeBackend();
});



function App() {
  // Check URL params on initial render
  const params = new URLSearchParams(window.location.search);
  const initialRole = params.has('code') ? 'PLAYER' : 'NONE';

  const [role, setRole] = useState<'NONE' | 'HOST' | 'PLAYER'>(initialRole)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [lastReconnectCheckAt, setLastReconnectCheckAt] = useState<number>(Date.now());
  const [secondsSinceReconnectCheck, setSecondsSinceReconnectCheck] = useState(0);
  const [hasConnectedOnce, setHasConnectedOnce] = useState<boolean>(socket.connected);
  const [showStartupConnectionIssue, setShowStartupConnectionIssue] = useState(false);
  const isConnected = useSocketConnection(socket);
  const reconnectionStatus = useReconnectionStatus(socket);
  const shouldShowConnectionOverlay = !isConnected && (hasConnectedOnce || showStartupConnectionIssue);

  useSocketGameState(socket, setGameState);

  useEffect(() => {
    if (isConnected) {
      setHasConnectedOnce(true);
      setShowStartupConnectionIssue(false);
      return;
    }

    if (hasConnectedOnce) return;

    const startupGraceTimer = setTimeout(() => {
      setShowStartupConnectionIssue(true);
    }, 3000);

    return () => clearTimeout(startupGraceTimer);
  }, [isConnected, hasConnectedOnce]);

  // Auto-restore role if we rejoin a session
  useEffect(() => {
    if (gameState && role === 'NONE') {
      const myId = localStorage.getItem('cw_playerId');
      const hostCode = localStorage.getItem('cw_hostCode');

      if (hostCode && gameState.code === hostCode) {
        setTimeout(() => setRole('HOST'), 0);
      } else if (myId && gameState.players.some(p => p.id === myId)) {
        setTimeout(() => setRole('PLAYER'), 0);
      }
    }
  }, [gameState, role]);


  // Clear URL params if we are on landing page to prevent "remembering" old codes
  useEffect(() => {
    if (role === 'NONE') {
      // Clear session data when returning to landing page
      localStorage.removeItem('cw_playerId');
      localStorage.removeItem('cw_gameCode');
      localStorage.removeItem('cw_hostCode');
      localStorage.removeItem('cw_playerName');
      
      if (window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [role]);

  useEffect(() => {
    // Ensure BGM is stopped for players (BGM is Host-only)
    if (role === 'PLAYER') {
      audioManager.stopBGM();
    }
  }, [role]);

  useEffect(() => {
    if (isConnected) return;

    const runReconnectCheck = () => {
      wakeBackend();
      if (socket.disconnected) {
        socket.connect();
      }
      setLastReconnectCheckAt(Date.now());
    };

    // Trigger immediately, then keep checking while Signal Lost is shown.
    runReconnectCheck();
    const interval = setInterval(runReconnectCheck, 4000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runReconnectCheck();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      setSecondsSinceReconnectCheck(0);
      return;
    }

    const tick = () => {
      setSecondsSinceReconnectCheck(Math.floor((Date.now() - lastReconnectCheckAt) / 1000));
    };

    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [isConnected, lastReconnectCheckAt]);

  // Handle global sound setting from GameState
  useEffect(() => {
    if (gameState?.soundEnabled !== undefined && gameState?.musicEnabled !== undefined) {
      // If music is off, sound effects should be off too
      const shouldMuteSFX = !gameState.soundEnabled || !gameState.musicEnabled;
      audioManager.setMuteSFX(shouldMuteSFX);
    }
  }, [gameState?.soundEnabled, gameState?.musicEnabled]);

  useEffect(() => {
    if (gameState?.musicEnabled !== undefined) {
      audioManager.setMuteBGM(!gameState.musicEnabled);
    }
  }, [gameState?.musicEnabled]);

  // Handle automatic playlist advancement
  useEffect(() => {
    audioManager.onTrackEnded = () => {
      if (role === 'HOST' && gameState?.code && gameState?.bgmTrack && gameState?.bgmTrack !== 'off') {
        const next = getNextTrack(gameState.bgmTrack);
        console.log(`[AUDIO] Track ended. Advancing to: ${next}`);
        socket.emit('update-bgm', { code: gameState.code, track: next });
      }
    };

    return () => {
      audioManager.onTrackEnded = null;
    };
  }, [role, gameState?.code, gameState?.bgmTrack]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >

      <AnimatedBackground />
      <ReconnectionBanner 
        isReconnecting={reconnectionStatus.isReconnecting} 
        attempt={reconnectionStatus.attempt} 
      />

      <AnimatePresence mode="wait">
        {role === 'NONE' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 flex flex-col items-center justify-center p-6 md:p-6 relative z-10"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-8 md:mb-12 flex flex-col items-center"
            >
              <Logo />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="mb-8 md:mb-10 text-sm md:text-base font-bold uppercase tracking-[0.2em] text-white/40 text-center px-4"
            >
              A live colour quiz — host on a big screen, everyone joins on their phone
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-6xl px-4 md:px-0">

              {/* Host Game Card */}
              <motion.button
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 80 }}
                whileHover={{ y: -10, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="hidden md:block relative group w-full bg-transparent order-2 md:order-1"
                onClick={() => setRole('HOST')}
              >
                <div className="relative p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden glass-card border-white/10 shadow-2xl transition-all duration-500">
                  {/* Tint Overlay */}
                  <div className="absolute inset-0 bg-color-blue/5 opacity-40 group-hover:opacity-60 transition-opacity duration-500" />

                  {/* Decorative Glow */}
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-color-blue/20 rounded-full blur-[100px] group-hover:bg-color-blue/40 transition-colors duration-500" />

                  <div className="relative z-10 flex flex-col items-center text-center gap-4">
                    <motion.div
                      className="w-20 h-20 md:w-20 md:h-20 flex items-center justify-center"
                      whileHover={{ rotate: -5, scale: 1.2 }}
                    >

                      <Monitor size={48} className="text-white" />

                    </motion.div>

                    <div className="space-y-2 -mt-4">
                      <h3 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter drop-shadow-lg">HOST</h3>
                      <p className="text-xl font-bold text-white/40 uppercase tracking-[0.3em]">Large Screen</p>
                    </div>

                    <div className="px-8 py-4 md:px-12 md:py-6 bg-color-blue text-white rounded-3xl md:rounded-[2.5rem] font-black italic tracking-tighter text-2xl md:text-3xl shadow-[0_20px_50px_rgba(0,229,255,0.4)] transition-all group-hover:scale-105 group-hover:shadow-[0_30px_60px_rgba(0,229,255,0.6)]">
                      START HOST →
                    </div>
                  </div>
                </div>
              </motion.button>

              {/* Join Game Card */}
              <motion.button
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 80 }}
                whileHover={{ y: -10, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative group w-full bg-transparent order-1 md:order-2"
                onClick={() => setRole('PLAYER')}
              >
                <div className="relative p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden glass-card border-white/10 shadow-2xl transition-all duration-500">
                  {/* Tint Overlay */}
                  <div className="absolute inset-0 bg-color-pink/5 opacity-40 group-hover:opacity-60 transition-opacity duration-500" />

                  {/* Decorative Glow */}
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-color-pink/20 rounded-full blur-[100px] group-hover:bg-color-pink/40 transition-colors duration-500" />

                  <div className="relative z-10 flex flex-col items-center text-center gap-4">
                    <motion.div
                      className="w-20 h-20 md:w-20 md:h-20 flex items-center justify-center"
                      whileHover={{ rotate: 5, scale: 1.2 }}
                    >
                      <span className="text-7xl drop-shadow-2xl">
                        <Smartphone size={48} className="text-white" />
                      </span>
                    </motion.div>

                    <div className="space-y-2 -mt-4">
                      <h3 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter drop-shadow-lg">JOIN</h3>
                      <p className="text-xl font-bold text-white/40 uppercase tracking-[0.3em]">Mobile device</p>
                    </div>

                    <div className="px-8 py-4 md:px-12 md:py-6 bg-color-pink text-white rounded-3xl md:rounded-[2.5rem] font-black italic tracking-tighter text-2xl md:text-3xl shadow-[0_20px_50px_rgba(248,58,123,0.4)] transition-all group-hover:scale-105 group-hover:shadow-[0_30px_60px_rgba(248,58,123,0.6)]">
                      JOIN NOW →
                    </div>
                  </div>
                </div>
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-12 md:mt-20 text-center px-4"
            >
              <p className="text-white/40 font-bold tracking-[0.3em] uppercase text-sm mb-6">
                The Ultimate Multi-Screen Palette Challenge
              </p>
              <div className="flex gap-3 justify-center">
                {['blue', 'purple', 'pink', 'orange'].map((c, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `var(--color-${c})` }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col relative z-20 flex-1"
          >
            <Suspense fallback={
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-color-blue/30 border-t-color-blue rounded-full mb-4"
                />
                <h2 className="text-xl font-bold text-white uppercase tracking-widest opacity-40">Loading Screen...</h2>
              </div>
            }>
              {role === 'HOST' ? (
                <HostScreen socket={socket} gameState={gameState} />
              ) : (
                <PlayerScreen socket={socket} gameState={gameState} setGameState={setGameState} />
              )}
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Overlay - Moved to bottom for maximum z-visibility */}
      <AnimatePresence>
        {shouldShowConnectionOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md text-white p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.96, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 22, stiffness: 110 }}
              className="w-full max-w-xl glass-card rounded-4xl border border-white/15 shadow-2xl p-6 md:p-8"
            >
              <div className="flex flex-col items-center gap-6">
                <motion.div
                  animate={{
                    y: [0, -3, 0],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-color-blue/15 border border-color-blue/40 flex items-center justify-center"
                >
                  <WifiOff size={36} className="text-color-blue/90" />
                </motion.div>

                <div className="space-y-3">
                  <h2 className="text-2xl md:text-4xl font-black italic tracking-tight uppercase">
                    Tiny Signal Detour
                  </h2>
                  <p className="text-sm md:text-base font-bold uppercase tracking-[0.14em] text-white/70">
                    You are still in the game. Re-linking to your room now.
                  </p>
                </div>

                <div className="w-full rounded-2xl bg-black/30 border border-white/10 p-4 md:p-5">
                  <div className="flex items-center justify-between gap-3 text-xs md:text-sm uppercase tracking-[0.12em] font-black text-white/70">
                    <span>Last check {secondsSinceReconnectCheck}s ago</span>
                    <span>Next in {Math.max(0, 4 - (secondsSinceReconnectCheck % 4))}s</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      key={secondsSinceReconnectCheck}
                      initial={{ width: '10%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 4, ease: 'linear' }}
                      className="h-full rounded-full bg-linear-to-r from-color-blue via-color-purple to-color-pink"
                    />
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -6, 0],
                      opacity: [0.35, 1, 0.35]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-color-blue"
                  />
                ))}
                 
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default App