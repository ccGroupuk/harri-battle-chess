import { Piece, HERO_NAMES } from "@/lib/chess-engine";
import { motion } from "framer-motion";

interface PieceIconProps {
  piece: Piece;
  className?: string;
  desaturated?: boolean;
  pieceStyle?: { textureUrl?: string; useClassicSvg?: boolean };
}

const PIECE_LETTERS: Record<string, string> = {
  king: 'K',
  queen: 'Q',
  bishop: 'B',
  knight: 'N',
  rook: 'R',
  pawn: 'P',
  copycat: 'C',
};

function CaptainAmericaSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="38" fill="#1e40af" stroke="#60a5fa" strokeWidth="3"/>
      <circle cx="50" cy="50" r="28" fill="#dc2626"/>
      <circle cx="50" cy="50" r="18" fill="#1e40af"/>
      <polygon points="50,35 53,45 63,45 55,51 58,61 50,55 42,61 45,51 37,45 47,45" fill="#f8fafc" stroke="#93c5fd" strokeWidth="1"/>
      <circle cx="50" cy="20" r="6" fill="#60a5fa" opacity="0.6"/>
      <circle cx="50" cy="80" r="6" fill="#60a5fa" opacity="0.6"/>
      <circle cx="20" cy="50" r="6" fill="#60a5fa" opacity="0.6"/>
      <circle cx="80" cy="50" r="6" fill="#60a5fa" opacity="0.6"/>
    </svg>
  );
}

function RedSkullSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="48" rx="30" ry="35" fill="#7f1d1d"/>
      <ellipse cx="50" cy="42" rx="26" ry="28" fill="#991b1b"/>
      <ellipse cx="38" cy="38" rx="8" ry="6" fill="#0a0a0a"/>
      <ellipse cx="62" cy="38" rx="8" ry="6" fill="#0a0a0a"/>
      <ellipse cx="38" cy="37" rx="4" ry="3" fill="#ef4444"/>
      <ellipse cx="62" cy="37" rx="4" ry="3" fill="#ef4444"/>
      <path d="M38,58 Q44,52 50,58 Q56,52 62,58" fill="none" stroke="#0a0a0a" strokeWidth="2.5"/>
      <line x1="42" y1="55" x2="42" y2="62" stroke="#0a0a0a" strokeWidth="1.5"/>
      <line x1="47" y1="54" x2="47" y2="61" stroke="#0a0a0a" strokeWidth="1.5"/>
      <line x1="53" y1="54" x2="53" y2="61" stroke="#0a0a0a" strokeWidth="1.5"/>
      <line x1="58" y1="55" x2="58" y2="62" stroke="#0a0a0a" strokeWidth="1.5"/>
      <path d="M24,50 Q20,35 30,25" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.5"/>
      <path d="M76,50 Q80,35 70,25" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.5"/>
    </svg>
  );
}

function WonderWomanSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M30,25 L50,10 L70,25 L65,30 L50,18 L35,30 Z" fill="#eab308" stroke="#fbbf24" strokeWidth="1.5"/>
      <ellipse cx="50" cy="50" rx="22" ry="28" fill="#1e40af"/>
      <polygon points="50,32 53,42 62,42 55,48 57,58 50,52 43,58 45,48 38,42 47,42" fill="#eab308"/>
      <path d="M28,50 Q20,50 18,42 L28,45 Z" fill="#dc2626"/>
      <path d="M72,50 Q80,50 82,42 L72,45 Z" fill="#dc2626"/>
      <path d="M35,70 L50,80 L65,70" fill="none" stroke="#eab308" strokeWidth="2"/>
      <path d="M38,65 L50,72 L62,65" fill="none" stroke="#eab308" strokeWidth="1.5"/>
    </svg>
  );
}

function HelaSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="55" rx="20" ry="25" fill="#1a1a2e"/>
      <path d="M50,30 L35,8 L42,28 L30,5 L40,25 L25,10 L38,28 Z" fill="#064e3b" stroke="#10b981" strokeWidth="1"/>
      <path d="M50,30 L65,8 L58,28 L70,5 L60,25 L75,10 L62,28 Z" fill="#064e3b" stroke="#10b981" strokeWidth="1"/>
      <ellipse cx="42" cy="48" rx="5" ry="4" fill="#10b981"/>
      <ellipse cx="58" cy="48" rx="5" ry="4" fill="#10b981"/>
      <ellipse cx="42" cy="48" rx="2.5" ry="2" fill="#0a0a0a"/>
      <ellipse cx="58" cy="48" rx="2.5" ry="2" fill="#0a0a0a"/>
      <path d="M42,62 Q50,68 58,62" fill="none" stroke="#10b981" strokeWidth="2"/>
      <path d="M30,40 L25,35" stroke="#064e3b" strokeWidth="3"/>
      <path d="M70,40 L75,35" stroke="#064e3b" strokeWidth="3"/>
    </svg>
  );
}

function DrStrangeSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="32" fill="none" stroke="#f59e0b" strokeWidth="3"/>
      <circle cx="50" cy="50" r="24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 3"/>
      <path d="M50,18 L50,82" stroke="#f59e0b" strokeWidth="1.5" opacity="0.5"/>
      <path d="M18,50 L82,50" stroke="#f59e0b" strokeWidth="1.5" opacity="0.5"/>
      <ellipse cx="50" cy="50" rx="12" ry="15" fill="#1e3a5f"/>
      <path d="M42,42 L50,35 L58,42" fill="none" stroke="#22d3ee" strokeWidth="2"/>
      <circle cx="50" cy="50" r="5" fill="#22d3ee" opacity="0.8"/>
      <circle cx="50" cy="50" r="3" fill="#f0fdfa"/>
      <path d="M30,30 Q35,40 38,50" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6"/>
      <path d="M70,30 Q65,40 62,50" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6"/>
      <path d="M30,70 Q35,60 38,50" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6"/>
      <path d="M70,70 Q65,60 62,50" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6"/>
    </svg>
  );
}

function LokiSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M40,70 L50,85 L60,70" fill="#064e3b"/>
      <ellipse cx="50" cy="52" rx="20" ry="24" fill="#064e3b" stroke="#10b981" strokeWidth="1.5"/>
      <path d="M38,30 L32,5 L44,28 Z" fill="#eab308" stroke="#fbbf24" strokeWidth="1"/>
      <path d="M62,30 L68,5 L56,28 Z" fill="#eab308" stroke="#fbbf24" strokeWidth="1"/>
      <path d="M35,30 Q50,22 65,30" fill="#064e3b" stroke="#10b981" strokeWidth="1.5"/>
      <ellipse cx="42" cy="46" rx="5" ry="4" fill="#10b981"/>
      <ellipse cx="58" cy="46" rx="5" ry="4" fill="#10b981"/>
      <ellipse cx="42" cy="46" rx="2" ry="2" fill="#0a0a0a"/>
      <ellipse cx="58" cy="46" rx="2" ry="2" fill="#0a0a0a"/>
      <path d="M44,60 Q50,65 56,60" fill="none" stroke="#10b981" strokeWidth="1.5"/>
    </svg>
  );
}

function BlackPantherSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="52" rx="24" ry="28" fill="#1e1b4b"/>
      <path d="M26,38 L20,18 L36,32 Z" fill="#1e1b4b" stroke="#a78bfa" strokeWidth="1.5"/>
      <path d="M74,38 L80,18 L64,32 Z" fill="#1e1b4b" stroke="#a78bfa" strokeWidth="1.5"/>
      <path d="M35,44 L42,40 L50,44 L58,40 L65,44" fill="none" stroke="#a78bfa" strokeWidth="2"/>
      <ellipse cx="40" cy="48" rx="5" ry="3.5" fill="#c4b5fd"/>
      <ellipse cx="60" cy="48" rx="5" ry="3.5" fill="#c4b5fd"/>
      <ellipse cx="40" cy="48" rx="2" ry="2" fill="#0a0a0a"/>
      <ellipse cx="60" cy="48" rx="2" ry="2" fill="#0a0a0a"/>
      <path d="M44,60 Q50,56 56,60" fill="none" stroke="#a78bfa" strokeWidth="1.5"/>
      <path d="M50,56 L50,52" stroke="#a78bfa" strokeWidth="1"/>
      <path d="M32,55 Q28,65 35,72" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.5"/>
      <path d="M68,55 Q72,65 65,72" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.5"/>
    </svg>
  );
}

function KillmongerSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="52" rx="24" ry="28" fill="#1c1917"/>
      <path d="M26,38 L20,18 L36,32 Z" fill="#1c1917" stroke="#f59e0b" strokeWidth="1.5"/>
      <path d="M74,38 L80,18 L64,32 Z" fill="#1c1917" stroke="#f59e0b" strokeWidth="1.5"/>
      <ellipse cx="40" cy="46" rx="6" ry="4" fill="#f59e0b"/>
      <ellipse cx="60" cy="46" rx="6" ry="4" fill="#f59e0b"/>
      <ellipse cx="40" cy="46" rx="2.5" ry="2" fill="#0a0a0a"/>
      <ellipse cx="60" cy="46" rx="2.5" ry="2" fill="#0a0a0a"/>
      <circle cx="32" cy="55" r="2" fill="#f59e0b" opacity="0.6"/>
      <circle cx="38" cy="62" r="2" fill="#f59e0b" opacity="0.6"/>
      <circle cx="45" cy="67" r="2" fill="#f59e0b" opacity="0.6"/>
      <circle cx="55" cy="67" r="2" fill="#f59e0b" opacity="0.6"/>
      <circle cx="62" cy="62" r="2" fill="#f59e0b" opacity="0.6"/>
      <circle cx="68" cy="55" r="2" fill="#f59e0b" opacity="0.6"/>
      <circle cx="35" cy="40" r="1.5" fill="#f59e0b" opacity="0.4"/>
      <circle cx="65" cy="40" r="1.5" fill="#f59e0b" opacity="0.4"/>
      <path d="M42,58 Q50,63 58,58" fill="none" stroke="#f59e0b" strokeWidth="2"/>
    </svg>
  );
}

function SpiderManSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="50" rx="28" ry="32" fill="#dc2626"/>
      <path d="M50,18 Q30,35 22,55 Q30,75 50,82 Q70,75 78,55 Q70,35 50,18" fill="#dc2626" stroke="#991b1b" strokeWidth="1"/>
      <path d="M50,18 L50,82" stroke="#1e1b4b" strokeWidth="1.5"/>
      <path d="M22,50 Q50,45 78,50" stroke="#1e1b4b" strokeWidth="1.5"/>
      <path d="M25,35 Q50,30 75,35" stroke="#1e1b4b" strokeWidth="1.2"/>
      <path d="M25,65 Q50,60 75,65" stroke="#1e1b4b" strokeWidth="1.2"/>
      <path d="M50,18 Q35,40 22,55" stroke="#1e1b4b" strokeWidth="1.2"/>
      <path d="M50,18 Q65,40 78,55" stroke="#1e1b4b" strokeWidth="1.2"/>
      <ellipse cx="38" cy="42" rx="9" ry="7" fill="white" stroke="#1e1b4b" strokeWidth="2"/>
      <ellipse cx="62" cy="42" rx="9" ry="7" fill="white" stroke="#1e1b4b" strokeWidth="2"/>
    </svg>
  );
}

function VenomSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="50" rx="30" ry="34" fill="#0f0f0f"/>
      <ellipse cx="50" cy="48" rx="28" ry="30" fill="#1a1a1a"/>
      <ellipse cx="36" cy="38" rx="10" ry="8" fill="white"/>
      <ellipse cx="64" cy="38" rx="10" ry="8" fill="white"/>
      <ellipse cx="38" cy="38" rx="4" ry="5" fill="#0f0f0f"/>
      <ellipse cx="62" cy="38" rx="4" ry="5" fill="#0f0f0f"/>
      <path d="M28,58 Q32,52 36,58 Q40,52 44,58 Q48,52 50,58 Q52,52 56,58 Q60,52 64,58 Q68,52 72,58" fill="white" stroke="#e5e5e5" strokeWidth="0.5"/>
      <path d="M28,58 Q32,64 36,58 Q40,64 44,58 Q48,64 50,58 Q52,64 56,58 Q60,64 64,58 Q68,64 72,58" fill="white" stroke="#e5e5e5" strokeWidth="0.5"/>
      <path d="M25,55 L20,50" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round"/>
      <path d="M75,55 L80,50" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );
}

function AntManSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="50" rx="22" ry="26" fill="#991b1b"/>
      <path d="M28,50 Q50,30 72,50" fill="#4a1010" stroke="#dc2626" strokeWidth="1"/>
      <ellipse cx="40" cy="46" rx="8" ry="6" fill="#171717" stroke="#6b7280" strokeWidth="1.5"/>
      <ellipse cx="60" cy="46" rx="8" ry="6" fill="#171717" stroke="#6b7280" strokeWidth="1.5"/>
      <ellipse cx="40" cy="46" rx="4" ry="3" fill="#93c5fd" opacity="0.8"/>
      <ellipse cx="60" cy="46" rx="4" ry="3" fill="#93c5fd" opacity="0.8"/>
      <path d="M36,58 Q42,54 50,58 Q58,54 64,58" fill="none" stroke="#6b7280" strokeWidth="1.5"/>
      <line x1="50" y1="24" x2="42" y2="14" stroke="#6b7280" strokeWidth="2"/>
      <line x1="50" y1="24" x2="58" y2="14" stroke="#6b7280" strokeWidth="2"/>
      <circle cx="42" cy="13" r="2.5" fill="#6b7280"/>
      <circle cx="58" cy="13" r="2.5" fill="#6b7280"/>
    </svg>
  );
}

function UltronDroneSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <ellipse cx="50" cy="50" rx="22" ry="26" fill="#374151"/>
      <path d="M28,42 L50,28 L72,42" fill="#1f2937" stroke="#ef4444" strokeWidth="1.5"/>
      <path d="M30,48 Q50,42 70,48" fill="#4b5563" stroke="#6b7280" strokeWidth="1"/>
      <ellipse cx="40" cy="46" rx="7" ry="5" fill="#0a0a0a"/>
      <ellipse cx="60" cy="46" rx="7" ry="5" fill="#0a0a0a"/>
      <ellipse cx="40" cy="46" rx="4" ry="3" fill="#ef4444"/>
      <ellipse cx="60" cy="46" rx="4" ry="3" fill="#ef4444"/>
      <path d="M38,60 L44,56 L50,60 L56,56 L62,60" fill="none" stroke="#ef4444" strokeWidth="1.5"/>
      <path d="M40,64 L46,60 L50,64 L54,60 L60,64" fill="none" stroke="#ef4444" strokeWidth="1"/>
      <line x1="50" y1="28" x2="50" y2="20" stroke="#6b7280" strokeWidth="2"/>
      <circle cx="50" cy="18" r="3" fill="#ef4444" opacity="0.8"/>
    </svg>
  );
}

function EchoSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M30,70 C30,30 70,30 70,70" fill="none" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
      <circle cx="50" cy="40" r="15" fill="#f8fafc" />
      <path d="M45,45 Q50,55 55,45" fill="none" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="43" cy="35" r="2" fill="#0a0a0a" />
      <circle cx="57" cy="35" r="2" fill="#0a0a0a" />
      <path d="M35,60 L45,30 M65,60 L55,30" stroke="#eab308" strokeWidth="2" opacity="0.8" />
    </svg>
  );
}

function TaskmasterSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M25,50 C25,20 75,20 75,50 L75,80 L25,80 Z" fill="#f97316" />
      <ellipse cx="50" cy="55" rx="20" ry="25" fill="#171717" />
      <circle cx="42" cy="50" r="4" fill="#ef4444" />
      <circle cx="58" cy="50" r="4" fill="#ef4444" />
      <path d="M40,70 L60,70" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
      <path d="M45,65 L45,75 M50,65 L50,75 M55,65 L55,75" stroke="#f8fafc" strokeWidth="2" />
    </svg>
  );
}

