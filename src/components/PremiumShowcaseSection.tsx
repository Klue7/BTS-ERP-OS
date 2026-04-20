import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { toast } from 'sonner';
import * as THREE from 'three';
import { useVisualLab } from './VisualLabContext';
import { BrickTile } from './BrickTile';
import {
  Trophy, Info, Target, Sparkles, AlertTriangle,
  Coins, Zap, Shield, Clock, Crosshair, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

// ─── Shrapnel explosion ───────────────────────────────────────────────────────
function Shrapnel({ position, color }: { position: [number, number, number]; color: string }) {
  const pieces = useMemo(() =>
    Array.from({ length: 8 }).map(() => ({
      position: [Math.random() * 0.5 - 0.25, Math.random() * 0.5 - 0.25, Math.random() * 0.5 - 0.25] as [number, number, number],
      velocity: [Math.random() * 2 - 1, Math.random() * 4 + 2, Math.random() * 2 - 1] as [number, number, number],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
      scale: Math.random() * 0.1 + 0.05,
    })), []);
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child: any, i) => {
      const p = pieces[i];
      child.position.x += p.velocity[0] * delta;
      child.position.y += p.velocity[1] * delta;
      child.position.z += p.velocity[2] * delta;
      p.velocity[1] -= 9.8 * delta;
      child.rotation.x += p.rotation[0] * delta;
      child.rotation.y += p.rotation[1] * delta;
      child.rotation.z += p.rotation[2] * delta;
      child.scale.setScalar(Math.max(0, child.scale.x - delta * 0.2));
    });
  });
  return (
    <group ref={groupRef} position={position}>
      {pieces.map((p, i) => (
        <mesh key={i} position={p.position} rotation={p.rotation} scale={p.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Tile types ───────────────────────────────────────────────────────────────
interface TileState {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

// ─── Single wall tile ─────────────────────────────────────────────────────────
function WallClone({ position, tile, onPick, onFlag, gameOver }: any) {
  const cloneRef = useRef<THREE.Group>(null);
  const isHovered = useRef(false);

  useFrame((_, delta) => {
    if (!cloneRef.current) return;
    const targetScale = tile.isRevealed ? 1.02 : (isHovered.current && !gameOver ? 1.12 : 1);
    const targetZ     = tile.isRevealed ? -0.08 : (isHovered.current && !gameOver ? 0.35 : 0);
    const targetRotY  = tile.isRevealed ? Math.PI : 0;
    cloneRef.current.scale.setScalar(THREE.MathUtils.damp(cloneRef.current.scale.x, targetScale, 10, delta));
    cloneRef.current.position.z = THREE.MathUtils.damp(cloneRef.current.position.z, targetZ, 10, delta);
    cloneRef.current.rotation.y = THREE.MathUtils.damp(cloneRef.current.rotation.y, targetRotY, 8, delta);
  });

  const numColors = ['transparent', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#f97316', '#06b6d4', '#fff'];

  return (
    <group>
      {tile.isRevealed && tile.isMine && <Shrapnel position={position} color="#3d2b1f" />}
      <group
        ref={cloneRef}
        position={position}
        onPointerOver={(e) => { e.stopPropagation(); if (!tile.isRevealed && !gameOver) { isHovered.current = true; document.body.style.cursor = 'pointer'; } }}
        onPointerOut={(e) => { e.stopPropagation(); isHovered.current = false; document.body.style.cursor = 'auto'; }}
        onClick={(e) => {
          e.stopPropagation();
          if (gameOver) return;
          if (e.nativeEvent.button === 2 || e.shiftKey) onFlag();
          else onPick();
          document.body.style.cursor = 'auto';
        }}
        onContextMenu={(e) => { e.nativeEvent.preventDefault(); e.stopPropagation(); if (!tile.isRevealed && !gameOver) onFlag(); }}
      >
        {/* Invisible hit box for reliable raycasting over complex brick geometry */}
        <mesh visible={false}>
          <boxGeometry args={[2.3, 0.8, 0.6]} />
        </mesh>
        <BrickTile />
        {tile.isRevealed && !tile.isMine && (
          <Html transform position={[0, 0, -0.01]} rotation={[0, Math.PI, 0]} className="pointer-events-none" distanceFactor={6}>
            <div className={`w-12 h-12 flex items-center justify-center font-black text-xl rounded-full ${tile.neighborMines === 0 ? 'opacity-0' : 'bg-black/50 border border-white/10'}`}
              style={{ color: numColors[tile.neighborMines] }}>
              {tile.neighborMines > 0 ? tile.neighborMines : ''}
            </div>
          </Html>
        )}
        {tile.isFlagged && !tile.isRevealed && (
          <Html position={[0, 0.4, 0.1]} distanceFactor={8}>
            <div className="bg-orange-500 p-1.5 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.5)] animate-pulse">
              <Target size={12} className="text-white" />
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

// ─── 3D Grid of tiles ─────────────────────────────────────────────────────────
function GridWall({ grid, onPick, onFlag, gameOver }: any) {
  return (
    <group scale={0.18} position={[0, -0.2, 0]}>
      {grid.map((row: TileState[], y: number) =>
        row.map((tile: TileState, x: number) => (
          <WallClone
            key={`${x}-${y}`}
            position={[(x - 3.5) * 2.4, (y - 3.5) * -0.9, 0]}
            tile={tile}
            onPick={() => onPick(x, y)}
            onFlag={() => onFlag(x, y)}
            gameOver={gameOver}
          />
        ))
      )}
    </group>
  );
}

// ─── Animated score flash overlay ────────────────────────────────────────────
function ScoreFlash({ score, visible }: { score: number; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: -10, scale: 1.1 }}
          exit={{ opacity: 0, y: -40, scale: 1.2 }}
          transition={{ duration: 0.6, ease: 'backOut' }}
          className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-7xl font-['Anton'] text-yellow-400 drop-shadow-[0_0_40px_rgba(234,179,8,0.8)]">
              +{score}
            </span>
            <span className="text-sm uppercase tracking-[0.4em] text-yellow-500/80">BTS Coins Earned</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── HUD Stat pill ───────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color = 'white', glow = '' }: any) {
  return (
    <div className={`flex flex-col items-center gap-0.5 px-4 py-2 bg-black/50 border border-white/8 rounded-2xl backdrop-blur-xl ${glow}`}>
      <div className="flex items-center gap-1.5">
        <Icon size={11} style={{ color }} />
        <span className="text-[8px] uppercase tracking-[0.2em] text-white/30">{label}</span>
      </div>
      <span className="text-lg font-mono font-black" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Sweeps progress bar ─────────────────────────────────────────────────────
function SweepBar({ chancesPlayed }: { chancesPlayed: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[8px] uppercase tracking-widest text-white/30">Sweeps</span>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            initial={{ scale: 0.7, opacity: 0.3 }}
            animate={{ scale: i < chancesPlayed ? 1 : 0.7, opacity: i < chancesPlayed ? 1 : 0.3 }}
            className={`w-2 h-2 rounded-full ${i < chancesPlayed ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'bg-white/20'}`}
          />
        ))}
      </div>
      <span className="text-[8px] font-mono text-white/40">{chancesPlayed}/3</span>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function PremiumShowcaseSection() {
  const { isLoggedIn, btsCoins, setBtsCoins, setIsLoginPageOpen } = useVisualLab();
  const navigate = useNavigate();

  const [grid, setGrid]             = useState<TileState[][]>([]);
  const [gameState, setGameState]   = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [minesLeft, setMinesLeft]   = useState(12);
  const [startTime, setStartTime]   = useState<number | null>(null);
  const [timer, setTimer]           = useState(0);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [chancesPlayed, setChancesPlayed]   = useState(0);
  const [lastScore, setLastScore]   = useState(0);
  const [earnedScore, setEarnedScore] = useState(0);
  const [showScoreFlash, setShowScoreFlash] = useState(false);
  const [combo, setCombo]           = useState(0);

  const hudRef = useRef<HTMLDivElement>(null);

  const initGame = () => {
    const size = 8;
    const mineCount = 12;
    const newGrid: TileState[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({ isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0 }))
    );
    let placed = 0;
    while (placed < mineCount) {
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      if (!newGrid[y][x].isMine) { newGrid[y][x].isMine = true; placed++; }
    }
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (newGrid[y][x].isMine) continue;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy, nx = x + dx;
            if (ny >= 0 && ny < size && nx >= 0 && nx < size && newGrid[ny][nx].isMine) count++;
          }
        newGrid[y][x].neighborMines = count;
      }
    }
    setGrid(newGrid);
    setGameState('playing');
    setMinesLeft(mineCount);
    setTimer(0);
    setStartTime(null);
    setCombo(0);
    setEarnedScore(0);
    setShowScoreFlash(false);
  };

  useEffect(() => {
    const today  = new Date().toDateString();
    const chances = parseInt(localStorage.getItem('bts_daily_chances') || '0', 10);
    const lastPlayed = localStorage.getItem('bts_last_played_date');
    const lastScoreVal = parseInt(localStorage.getItem('bts_last_score') || '0', 10);
    setLastScore(lastScoreVal);
    
    // Always permit game testing: ignoring limits!
    setHasPlayedToday(false); 
    setChancesPlayed(lastPlayed === today ? chances : 0);

    initGame();
  }, []);

  // Timer
  useEffect(() => {
    let interval: any;
    if (gameState === 'playing' && startTime) {
      interval = setInterval(() => setTimer(Math.floor((Date.now() - startTime) / 1000)), 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, startTime]);

  // GSAP HUD pulse on combo
  useEffect(() => {
    if (combo > 1 && hudRef.current) {
      gsap.fromTo(hudRef.current, { scale: 1.04 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' });
    }
  }, [combo]);

  const revealTile = (x: number, y: number, g: TileState[][]) => {
    if (x < 0 || x >= 8 || y < 0 || y >= 8 || g[y][x].isRevealed || g[y][x].isFlagged) return;
    g[y][x].isRevealed = true;
    if (g[y][x].neighborMines === 0 && !g[y][x].isMine)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) revealTile(x + dx, y + dy, g);
  };

  const handlePick = (x: number, y: number) => {
    if (gameState !== 'playing' || grid[y][x].isFlagged || grid[y][x].isRevealed) return;
    if (!startTime) setStartTime(Date.now());
    const newGrid = grid.map(row => row.map(t => ({ ...t })));
    if (newGrid[y][x].isMine) {
      newGrid.forEach(row => row.forEach(t => { if (t.isMine) t.isRevealed = true; }));
      setGrid(newGrid);
      endGame('lost', 0);
      return;
    }
    revealTile(x, y, newGrid);
    setGrid(newGrid);
    setCombo(c => c + 1);
    let revealed = 0;
    newGrid.forEach(row => row.forEach(t => { if (t.isRevealed) revealed++; }));
    if (revealed === 64 - 12) endGame('won', timer);
  };

  const handleFlag = (x: number, y: number) => {
    if (gameState !== 'playing' || grid[y][x].isRevealed) return;
    const newGrid = grid.map(row => row.map(t => ({ ...t })));
    newGrid[y][x].isFlagged = !newGrid[y][x].isFlagged;
    setGrid(newGrid);
    setMinesLeft(prev => newGrid[y][x].isFlagged ? prev - 1 : prev + 1);
  };

  const endGame = (status: 'won' | 'lost', elapsedSecs: number) => {
    setGameState(status);
    let reward = 0;
    if (status === 'won') {
      reward = Math.max(50, Math.floor(500 - elapsedSecs * 3) + combo * 20);
      setEarnedScore(reward);
      setShowScoreFlash(true);
      setTimeout(() => setShowScoreFlash(false), 2200);
      toast.success(`Grid Swept! You earned ${reward} BTS Coins!`);
    } else {
      toast.error('Mine struck — structural failure!');
    }
    const today = new Date().toDateString();
    const newChances = chancesPlayed + 1;
    localStorage.setItem('bts_last_played_date', today);
    localStorage.setItem('bts_daily_chances', String(newChances));
    localStorage.setItem('bts_last_score', String(reward));
    setChancesPlayed(newChances);
    // Removed lockout for testing loop
    setHasPlayedToday(false);
    if (reward > 0) {
      if (isLoggedIn) setBtsCoins(prev => prev + reward);
      else { toast.info(`Log in to redeem your ${reward} BTS Coins!`); setTimeout(() => setIsLoginPageOpen(true), 2500); }
    }
  };

  const timerDisplay = `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`;

  return (
    <section id="premium-showcase" className="relative flex min-h-[100svh] w-full select-none flex-col overflow-hidden bg-[#050505] text-white lg:h-screen">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(34,197,94,0.12),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_18%,transparent_82%,rgba(34,197,94,0.045))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {/* Corner accents */}
      {['top-14 left-4 sm:left-6', 'top-14 right-4 sm:right-6', 'bottom-10 left-4 sm:left-6', 'bottom-10 right-4 sm:right-6'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} z-10 pointer-events-none`}>
          <div className={`w-6 h-6 border-white/20 ${i === 0 ? 'border-t border-l' : i === 1 ? 'border-t border-r' : i === 2 ? 'border-b border-l' : 'border-b border-r'}`} />
        </div>
      ))}

      {/* ── TOP HUD ───────────────────────────────────────────────────────── */}
      <div ref={hudRef} className="relative z-30 mx-auto flex w-full max-w-[1600px] shrink-0 flex-wrap items-center justify-between gap-4 px-5 pb-3 pt-24 sm:px-8 sm:pt-28 lg:px-24 lg:pb-4 lg:pt-32">

        {/* Title block */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-['Playfair_Display'] text-3xl leading-none text-white md:text-5xl">
              {hasPlayedToday ? 'See You Tomorrow' : 'Tile Sweeper'}
            </h2>
            <motion.span
              key={gameState}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                gameState === 'won'  ? 'bg-green-500/10 border-green-500/40 text-green-400' :
                gameState === 'lost' ? 'bg-red-500/10 border-red-500/40 text-red-400' :
                'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
              }`}
            >
              {gameState === 'won' ? '✓ Cleared' : gameState === 'lost' ? '✗ Busted' : `Sweep ${chancesPlayed + 1}/3`}
            </motion.span>
          </div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">
            {hasPlayedToday
              ? 'All daily sweeps consumed — come back tomorrow'
              : 'Reveal safe tiles · Shift+Click or right-click to flag mines'}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 flex-wrap">
          {!hasPlayedToday && gameState === 'playing' && (
            <>
              <StatPill icon={AlertTriangle} label="Mines" value={minesLeft} color="#f97316" glow="shadow-[0_0_12px_rgba(249,115,22,0.15)]" />
              <StatPill icon={Clock} label="Time" value={timerDisplay} color="#60a5fa" />
              {combo > 1 && (
                <motion.div
                  key={combo}
                  initial={{ scale: 1.4, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-0.5 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl"
                >
                  <div className="flex items-center gap-1">
                    <Zap size={10} className="text-yellow-400" />
                    <span className="text-[8px] uppercase tracking-widest text-yellow-500/60">Combo</span>
                  </div>
                  <span className="text-lg font-mono font-black text-yellow-400">×{combo}</span>
                </motion.div>
              )}
            </>
          )}

          <SweepBar chancesPlayed={chancesPlayed} />

          {isLoggedIn ? (
            <button
              onClick={() => navigate('/portal/coin-store')}
              className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 rounded-xl hover:border-yellow-500/50 transition-all shrink-0"
            >
              <Coins size={15} className="text-yellow-500" />
              <div className="flex flex-col items-start">
                <span className="text-[7px] uppercase text-yellow-500/50 tracking-widest">BTSC Balance</span>
                <span className="text-sm font-mono font-black text-yellow-500">{btsCoins}</span>
              </div>
            </button>
          ) : (
            <button onClick={() => setIsLoginPageOpen(true)} className="text-[9px] uppercase tracking-widest text-white/30 border border-white/10 px-3 py-2 rounded-xl hover:text-white hover:border-white/30 transition-all">
              Login to save coins
            </button>
          )}
        </div>
      </div>

      {/* ── Side panels (xl only) ─────────────────────────────────────────── */}
      {/* Left: leaderboard */}
      <div className="absolute top-52 left-8 lg:left-24 z-30 hidden xl:flex flex-col gap-3 w-[220px]">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="bg-black/70 border border-white/8 rounded-2xl p-4 backdrop-blur-xl">
          <p className="text-[8px] uppercase font-black text-white/20 tracking-[0.3em] mb-3 flex items-center gap-2">
            <Trophy size={10} className="text-yellow-500" /> Top Streaks
          </p>
          <div className="space-y-2.5">
            {[{ name: 'Magnus D.', score: 4500 }, { name: 'Sarah W.', score: 3200 }, { name: 'You', score: btsCoins }].map((l, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-[9px] text-white/40 truncate">{l.name}</span>
                <span className="text-[9px] font-mono text-yellow-500/70">+{l.score}C</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}
          className="bg-black/70 border border-white/8 rounded-2xl p-4 backdrop-blur-xl">
          <p className="text-[8px] uppercase font-black text-white/20 tracking-[0.3em] mb-3 flex items-center gap-2">
            <Star size={10} className="text-white/40" /> Daily Best
          </p>
          <span className="text-xl font-mono font-black text-white">{lastScore > 0 ? lastScore : '—'}</span>
          <span className="text-[8px] text-white/30 ml-1">pts</span>
        </motion.div>
      </div>

      {/* Right: how-to-play */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
        className="absolute top-52 right-8 lg:right-24 z-30 hidden xl:flex flex-col w-[240px]">
        <div className="bg-black/70 border border-white/8 rounded-2xl p-5 backdrop-blur-xl space-y-5">
          <p className="text-[8px] uppercase font-black text-white/20 tracking-[0.3em] flex items-center gap-2">
            <Info size={10} className="text-white/40" /> How To Play
          </p>
          <div className="space-y-3 text-[8px] uppercase tracking-[0.12em] leading-relaxed">
            <div className="flex items-start gap-2">
              <Crosshair size={10} className="text-white/50 mt-0.5 shrink-0" />
              <p><span className="text-white/80">Click</span> to reveal a tile</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield size={10} className="text-orange-400 mt-0.5 shrink-0" />
              <p><span className="text-white/80">Shift+Click</span> or right-click to flag a mine</p>
            </div>
            <div className="flex items-start gap-2">
              <Zap size={10} className="text-yellow-400 mt-0.5 shrink-0" />
              <p><span className="text-yellow-400">Win faster</span> = more BTS Coins</p>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles size={10} className="text-green-400 mt-0.5 shrink-0" />
              <p>Chain reveals for <span className="text-green-400">combo bonus</span></p>
            </div>
          </div>

          {/* Min/max reward indicator */}
          <div className="pt-2 border-t border-white/5">
            <p className="text-[7px] uppercase tracking-widest text-white/20 mb-2">Coin Reward Range</p>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: gameState === 'playing' && timer > 0 ? `${Math.max(10, 100 - timer * 2)}%` : '80%' }}
                transition={{ duration: 1, ease: 'linear' }}
                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-300 rounded-full"
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[7px] text-white/20 font-mono">50</span>
              <span className="text-[7px] text-yellow-500 font-mono">500+</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 3D Canvas ─────────────────────────────────────────────────────── */}
      <div
        data-free-scroll
        className={`relative z-20 mx-3 min-h-[360px] flex-1 overflow-hidden rounded-[2rem] border border-white/[0.06] bg-black/20 shadow-[0_30px_120px_rgba(0,0,0,0.35)] transition-all duration-700 sm:mx-6 sm:min-h-[440px] lg:min-h-0 ${
          hasPlayedToday ? 'opacity-20 blur-sm scale-95' : 'opacity-100'
        }`}
        id="wall-3d-anchor"
      >
        {/* Score flash overlay */}
        <ScoreFlash score={earnedScore} visible={showScoreFlash} />

        <Canvas
          camera={{ position: [0, 0, 3.4], fov: 48 }}
          shadows={false}
          dpr={Math.min(window.devicePixelRatio, 1.5)}
          gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[4, 6, 5]} intensity={2.4} />
          <directionalLight position={[-4, -2, 4]} intensity={1.0} color="#aaccff" />
          <pointLight position={[0, 0, 3]} intensity={1.2} color="#ffffff" />
          <GridWall grid={grid} onPick={handlePick} onFlag={handleFlag} gameOver={hasPlayedToday || gameState !== 'playing'} />
        </Canvas>
      </div>

      {/* ── Bottom action bar ─────────────────────────────────────────────── */}
      <div className="relative z-30 mx-auto flex w-full max-w-[1600px] shrink-0 flex-wrap items-center justify-between gap-4 px-5 pb-10 pt-4 sm:px-8 sm:pb-12 lg:px-24 lg:pb-16">
        <AnimatePresence mode="wait">
          <motion.p
            key={gameState}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[9px] uppercase tracking-[0.3em] text-white/30"
          >
            {!hasPlayedToday && gameState === 'playing' && '[ Click · Shift+Click to flag · Win fast for more coins ]'}
            {gameState === 'won'  && <span className="text-green-500">✓ Sector cleared — great work!</span>}
            {gameState === 'lost' && <span className="text-red-500">✗ Mine struck — structural failure!</span>}
          </motion.p>
        </AnimatePresence>

        {/* Replay button: Always visible regardless of chances limit now */}
        {(gameState === 'won' || gameState === 'lost') && (
          <motion.button
            onClick={initGame}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-full font-black text-[11px] uppercase tracking-[0.25em] shadow-[0_0_40px_rgba(234,179,8,0.4)]"
          >
            <Sparkles size={15} />
            Next Sweep
          </motion.button>
        )}
      </div>

        {/* Daily limit overlays removed for ease of testing */}
    </section>
  );
}
