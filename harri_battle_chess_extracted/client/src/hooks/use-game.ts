import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { INITIAL_BOARD, BoardState, isGameOver } from "../lib/chess-engine";
import { useToast } from "@/hooks/use-toast";
import { type Piece } from "@shared/schema";

export function useGame(id?: string) {
  return useQuery({
    queryKey: [api.games.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.games.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load game");
      return api.games.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateGame() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ gameMode = 'local' }: { gameMode?: string } = {}) => {
      const res = await fetch(api.games.create.path, {
        method: api.games.create.method,
        body: JSON.stringify({ gameMode }),
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to start game");
      return api.games.create.responses[201].parse(await res.json());
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not create game session.",
        variant: "destructive",
      });
    }
  });
}

export function useUpdateGame() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, board, turn, isGameOver, winner }: { 
      id: number, 
      board: BoardState, 
      turn: 'w' | 'b',
      isGameOver?: boolean,
      winner?: string | null
    }) => {
      const url = buildUrl(api.games.update.path, { id });
      const res = await fetch(url, {
        method: api.games.update.method,
        body: JSON.stringify({ board, turn, isGameOver, winner }),
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update game");
      return api.games.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.games.get.path, data.id.toString()] });
      
      // If game just ended, show toast
      if (data.isGameOver) {
        toast({
          title: "GAME OVER!",
          description: data.winner === 'w' ? "Heroes Win!" : "Villains Win!",
          className: "bg-accent text-accent-foreground border-none font-comic text-xl",
        });
      }
    },
    onError: () => {
      toast({
        title: "Sync Error",
        description: "Failed to save move to server.",
        variant: "destructive",
      });
    }
  });
}
