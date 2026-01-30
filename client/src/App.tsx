
import { useState, useEffect } from 'react';

import { useSocketGameState } from './hooks/useSocketGameState';
import { io, Socket } from 'socket.io-client';
import type { GameState } from './types/game';
import HostScreen from './components/HostScreen.tsx';
import PlayerScreen from './components/PlayerScreen.tsx';
import { Logo } from './components/Logo';
import { AnimatedBackground } from './components/AnimatedBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocketConnection } from './hooks/useSocketConnection';
import { Monitor, Smartphone } from 'lucide-react';


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
      if (myId && gameState.players.some(p => p.id === myId)) {
        setTimeout(() => setRole('PLAYER'), 0);
      }
    }
  }, [gameState, role]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      {/* Connection Status */}
      {!isConnected && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 left-0 right-0 z-100 bg-error/90 backdrop-blur-md text-white py-2 px-4 text-center font-bold text-sm tracking-widest uppercase"
        >
          Connecting to Wang Network... (Server Offline)
        </motion.div>
      )}

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
              className="mb-4 md:mb-10 flex flex-col items-center"
            >
              <Logo />
              <motion.div
                animate={{ width: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="h-1 bg-linear-to-r from-transparent via-white/50 to-transparent w-80"
              />
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
    </motion.div>
  )
}

export default App
