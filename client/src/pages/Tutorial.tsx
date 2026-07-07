import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieceIcon } from "@/components/PieceIcon";
import { ArrowLeft, BookOpen, Shield, Zap, Swords } from "lucide-react";
import { Piece } from "@/lib/chess-engine";

const PIECE_TUTORIALS = [
  {
    type: "king",
    title: "King (Captain America / Red Skull)",
    description: "The most important piece. If your King is checkmated, you lose! Moves exactly one square horizontally, vertically, or diagonally.",
  },
  {
    type: "queen",
    title: "Queen (Wonder Woman / Hela)",
    description: "The most powerful piece. Moves any number of vacant squares diagonally, horizontally, or vertically.",
  },
  {
    type: "rook",
    title: "Rook (Spider-Man / Venom)",
    description: "Moves any number of vacant squares vertically or horizontally. Also participates in castling with the King.",
  },
  {
    type: "bishop",
    title: "Bishop (Dr. Strange / Loki)",
    description: "Moves any number of vacant squares in any diagonal direction.",
  },
  {
    type: "knight",
    title: "Knight (Black Panther / Killmonger)",
    description: "Moves in an 'L' shape: two squares in one direction and then one square at a right angle. The only piece that can jump over others!",
  },
  {
    type: "pawn",
    title: "Pawn (Ant-Man / Ultron Drone)",
    description: "Moves forward one square (or two on its first move). Captures diagonally one square forward.",
  },
  {
    type: "copycat",
    title: "Copycat (Echo / Taskmaster)",
    description: "A special custom piece! It copies the movement capabilities of the last piece your opponent moved.",
  }
];

export default function Tutorial() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-comic">How to Play</h1>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="basics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basics">Chess Basics</TabsTrigger>
            <TabsTrigger value="pieces">Heroes & Villains</TabsTrigger>
            <TabsTrigger value="modes">Game Modes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basics" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  The Objective
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Chess is a two-player strategy game played on an 8x8 checkered board.
                  One player controls the Heroes (White) and the other controls the Villains (Black).
                </p>
                <p>
                  The primary objective of the game is to <strong>Checkmate</strong> the opponent's King.
                  Checkmate occurs when the King is in a position to be captured (in "check") and there is no legal move to escape.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Special Moves
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Castling:</strong> A special defensive move involving the King and a Rook. The King moves two squares towards the Rook, and the Rook jumps over the King to the adjacent square.</li>
                  <li><strong>En Passant:</strong> If a Pawn moves two squares forward from its starting position and lands beside an opponent's Pawn, the opponent can capture it as if it only moved one square.</li>
                  <li><strong>Pawn Promotion:</strong> When a Pawn reaches the opposite end of the board, it can be promoted to any other piece (usually a Queen).</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pieces" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PIECE_TUTORIALS.map((pt) => (
                <Card key={pt.type} className="border-white/10 bg-background/50 backdrop-blur-sm">
                  <CardContent className="p-6 flex gap-4 items-start">
                    <div className="flex flex-col gap-2 shrink-0">
                      <PieceIcon 
                        piece={{ type: pt.type as Piece['type'], color: 'w' }} 
                        className="w-16 h-16"
                      />
                      <PieceIcon 
                        piece={{ type: pt.type as Piece['type'], color: 'b' }} 
                        className="w-16 h-16"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">{pt.title}</h3>
                      <p className="text-sm text-muted-foreground">{pt.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="modes" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="w-5 h-5 text-red-500" />
                  Harri Battle Chess Modes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-primary">Standard Play (Local / AI / Online)</h3>
                  <p className="text-sm text-muted-foreground">Play standard chess rules with our unique superhero and supervillain themed pieces.</p>
                </div>
                
                <div className="space-y-2 mt-4">
                  <h3 className="font-bold text-lg text-primary">Custom Army</h3>
                  <p className="text-sm text-muted-foreground">Build your own starting lineup! You have a budget of 39 points to spend on pieces (King is free). Want a board full of Knights? You can do it!</p>
                  <ul className="text-sm list-disc pl-6 text-muted-foreground mt-2">
                    <li>Pawn: 1 point</li>
                    <li>Knight / Bishop: 3 points</li>
                    <li>Rook: 5 points</li>
                    <li>Queen: 9 points</li>
                  </ul>
                </div>
                
                <div className="space-y-2 mt-4">
                  <h3 className="font-bold text-lg text-primary">Harri Smash</h3>
                  <p className="text-sm text-muted-foreground">Challenge the champion! This mode introduces chaotic elements and special rules that favor aggressive play. Only for the bravest warriors!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
