import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import GameRoom from "@/pages/GameRoom";
import Leaderboard from "@/pages/Leaderboard";
import Shop from "@/pages/Shop";
import OnlineMatch from "@/pages/OnlineMatch";
import AuthPage from "@/pages/AuthPage";
import CustomArmyBuilder from "@/pages/CustomArmyBuilder";
import Tutorial from "@/pages/Tutorial";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game/:id" component={GameRoom} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/shop" component={Shop} />
      <Route path="/online" component={OnlineMatch} />
      <Route path="/custom-army" component={CustomArmyBuilder} />
      <Route path="/tutorial" component={Tutorial} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