// ---- Classic Staunton set ----
// One generator per colour so white and black can never drift apart.
const CLASSIC_COLORS: Record<'w' | 'b', { fill: string; stroke: string; detail: string }> = {
  w: { fill: '#f4efe4', stroke: '#2c2118', detail: '#2c2118' },
  b: { fill: '#2c2c2c', stroke: '#0c0c0c', detail: '#e6e0d4' },
};

function ClassicPieceSVG({ type, color }: { type: string; color: 'w' | 'b' }) {
  const { fill, stroke, detail } = CLASSIC_COLORS[color];
  const base = <path d="M12,52 H48 V48 C48,45 44.5,44 41,44 H19 C15.5,44 12,45 12,48 Z" />;

  const shapes: Record<string, JSX.Element> = {
    king: (
      <>
        <path d="M30,4 V15 M25,9.5 H35" stroke={stroke} strokeWidth={3.5} fill="none" />
        <path d="M18,30 L20.5,18 L25,25 L30,15 L35,25 L39.5,18 L42,30 Z" />
        <path d="M18,30 H42 L40,36 H20 Z" />
        <path d="M22.5,36 C22.5,41 19.5,43 17,44 H43 C40.5,43 37.5,41 37.5,36 Z" />
        {base}
        <path d="M22,48 H38" stroke={detail} strokeWidth={1.5} fill="none" />
      </>
    ),
    queen: (
      <>
        <path d="M13,22 L18,38 H42 L47,22 L41,28 L38,15 L34,26 L30,11 L26,26 L22,15 L19,28 Z" />
        <circle cx="13" cy="21" r="3" />
        <circle cx="22" cy="14" r="3" />
        <circle cx="30" cy="10" r="3.5" />
        <circle cx="38" cy="14" r="3" />
        <circle cx="47" cy="21" r="3" />
        <path d="M18,38 H42 L40,44 H20 Z" />
        {base}
        <path d="M22,48 H38" stroke={detail} strokeWidth={1.5} fill="none" />
      </>
    ),
    rook: (
      <>
        <path d="M14,11 H21 V16 H26.5 V11 H33.5 V16 H39 V11 H46 V24 H14 Z" />
        <path d="M18,24 H42 L39.5,40 H20.5 Z" />
        <path d="M16,40 H44 V45 H16 Z" />
        {base}
      </>
    ),
    bishop: (
      <>
        <circle cx="30" cy="9" r="3.2" />
        <path d="M30,13 C36.5,19 40,25 40,30.5 C40,35.5 35.5,39 30,39 C24.5,39 20,35.5 20,30.5 C20,25 23.5,19 30,13 Z" />
        <path d="M30,20 V32 M24.5,26 H35.5" stroke={detail} strokeWidth={1.8} fill="none" />
        <path d="M21,39 H39 L37,44 H23 Z" />
        {base}
      </>
    ),
    knight: (
      <>
        <path d="M22,44 C22,38 24,35.5 22.5,32 L15.5,31 C13,29 14,25.5 17,23.5 L26,18.5 C26.5,13.5 29.5,10 33.5,8.5 L35,13 L39.5,7 C45,12 47,20 46,28 C45,36 43.5,40 42.5,44 Z" />
        <circle cx="28.5" cy="22.5" r={1.9} fill={detail} stroke="none" />
        <path d="M40,14 C36,18 33.5,23 32.5,29" stroke={detail} strokeWidth={1.6} fill="none" />
        {base}
      </>
    ),
    pawn: (
      <>
        <circle cx="30" cy="17" r="7.5" />
        <path d="M23.5,25 C23.5,31 19,37 16.5,44 H43.5 C41,37 36.5,31 36.5,25 Z" />
        {base}
      </>
    ),
    // Copycat mimics another piece, so it gets a twin-headed pawn
    copycat: (
      <>
        <circle cx="24.5" cy="17" r="6.5" />
        <circle cx="35.5" cy="17" r="6.5" />
        <path d="M23.5,25 C23.5,31 19,37 16.5,44 H43.5 C41,37 36.5,31 36.5,25 Z" />
        {base}
      </>
    ),
  };

  return (
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <g fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
        {shapes[type] || shapes.pawn}
      </g>
    </svg>
  );
}

