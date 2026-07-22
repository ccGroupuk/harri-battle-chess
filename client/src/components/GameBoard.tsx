import { useState, useEffect, useMemo, useRef } from "react";
import { BoardState, getValidMoves, isGameOver, PieceType, CastlingRights, isCastlingMove, applyMove, updateCastlingRights } from "@/lib/chess-engine";
import { PieceIcon } from "./PieceIcon";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PROMOTION_PIECES: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

const PARTICLE_COUNT = 16;
const PARTICLE_COLORS = ['#f97316', '#eab308', '#ef4444', '#fbbf24'];

function playExplosionSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const bufferSize = audioContext.sampleRate * 0.3;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      const decay = 1 - (i / bufferSize);
      data[i] = (Math.random() * 2 - 1) * decay * decay;
    }
    
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
    
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.4, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    
    noise.start();
    noise.stop(audioContext.currentTime + 0.3);
  } catch (e) {
  }
}

function ExplosionEffect({ onComplete }: { onComplete: () => void }) {
  const particles = useMemo(() => 
    [...Array(PARTICLE_COUNT)].map((_, i) => ({
      angle: (i * (360 / PARTICLE_COUNT)) * (Math.PI / 180),
      distance: 60 + Math.random() * 40,
      size: 3 + Math.random() * 3,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    })), []
  );

  useEffect(() => {
    playExplosionSound();
    const timer = setTimeout(onComplete, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-[-100%] z-50 pointer-events-none overflow-visible" data-testid="explosion-effect">
      <motion.div
        className="absolute inset-[25%] bg-yellow-400 rounded-full"
        initial={{ scale: 0.3, opacity: 1 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-[30%] bg-orange-500 rounded-full"
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: 3.5, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
      />
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{ 
            background: p.color,
            width: p.size * 2,
            height: p.size * 2,
            marginLeft: -p.size,
            marginTop: -p.size,
          }}
          initial={{ x: 0, y: 0, scale: 1.5, opacity: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            scale: 0,
            opacity: 0,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
      <motion.div
        className="absolute inset-[10%] border-8 border-orange-500/60 rounded-full"
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 border-4 border-red-400/40 rounded-full"
        initial={{ scale: 0.4, opacity: 0.8 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
      />
    </div>
  );
}

interface BoardTheme {
  lightColor: string;
  darkColor: string;
  backgroundImage?: string;
  heroPieceStyle?: { textureUrl?: string; useClassicSvg?: boolean };
  villainPieceStyle?: { textureUrl?: string; useClassicSvg?: boolean };
}

export interface MoveInfo {
  from: [number, number];
  to: [number, number];
  promotion?: PieceType;
}

interface GameBoardProps {
  board: BoardState;
  turn: 'w' | 'b';
  onMove: (newBoard: BoardState, nextTurn: 'w' | 'b', capturedPieceType?: PieceType) => void;
  onRawMove?: (move: MoveInfo) => void;
  disabled?: boolean;
  boardTheme?: BoardTheme;
  castlingRights?: CastlingRights;
  onCastlingRightsChange?: (rights: CastlingRights) => void;
}

const DEFAULT_THEME: BoardTheme = {
  lightColor: '#cbd5e1',
  darkColor: '#1e293b',
};

export function GameBoard({ board, turn, onMove, onRawMove, disabled, boardTheme = DEFAULT_THEME, castlingRights, onCastlingRightsChange }: GameBoardProps) {
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [explosion, setExplosion] = useState<[number, number] | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    board: BoardState;
    position: [number, number];
    color: 'w' | 'b';
  } | null>(null);

  const pendingMoveRef = useRef<{ from: [number, number]; to: [number, number] } | null>(null);

  const handlePromotion = (pieceType: PieceType) => {
    if (!pendingPromotion) return;
    
    const { board: newBoard, position: [r, c] } = pendingPromotion;
    const piece = newBoard[r][c];
    if (piece) {
      piece.type = pieceType;
    }
    
    if (onRawMove && pendingMoveRef.current) {
      onRawMove({ from: pendingMoveRef.current.from, to: pendingMoveRef.current.to, promotion: pieceType });
    }
    onMove(newBoard, turn === 'w' ? 'b' : 'w', (pendingPromotion as any).capturedPieceType);
    setPendingPromotion(null);
    pendingMoveRef.current = null;
    setSelected(null);
    setValidMoves([]);
  };

  const handleSquareClick = (r: number, c: number) => {
    if (disabled || pendingPromotion) return;

    const clickedPiece = board[r][c];
    const isSelectedSquare = selected && selected[0] === r && selected[1] === c;
    
    const isMoveTarget = validMoves.some(([vr, vc]) => vr === r && vc === c);

    if (isMoveTarget && selected) {
      const [fromR, fromC] = selected;
      const movingPiece = board[fromR][fromC];
      
      const targetPiece = board[r][c];
      const capturedPieceType = targetPiece ? targetPiece.type : undefined;

      if (targetPiece !== null) {
        setExplosion([r, c]);
      }
      
      const newBoard = applyMove(board, fromR, fromC, r, c);

      if (castlingRights && movingPiece && onCastlingRightsChange) {
        const newRights = updateCastlingRights(castlingRights, fromR, fromC, movingPiece);
        onCastlingRightsChange(newRights);
      }

      const piece = newBoard[r][c];
      if (piece?.type === 'pawn' && (r === 0 || r === 7)) {
        pendingMoveRef.current = { from: [fromR, fromC], to: [r, c] };
        setPendingPromotion({
          board: newBoard,
          position: [r, c],
          color: piece.color,
          capturedPieceType
        } as any);
        return;
      }

      if (onRawMove) {
        onRawMove({ from: [fromR, fromC], to: [r, c] });
      }
      onMove(newBoard, turn === 'w' ? 'b' : 'w', capturedPieceType);
      setSelected(null);
      setValidMoves([]);
    } else if (clickedPiece && clickedPiece.color === turn) {
      if (isSelectedSquare) {
        setSelected(null);
        setValidMoves([]);
      } else {
        setSelected([r, c]);
        setValidMoves(getValidMoves(board, r, c, castlingRights));
      }
    } else {
      setSelected(null);
      setValidMoves([]);
    }
  };

  return (
    <div className="relative aspect-square w-full max-w-[600px] mx-auto rounded-lg border-4 border-muted shadow-2xl bg-zinc-900">
      <div className="absolute inset-0 overflow-hidden rounded-md">
      <div 
        className="grid grid-cols-8 grid-rows-8 h-full w-full bg-cover bg-center"
        style={{ backgroundImage: boardTheme.backgroundImage }}
      >
        {board.map((row: (any)[], r: number) =>
          row.map((piece: any, c: number) => {
            const isDark = (r + c) % 2 === 1;
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isValidMove = validMoves.some(([vr, vc]) => vr === r && vc === c);
            const isCapture = isValidMove && piece !== null;
            const isCastle = isValidMove && selected && isCastlingMove(selected[0], selected[1], r, c, board);

            return (
              <div
                key={`${r}-${c}`}
                data-testid={`square-${r}-${c}`}
                onClick={() => handleSquareClick(r, c)}
                style={{
                  backgroundColor: boardTheme.backgroundImage 
                    ? (isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.1)') 
                    : (isDark ? boardTheme.darkColor : boardTheme.lightColor),
                }}
                className={cn(
                  "relative flex items-center justify-center cursor-pointer transition-colors duration-200",
                  isSelected && "ring-inset ring-4 ring-yellow-400 z-10",
                  isValidMove && !isCapture && !isCastle && "after:content-[''] after:absolute after:w-4 after:h-4 after:bg-green-500/50 after:rounded-full",
                  isCastle && "ring-inset ring-4 ring-blue-400 after:content-[''] after:absolute after:w-4 after:h-4 after:bg-blue-400/50 after:rounded-full",
                  isCapture && "ring-inset ring-4 ring-red-500 bg-red-500/20"
                )}
              >
                {c === 0 && (
                  <span className={`absolute left-0.5 top-0 text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {8 - r}
                  </span>
                )}
                {r === 7 && (
                  <span className={`absolute right-0.5 bottom-0 text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {String.fromCharCode(97 + c)}
                  </span>
                )}

                <AnimatePresence mode="popLayout">
                  {piece && (
                    <motion.div
                      layoutId={`piece-${r}-${c}`}
                      className="w-full h-full p-1 pointer-events-none"
                    >
                      <PieceIcon piece={piece} className="w-full h-full pointer-events-none" pieceStyle={piece.color === 'w' ? boardTheme?.heroPieceStyle : boardTheme?.villainPieceStyle} />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {explosion && explosion[0] === r && explosion[1] === c && (
                  <ExplosionEffect onComplete={() => setExplosion(null)} />
                )}
              </div>
            );
          })
        )}
      </div>
      </div>

      <AnimatePresence>
        {pendingPromotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center z-50"
            data-testid="promotion-modal"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-card rounded-lg p-4 shadow-2xl border-2 border-primary"
            >
              <p className="text-center text-sm font-bold mb-3 text-foreground">Choose Promotion</p>
              <div className="flex gap-3">
                {PROMOTION_PIECES.map((pieceType) => (
                  <button
                    key={pieceType}
                    onClick={() => handlePromotion(pieceType)}
                    className="flex flex-col items-center gap-1 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border-2 border-transparent hover:border-yellow-400"
                    data-testid={`promote-${pieceType}`}
                  >
                    <div className="w-14 h-14 flex items-center justify-center">
                      <PieceIcon piece={{ type: pieceType, color: pendingPromotion.color }} className="w-full h-full" pieceStyle={pendingPromotion.color === 'w' ? boardTheme?.heroPieceStyle : boardTheme?.villainPieceStyle} />
                    </div>
                    <span className="text-xs text-white capitalize">{pieceType}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
