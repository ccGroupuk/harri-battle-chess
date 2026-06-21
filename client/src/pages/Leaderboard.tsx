import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, ArrowLeft, Upload, User, Trash2, Star, CheckCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LeaderboardEntry } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";

export default function Leaderboard() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(() => {
    const saved = localStorage.getItem("currentPlayerId");
    return saved ? parseInt(saved) : null;
  });

  const selectPlayer = (id: number) => {
    setCurrentPlayerId(id);
    localStorage.setItem("currentPlayerId", id.toString());
    toast({ title: "Player selected! XP will be tracked for this player." });
  };

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setPhotoUrl(response.objectPath);
      toast({ title: "Photo uploaded!" });
    },
    onError: (error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const { data: entries = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; photoUrl: string | null }) => {
      return apiRequest("POST", "/api/leaderboard", { name: data.name, photoUrl: data.photoUrl, wins: 0, losses: 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      setName("");
      setPhotoUrl(null);
      toast({ title: "Player added to leaderboard!" });
    },
    onError: () => {
      toast({ title: "Failed to add player", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/leaderboard/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      toast({ title: "Player removed" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }
    createMutation.mutate({ name: name.trim(), photoUrl });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Leaderboard
          </h1>
        </div>

        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Add Your Name</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar 
                    className="w-16 h-16 cursor-pointer border-2 border-dashed border-slate-500 hover:border-blue-400 transition-colors" 
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload-photo"
                  >
                    {photoUrl ? (
                      <AvatarImage src={photoUrl} alt="Profile" />
                    ) : (
                      <AvatarFallback className="bg-slate-700">
                        {isUploading ? (
                          <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full" />
                        ) : (
                          <Upload className="w-6 h-6 text-slate-400" />
                        )}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    data-testid="input-photo"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="input-name"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={createMutation.isPending || isUploading}
                data-testid="button-add-player"
              >
                {createMutation.isPending ? "Adding..." : "Add to Leaderboard"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Players</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-slate-400 py-8">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                No players yet. Be the first to join!
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                      currentPlayerId === entry.id 
                        ? "bg-blue-600/30 border border-blue-500" 
                        : "bg-slate-700/50 hover:bg-slate-700"
                    }`}
                    onClick={() => selectPlayer(entry.id)}
                    data-testid={`player-row-${entry.id}`}
                  >
                    <span className="text-lg font-bold text-yellow-400 w-6">
                      #{index + 1}
                    </span>
                    <Avatar className="w-10 h-10">
                      {entry.photoUrl ? (
                        <AvatarImage src={entry.photoUrl} alt={entry.name} />
                      ) : (
                        <AvatarFallback className="bg-slate-600">
                          <User className="w-5 h-5 text-slate-300" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{entry.name}</p>
                        {currentPlayerId === entry.id && (
                          <CheckCircle className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <p className="text-sm text-slate-400">
                        {entry.wins} wins • {entry.losses} losses
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400 font-bold">
                      <Star className="w-4 h-4" />
                      <span data-testid={`xp-${entry.id}`}>{entry.xp}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(entry.id);
                      }}
                      data-testid={`button-delete-${entry.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
