# Harri Battle Chess

## Overview

A Harri-themed chess game web application with local multiplayer, AI opponent modes, and online multiplayer via Lichess. Players can enjoy chess with custom-themed pieces (Heroes vs Villains), featuring smooth animations and a modern UI. The application supports multiple difficulty levels for AI opponents, includes a special "Harri Smash" challenge mode, and allows online play against real opponents through the Lichess Board API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and data fetching
- **Styling**: Tailwind CSS with custom Marvel-themed color palette
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Animations**: Framer Motion for piece movement and UI transitions
- **Build Tool**: Vite with HMR support

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for game CRUD operations
- **Validation**: Zod schemas for input validation
- **Development**: Hot module replacement via Vite middleware

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema**: 
  - `games` table storing board state as JSONB
  - `leaderboard` table for player profiles with XP tracking
- **Object Storage**: Replit Object Storage for player photo uploads
- **Migrations**: Drizzle Kit for schema management (`db:push` command)

### Leaderboard & XP System
- Players can add themselves to the leaderboard with a name and optional photo
- Players can select themselves before playing to track XP
- XP is awarded atomically based on outcome: Win = 5 XP, Loss = 2 XP, Draw = 1 XP (uses server-side SQL increment)
- XP is displayed in the top-right corner during games
- Current player is stored in localStorage (`currentPlayerId`)

### Shop System
- Players can spend XP to buy chess boards and accessories
- **Database Tables**:
  - `shop_items` - Catalog of items (boards, accessories) with prices
  - `player_purchases` - Tracks what each player owns and has equipped
- **Item Types**:
  - `board` - Custom board color themes
  - `accessory` - Visual effects (confetti, lightning, crown)
- **Purchase Flow**:
  - XP is deducted atomically when purchasing
  - Players can only buy items once (duplicate prevention)
  - Equipped items are applied in-game automatically
- **Routes**: `/shop` for browsing and purchasing

### Game Logic
- **Chess Engine**: Client-side implementation in `chess-engine.ts`
  - Full chess rules: check, checkmate, stalemate detection
  - Legal move filtering (prevents moves that leave king in check)
  - Proper pawn attack detection (diagonal only)
- **AI System**: Minimax algorithm with alpha-beta pruning in `chess-ai.ts`
  - Easy: Random moves
  - Medium: Single-ply evaluation with randomness
  - Hard: Depth-2 minimax with position evaluation
- **Piece Representation**: 2D array board with piece objects containing type and color

### Key Design Decisions

1. **Client-side Chess Logic**: Chess validation and move generation happen in the browser for immediate responsiveness, with server storing game state for persistence.

2. **JSONB Board Storage**: Board state stored as JSON in PostgreSQL allows flexible schema while maintaining query capabilities.

3. **Shared Type Definitions**: Types and schemas in `/shared` directory used by both client and server, ensuring type safety across the stack.

4. **API Route Contracts**: Routes defined in `shared/routes.ts` with Zod schemas for type-safe API contracts.

## External Dependencies

### Database
- PostgreSQL database (requires `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database operations

### UI Libraries
- Radix UI primitives for accessible components
- Framer Motion for animations
- Lucide React for icons

### Development Tools
- Vite for development server and bundling
- esbuild for production server bundling
- TypeScript for type checking

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal` for error display
- `@replit/vite-plugin-cartographer` and `@replit/vite-plugin-dev-banner` for development