const LICHESS_BASE = 'https://lichess.org';
const CLIENT_ID = 'harri-battle-chess';
const REDIRECT_URI = () => `${window.location.origin}/lichess/callback`;
const SCOPES = 'board:play';

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr as unknown as number[], (b: number) => chars[b % chars.length]).join('');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(plain));
}

function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function getLichessToken(): string | null {
  return localStorage.getItem('lichess_token');
}

export function getLichessUser(): string | null {
  return localStorage.getItem('lichess_user');
}

export function isLichessLoggedIn(): boolean {
  return !!getLichessToken();
}

export function lichessLogout(): void {
  localStorage.removeItem('lichess_token');
  localStorage.removeItem('lichess_user');
  localStorage.removeItem('lichess_code_verifier');
}

export async function initLichessLogin(): Promise<void> {
  const codeVerifier = generateRandomString(64);
  const state = generateRandomString(32);
  localStorage.setItem('lichess_code_verifier', codeVerifier);
  localStorage.setItem('lichess_oauth_state', state);

  const challengeBuffer = await sha256(codeVerifier);
  const codeChallenge = base64URLEncode(challengeBuffer);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI(),
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
  });

  window.location.href = `${LICHESS_BASE}/oauth?${params.toString()}`;
}

export async function handleLichessCallback(code: string, returnedState?: string): Promise<boolean> {
  const codeVerifier = localStorage.getItem('lichess_code_verifier');
  if (!codeVerifier) return false;

  const savedState = localStorage.getItem('lichess_oauth_state');
  if (savedState && returnedState && savedState !== returnedState) return false;

  try {
    const res = await fetch(`${LICHESS_BASE}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        code_verifier: codeVerifier,
        redirect_uri: REDIRECT_URI(),
        client_id: CLIENT_ID,
      }).toString(),
    });

    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem('lichess_token', data.access_token);
    localStorage.removeItem('lichess_code_verifier');
    localStorage.removeItem('lichess_oauth_state');

    const userRes = await fetch(`${LICHESS_BASE}/api/account`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (userRes.ok) {
      const user = await userRes.json();
      localStorage.setItem('lichess_user', user.username);
    }

    return true;
  } catch {
    return false;
  }
}

export async function createSeek(
  time: number = 5,
  increment: number = 3
): Promise<AbortController> {
  const token = getLichessToken();
  if (!token) throw new Error('Not logged in');

  const controller = new AbortController();

  fetch(`${LICHESS_BASE}/api/board/seek`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      time: time.toString(),
      increment: increment.toString(),
      rated: 'false',
      variant: 'standard',
      color: 'random',
    }).toString(),
    signal: controller.signal,
  }).catch(() => {});

  return controller;
}

export interface LichessGameState {
  type: string;
  moves: string;
  wtime: number;
  btime: number;
  winc: number;
  binc: number;
  status: string;
  winner?: string;
}

export interface LichessGameFull {
  type: string;
  id: string;
  white: { id: string; name: string; rating?: number };
  black: { id: string; name: string; rating?: number };
  clock: { initial: number; increment: number };
  state: LichessGameState;
}

export type LichessStreamEvent =
  | { type: 'gameFull'; data: LichessGameFull }
  | { type: 'gameState'; data: LichessGameState }
  | { type: 'chatLine'; data: unknown };

export async function streamEvents(
  onGameStart: (gameId: string) => void,
  signal: AbortSignal
): Promise<void> {
  const token = getLichessToken();
  if (!token) throw new Error('Not logged in');

  const res = await fetch(`${LICHESS_BASE}/api/stream/event`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!res.ok || !res.body) throw new Error('Failed to stream events');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const event = JSON.parse(trimmed);
        if (event.type === 'gameStart') {
          onGameStart(event.game.gameId || event.game.id);
        }
      } catch {
        continue;
      }
    }
  }
}

export async function streamGame(
  gameId: string,
  onEvent: (event: LichessStreamEvent) => void,
  signal: AbortSignal
): Promise<void> {
  const token = getLichessToken();
  if (!token) throw new Error('Not logged in');

  const res = await fetch(`${LICHESS_BASE}/api/board/game/stream/${gameId}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!res.ok || !res.body) throw new Error('Failed to stream game');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const event = JSON.parse(trimmed);
        if (event.type === 'gameFull') {
          onEvent({ type: 'gameFull', data: event as LichessGameFull });
        } else if (event.type === 'gameState') {
          onEvent({ type: 'gameState', data: event as LichessGameState });
        } else if (event.type === 'chatLine') {
          onEvent({ type: 'chatLine', data: event });
        }
      } catch {
        continue;
      }
    }
  }
}

export async function makeMove(gameId: string, uci: string): Promise<boolean> {
  const token = getLichessToken();
  if (!token) return false;

  const res = await fetch(`${LICHESS_BASE}/api/board/game/${gameId}/move/${uci}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.ok;
}

export async function resignGame(gameId: string): Promise<boolean> {
  const token = getLichessToken();
  if (!token) return false;

  const res = await fetch(`${LICHESS_BASE}/api/board/game/${gameId}/resign`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.ok;
}

export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
