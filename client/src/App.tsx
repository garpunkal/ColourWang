
import { useState, useEffect } from 'react';

import { useSocketGameState } from './hooks/useSocketGameState';
import { io, Socket } from 'socket.io-client';
import type { GameState } from './types/game';
import HostScreen from './components/HostScreen.tsx';
import PlayerScreen from './components/PlayerScreen.tsx';
import { AnimatedBackground } from './components/AnimatedBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocketConnection } from './hooks/useSocketConnection';
import { Monitor, Smartphone, WifiOff } from 'lucide-react';
import { audioManager } from './utils/audioManager';


// Socket.IO connection - uses relative path to leverage Vite proxy
// In production/ngrok: connects through the same origin (proxied to backend)
// In local dev: Vite proxy forwards to localhost:3001
const socket: Socket = io({
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

console.log('Socket.IO connecting via proxy to backend server');



function App() {
  // Check URL params on initial render
  const params = new URLSearchParams(window.location.search);
  const initialRole = params.has('code') ? 'PLAYER' : 'NONE';

  const [role, setRole] = useState<'NONE' | 'HOST' | 'PLAYER'>(initialRole)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const isConnected = useSocketConnection(socket);

  useSocketGameState(socket, setGameState);

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
    if (role === 'NONE' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [role]);

  // Attempt to play BGM when user enters the game (Host/Player)
  useEffect(() => {
    if (role !== 'NONE') {
      audioManager.playBGM();
    }
  }, [role]);

  // Handle global sound setting from GameState
  useEffect(() => {
    if (gameState?.soundEnabled !== undefined) {
      audioManager.setMute(!gameState.soundEnabled);
    }
  }, [gameState?.soundEnabled]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >

      <AnimatedBackground />

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
              className="mb-8 md:mb-16 flex flex-col items-center"
            >
              {/* Logo Removed */}
            </motion.div>

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
            {role === 'HOST' ? (
              <HostScreen socket={socket} gameState={gameState} />
            ) : (
              <PlayerScreen socket={socket} gameState={gameState} setGameState={setGameState} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Overlay - Moved to bottom for maximum z-visibility */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-[#050510]/95 backdrop-blur-3xl text-white p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="flex flex-col items-center gap-12 max-w-3xl"
            >
              {/* Animated Connection Icon */}
              <div className="relative group">
                <motion.div
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.1, 0.3, 0.1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-10 bg-error/30 blur-[80px] rounded-full"
                />
                <motion.div
                  animate={{
                    borderColor: ['rgba(255, 51, 102, 0.2)', 'rgba(255, 51, 102, 0.6)', 'rgba(255, 51, 102, 0.2)'],
                    boxShadow: [
                      '0 0 0px rgba(255, 51, 102, 0)',
                      '0 0 50px rgba(255, 51, 102, 0.3)',
                      '0 0 0px rgba(255, 51, 102, 0)'
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-40 h-40 md:w-56 md:h-56 rounded-full border-4 border-error/30 flex items-center justify-center relative z-10 bg-black/40 backdrop-blur-md"
                >
                  <WifiOff size={80} className="text-error animate-pulse" />
                </motion.div>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <motion.h2
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-6xl md:text-9xl font-black italic tracking-tighter uppercase drop-shadow-[0_0_50px_rgba(255,51,102,0.6)] leading-none"
                  >
                    Signal Lost
                  </motion.h2>
                  <div className="h-2 w-24 md:w-32 bg-error mx-auto rounded-full" />
                </div>

                <div className="space-y-4">
                  <p className="text-xl md:text-4xl font-bold text-white tracking-[0.2em] uppercase italic">
                    Reconnecting to Wang Network
                  </p>
                  <p className="text-base md:text-xl font-medium text-white/30 uppercase tracking-[0.4em]">
                    Hold tight... searching for host...
                  </p>
                </div>
              </div>

              {/* Premium Loading dots */}
              <div className="flex gap-6 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -20, 0],
                      scale: [1, 1.5, 1],
                      backgroundColor: ['#ffffff', '#ff3366', '#ffffff'],
                      boxShadow: [
                        '0 0 0px rgba(255,255,255,0)',
                        '0 0 20px rgba(255,51,102,0.8)',
                        '0 0 0px rgba(255,255,255,0)'
                      ]
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                    className="w-4 h-4 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default App
