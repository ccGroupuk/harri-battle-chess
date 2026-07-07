import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ArrowLeft, Check, Sparkles, Grid3X3, Palette, Star } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ShopItem, LeaderboardEntry, PlayerPurchase } from "@shared/schema";
import { useState, useEffect } from "react";
import { PieceIcon } from "@/components/PieceIcon";

const ITEM_TYPE_ICONS: Record<string, typeof Grid3X3> = {
  board: Grid3X3,
  piece_style: Palette,
  accessory: Sparkles,
};

const ITEM_TYPE_COLORS: Record<string, string> = {
  board: 'from-blue-600 to-blue-800',
  piece_style: 'from-purple-600 to-purple-800',
  accessory: 'from-amber-600 to-amber-800',
};

export default function Shop() {
  const { toast } = useToast();
  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("currentPlayerId");
    if (stored) {
      setCurrentPlayerId(parseInt(stored, 10));
    }
  }, []);

  const { data: shopItems = [], isLoading: itemsLoading } = useQuery<ShopItem[]>({
    queryKey: ["/api/shop/items"],
  });

  const { data: currentPlayer } = useQuery<LeaderboardEntry | undefined>({
    queryKey: ["/api/leaderboard", currentPlayerId],
    enabled: !!currentPlayerId,
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard`);
      const entries: LeaderboardEntry[] = await res.json();
      return entries.find(e => e.id === currentPlayerId);
    },
  });

  const { data: purchases = [] } = useQuery<PlayerPurchase[]>({
    queryKey: ["/api/shop/purchases", currentPlayerId],
    enabled: !!currentPlayerId,
    queryFn: async () => {
      const res = await fetch(`/api/shop/purchases/${currentPlayerId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ playerId, itemId }: { playerId: number; itemId: number }) => {
      const res = await apiRequest("POST", "/api/shop/purchase", { playerId, itemId });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Item Purchased!", description: "Check your inventory to equip it." });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/purchases", currentPlayerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard", currentPlayerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
    onError: (err: Error) => {
      toast({ title: "Purchase Failed", description: err.message, variant: "destructive" });
    },
  });

  const equipMutation = useMutation({
    mutationFn: async ({ playerId, purchaseId }: { playerId: number; purchaseId: number }) => {
      const res = await apiRequest("POST", "/api/shop/equip", { playerId, purchaseId });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Item Equipped!", description: "Your new style is now active." });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/purchases", currentPlayerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/equipped", currentPlayerId] });
    },
    onError: (err: Error) => {
      toast({ title: "Equip Failed", description: err.message, variant: "destructive" });
    },
  });

  const ownedItemIds = purchases.map(p => p.itemId);
  const equippedPurchaseIds = purchases.filter(p => p.equipped).map(p => p.id);

  const handlePurchase = (itemId: number) => {
    if (!currentPlayerId) {
      toast({ 
        title: "Select a Player", 
        description: "Go to the Leaderboard to select or create a player first.",
        variant: "destructive" 
      });
      return;
    }
    purchaseMutation.mutate({ playerId: currentPlayerId, itemId });
  };

  const handleEquip = (purchaseId: number) => {
    if (!currentPlayerId) return;
    equipMutation.mutate({ playerId: currentPlayerId, purchaseId });
  };

  const getPurchaseForItem = (itemId: number) => {
    return purchases.find(p => p.itemId === itemId);
  };

  const groupedItems = shopItems.reduce((acc, item) => {
    const type = item.type as string;
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, ShopItem[]>);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-purple-500" />
              <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-amber-500">
                HARRI SHOP
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentPlayer ? (
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="font-bold text-yellow-400">{currentPlayer.xp} XP</span>
                <span className="text-muted-foreground">| {currentPlayer.name}</span>
              </div>
            ) : (
              <Link href="/leaderboard">
                <Button variant="outline" data-testid="button-select-player">
                  Select Player
                </Button>
              </Link>
            )}
          </div>
        </div>

        {itemsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : shopItems.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Shop Coming Soon</h2>
            <p className="text-muted-foreground">Check back later for awesome items!</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedItems).map(([type, items]) => {
              const Icon = ITEM_TYPE_ICONS[type] || Sparkles;
              const colorClass = ITEM_TYPE_COLORS[type] || 'from-gray-600 to-gray-800';
              
              return (
                <div key={type}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold capitalize">{type.replace('_', ' ')}s</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => {
                      const isOwned = ownedItemIds.includes(item.id);
                      const purchase = getPurchaseForItem(item.id);
                      const isEquipped = purchase ? equippedPurchaseIds.includes(purchase.id) : false;
                      const canAfford = currentPlayer ? currentPlayer.xp >= item.price : false;

                      return (
                        <Card
                          key={item.id}
                          data-testid={`shop-item-${item.id}`}
                          className={`p-4 transition-all duration-300 ${
                            isEquipped ? 'ring-2 ring-green-500 border-green-500' : ''
                          }`}
                        >
                          <div className="flex flex-col h-full">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-bold text-lg">{item.name}</h3>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              </div>
                              {isEquipped && (
                                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                                  <Check className="w-3 h-3 mr-1" />
                                  Equipped
                                </Badge>
                              )}
                              {isOwned && !isEquipped && (
                                <Badge variant="secondary">Owned</Badge>
                              )}
                            </div>

                            {item.type === 'board' && item.data && typeof item.data === 'object' ? (
                              <div className="mb-3 p-2 bg-black/20 rounded-lg">
                                {('backgroundImage' in item.data) ? (
                                  <div 
                                    className="w-full aspect-square rounded overflow-hidden border-2 border-yellow-600/50 bg-cover bg-center"
                                    style={{ backgroundImage: (item.data as any).backgroundImage }}
                                  />
                                ) : ('lightColor' in item.data) ? (
                                  <div className="grid grid-cols-4 gap-0 w-full aspect-square rounded overflow-hidden border-2 border-yellow-600/50">
                                    {[...Array(16)].map((_, i) => {
                                      const row = Math.floor(i / 4);
                                      const col = i % 4;
                                      const isLight = (row + col) % 2 === 0;
                                      return (
                                        <div
                                          key={i}
                                          style={{
                                            backgroundColor: isLight 
                                              ? (item.data as any).lightColor 
                                              : (item.data as any).darkColor
                                          }}
                                          className="aspect-square"
                                        />
                                      );
                                    })}
                                  </div>
                                ) : null}
                              </div>
                            ) : item.type === 'piece_style' && item.data && typeof item.data === 'object' && (('textureUrl' in item.data) || ('useClassicSvg' in item.data)) ? (
                              <div 
                                className="flex-1 h-24 rounded-lg mb-3 flex items-center justify-center bg-zinc-900 border-2 border-purple-500/30 p-2 gap-2"
                              >
                                <div className="w-12 h-12 relative flex items-center justify-center">
                                  <PieceIcon 
                                    piece={{ type: 'knight', color: item.name.toLowerCase().includes('villain') ? 'b' : 'w' }} 
                                    className="w-full h-full pointer-events-none absolute inset-0" 
                                    pieceStyle={item.data as any}
                                  />
                                </div>
                                <div className="w-12 h-12 relative flex items-center justify-center">
                                  <PieceIcon 
                                    piece={{ type: 'rook', color: item.name.toLowerCase().includes('villain') ? 'b' : 'w' }} 
                                    className="w-full h-full pointer-events-none absolute inset-0" 
                                    pieceStyle={item.data as any}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="flex-1 h-24 rounded-lg mb-3 flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-purple-900/20"
                              >
                                <Sparkles className="w-8 h-8 text-purple-400 drop-shadow-lg" />
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span className="font-bold text-yellow-400">{item.price} XP</span>
                              </div>

                              {isOwned ? (
                                isEquipped ? (
                                  <Button size="sm" disabled variant="outline">
                                    <Check className="w-4 h-4 mr-1" />
                                    Active
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => purchase && handleEquip(purchase.id)}
                                    disabled={equipMutation.isPending}
                                    data-testid={`button-equip-${item.id}`}
                                  >
                                    Equip
                                  </Button>
                                )
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handlePurchase(item.id)}
                                  disabled={purchaseMutation.isPending || !canAfford || !currentPlayerId}
                                  data-testid={`button-buy-${item.id}`}
                                  className={canAfford && currentPlayerId ? 'bg-gradient-to-r from-purple-600 to-purple-800' : ''}
                                >
                                  {!currentPlayerId ? 'Select Player' : !canAfford ? 'Not Enough XP' : 'Buy'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
