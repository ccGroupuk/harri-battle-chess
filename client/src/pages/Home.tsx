import { useCreateGame } from "@/hooks/use-game";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Skull, Zap, Bot, Users, Swords, Trophy, ShoppingBag, Globe, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { GameMode } from "@shared/schema";

type ModeOption = {
  id: GameMode;
  title: string;
  description: string;
  icon: typeof Bot;
  color: string;
};

const MODES: ModeOption[] = [
  {
    id: 'local',
    title: 'Local Battle',
    description: 'Two players, one device',
    icon: Users,
    color: 'from-blue-600 to-blue-800',
  },
  {
    id: 'ai_easy',
    title: 'AI - Easy',
    description: 'Beginner friendly bot',
    icon: Bot,
    color: 'from-green-600 to-green-800',
  },
  {
    id: 'ai_medium',
    title: 'AI - Medium',
    description: 'Balanced challenge',
    icon: Bot,
    color: 'from-yellow-600 to-yellow-800',
  },
  {
    id: 'ai_hard',
    title: 'AI - Hard',
    description: 'Expert level bot',
    icon: Bot,
    color: 'from-red-600 to-red-800',
  },
  {
    id: 'harri_smash',
    title: 'Harri Smash',
    description: 'Challenge the champion!',
    icon: Swords,
    color: 'from-purple-600 to-purple-800',
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const createGame = useCreateGame();
  const { logoutMutation, user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<GameMode>('local');

  const handleStartGame = async () => {
    try {
      const game = await createGame.mutateAsync({ gameMode: selectedMode });
      setLocation(`/game/${game.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      <div className="absolute top-4 right-4 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="bg-background/50 backdrop-blur-sm border-white/10 hover:bg-destructive/20 hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {user?.name ? `Sign out (${user.name})` : "Sign Out"}
        </Button>
      </div>
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-40">
          <img 
            src="/assets/hero.png" 
            alt="Hero Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 text-center space-y-8 max-w-3xl px-4 bg-background/60 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="space-y-2 animate-in slide-in-from-top-10 duration-700 fade-in">
          <div className="flex justify-center items-center gap-4 mb-4">
            <Shield className="w-10 h-10 md:w-12 md:h-12 text-blue-600" />
            <span className="text-xl md:text-2xl font-bold text-muted-foreground">VS</span>
            <Skull className="w-10 h-10 md:w-12 md:h-12 text-red-600" />
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-comic text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-yellow-500 to-blue-600 drop-shadow-2xl">
            HARRI BATTLE CHESS
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground tracking-widest uppercase">
            Challenge the Champion
          </p>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 animate-in slide-in-from-bottom-10 duration-700 fade-in delay-100">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <Card
                key={mode.id}
                data-testid={`mode-${mode.id}`}
                onClick={() => setSelectedMode(mode.id)}
                className={`p-3 md:p-4 cursor-pointer transition-all duration-300 border-2 ${
                  isSelected 
                    ? 'border-primary ring-2 ring-primary/50 scale-105' 
                    : 'border-transparent hover:border-muted-foreground/30'
                }`}
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${mode.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="font-bold text-xs md:text-sm">{mode.title}</h3>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">{mode.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Action */}
        <div className="pt-4 animate-in slide-in-from-bottom-10 duration-1000 fade-in delay-200 flex flex-col items-center gap-4">
          <Button
            size="lg"
            onClick={handleStartGame}
            disabled={createGame.isPending}
            data-testid="button-start-game"
            className="text-lg md:text-xl px-8 md:px-12 py-6 md:py-8 rounded-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 border-2 border-red-400 shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:shadow-[0_0_50px_rgba(220,38,38,0.7)] hover:-translate-y-1 transition-all duration-300"
          >
            {createGame.isPending ? (
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5 animate-spin" /> 
                ASSEMBLING...
              </span>
            ) : (
              "ASSEMBLE & FIGHT"
            )}
          </Button>
          
          <Link href="/online">
            <Button
              size="lg"
              data-testid="button-play-online"
              className="text-lg px-8 py-6 rounded-2xl font-bold bg-gradient-to-r from-[#00ff88] to-[#00cc66] text-black border-2 border-[#00ff88]/50 shadow-[0_0_30px_rgba(0,255,136,0.3)] hover:shadow-[0_0_50px_rgba(0,255,136,0.5)] hover:-translate-y-1 transition-all duration-300"
            >
              <Globe className="w-5 h-5 mr-2" />
              Play Random Online
            </Button>
          </Link>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/leaderboard">
              <Button
                variant="outline"
                size="lg"
                data-testid="button-leaderboard"
                className="flex items-center gap-2 text-yellow-400 border-yellow-400/50 hover:bg-yellow-400/10"
              >
                <Trophy className="w-5 h-5" />
                Leaderboard
              </Button>
            </Link>
            <Link href="/shop">
              <Button
                variant="outline"
                size="lg"
                data-testid="button-shop"
                className="flex items-center gap-2 text-purple-400 border-purple-400/50 hover:bg-purple-400/10"
              >
                <ShoppingBag className="w-5 h-5" />
                Shop
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
