import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import GameRoom from "@/pages/GameRoom";
import Leaderboard from "@/pages/Leaderboard";
import Shop from "@/pages/Shop";
import OnlineMatch from "@/pages/OnlineMatch";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game/:id" component={GameRoom} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/shop" component={Shop} />
      <Route path="/online" component={OnlineMatch} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