const HERO_SVGS: Record<string, () => JSX.Element> = {
  king: CaptainAmericaSVG,
  queen: WonderWomanSVG,
  bishop: DrStrangeSVG,
  knight: BlackPantherSVG,
  rook: SpiderManSVG,
  pawn: AntManSVG,
  copycat: EchoSVG,
};

const VILLAIN_SVGS: Record<string, () => JSX.Element> = {
  king: RedSkullSVG,
  queen: HelaSVG,
  bishop: LokiSVG,
  knight: KillmongerSVG,
  rook: VenomSVG,
  pawn: UltronDroneSVG,
  copycat: TaskmasterSVG,
};

export function PieceIcon({ piece, className, desaturated, pieceStyle }: PieceIconProps) {
  if (!piece || !piece.type || !piece.color) return null;
  const isWhite = piece.color === 'w';

  const SvgMap = isWhite ? HERO_SVGS : VILLAIN_SVGS;
  const SvgComponent = SvgMap[piece.type];

  if (pieceStyle?.useClassicSvg) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`relative flex items-center justify-center ${desaturated ? 'opacity-50 grayscale' : ''} ${className || ''}`}
        style={{ filter: desaturated ? undefined : 'drop-shadow(0 2px 2px rgba(0,0,0,0.4))' }}
        title={PIECE_NAMES[piece.type] || piece.type}
        data-testid={`piece-${piece.color}-${piece.type}-classic`}
      >
        <div className="w-[92%] h-[92%]">
          <ClassicPieceSVG type={piece.type} color={isWhite ? 'w' : 'b'} />
        </div>
      </motion.div>
    );
  }

  if (!SvgComponent) return null;

  const glowStyle = isWhite
    ? "drop-shadow(0 0 4px rgba(59,130,246,0.7)) drop-shadow(0 0 8px rgba(59,130,246,0.3))"
    : "drop-shadow(0 0 4px rgba(239,68,68,0.7)) drop-shadow(0 0 8px rgba(239,68,68,0.3))";

  const borderColor = isWhite
    ? "border-blue-400/50"
    : "border-red-500/50";

  const letterColor = isWhite
    ? "text-blue-300"
    : "text-red-300";

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative flex items-center justify-center ${desaturated ? 'opacity-50 grayscale-[40%]' : ''} ${className || ''}`}
      style={{ filter: desaturated ? undefined : glowStyle }}
      title={HERO_NAMES[piece.type]?.[piece.color] || piece.type}
      data-testid={`piece-${piece.color}-${piece.type}`}
    >
      <div 
        className={`w-full h-full rounded-md border ${borderColor} bg-zinc-900/80 flex items-center justify-center relative overflow-hidden`}
        style={pieceStyle?.textureUrl ? {
          backgroundImage: `url(${pieceStyle.textureUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
        } : undefined}
      >
        <div className="w-[90%] h-[90%] opacity-90 mix-blend-screen drop-shadow-md">
          <SvgComponent />
        </div>
        <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-tl-md flex items-center justify-center bg-zinc-950/90 border-l border-t ${borderColor} z-10 shadow-[-2px_-2px_4px_rgba(0,0,0,0.5)]`}>
          <span className={`text-[11px] font-black leading-none ${letterColor}`}>
            {PIECE_LETTERS[piece.type]}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export const PIECE_NAMES: Record<string, string> = {
  king: 'King',
  queen: 'Queen',
  rook: 'Rook',
  bishop: 'Bishop',
  knight: 'Knight',
  pawn: 'Pawn',
  copycat: 'Copycat',
};

export const PIECE_SYMBOLS: Record<string, string> = {
  king: '♚',
  queen: '♛',
  rook: '♜',
  bishop: '♝',
  knight: '♞',
  pawn: '♟',
  copycat: '★',
};
