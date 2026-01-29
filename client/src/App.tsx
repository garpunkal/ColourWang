import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import type { GameState } from './types/game'
import HostScreen from './components/HostScreen.tsx'
import PlayerScreen from './components/PlayerScreen.tsx'
import { motion, AnimatePresence } from 'framer-motion'

const socket: Socket = io('http://localhost:3001')

function App() {
  const [role, setRole] = useState<'NONE' | 'HOST' | 'PLAYER'>('NONE')
  const [gameState, setGameState] = useState<GameState | null>(null)

  useEffect(() => {
    socket.on('game-created', (state: GameState) => setGameState(state))
    socket.on('joined-game', (state: GameState) => setGameState(state))
    socket.on('game-status-changed', (state: GameState) => setGameState(state))
    socket.on('player-joined', (players) => setGameState(prev => prev ? { ...prev, players } : null))

    return () => {
      socket.off('game-created')
      socket.off('joined-game')
      socket.off('game-status-changed')
      socket.off('player-joined')
    }
  }, [])

  return (
    <div className="flex-1 w-full relative overflow-hidden flex flex-col font-outfit">
      {/* Premium Background */}
      <div className="bg-animated">
        <div className="mesh-gradient" />
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="blob blob-1"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="blob blob-2"
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="blob blob-3"
        />
      </div>

      <AnimatePresence mode="wait">
        {role === 'NONE' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 flex flex-col items-center justify-center p-6 relative z-10"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="logo-container mb-16"
            >
              <h1 className="logo-colour">Colour</h1>
              <h1 className="logo-wang">wang</h1>
              <motion.div
                animate={{ width: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent mt-4"
              />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
              <motion.button
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -10, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                className="glass p-10 flex flex-col items-center gap-6 group transition-all rounded-[2rem]"
                onClick={() => setRole('HOST')}
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-color-blue/20 to-color-purple/20 flex items-center justify-center group-hover:from-color-blue/40 group-hover:to-color-purple/40 transition-all duration-500 shadow-xl">
                  <span className="text-5xl">📺</span>
                </div>
                <div className="text-center">
                  <h3 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-color-blue to-color-purple bg-clip-text text-transparent">Host Game</h3>
                  <p className="text-text-muted text-lg font-medium">Show on the big screen</p>
                </div>
                <div className="btn btn-primary w-full mt-4">Create Room</div>
              </motion.button>

              <motion.button
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ y: -10, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                className="glass p-10 flex flex-col items-center gap-6 group transition-all rounded-[2rem]"
                onClick={() => setRole('PLAYER')}
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-color-pink/20 to-color-orange/20 flex items-center justify-center group-hover:from-color-pink/40 group-hover:to-color-orange/40 transition-all duration-500 shadow-xl">
                  <span className="text-5xl">📱</span>
                </div>
                <div className="text-center">
                  <h3 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-color-pink to-color-orange bg-clip-text text-transparent">Join Game</h3>
                  <p className="text-text-muted text-lg font-medium">Play on your phone</p>
                </div>
                <div className="btn btn-secondary w-full mt-4">Join Now</div>
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-16 text-center"
            >
              <p className="text-white/40 font-bold tracking-[0.3em] uppercase text-sm mb-4">
                The Ultimate Multi-Screen Palette Challenge
              </p>
              <div className="flex gap-2 justify-center">
                {['blue', 'purple', 'pink', 'orange'].map((c, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full"
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
            className="flex-1 w-full flex flex-col relative z-20"
          >
            {role === 'HOST' ? (
              <HostScreen socket={socket} gameState={gameState} />
            ) : (
              <PlayerScreen socket={socket} gameState={gameState} setGameState={setGameState} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
