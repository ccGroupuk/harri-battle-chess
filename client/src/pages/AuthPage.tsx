import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Skull, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { loginMutation, registerMutation } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate({ username, password });
    } else {
      registerMutation.mutate({ username, password });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
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

      <Card className="w-full max-w-md z-10 bg-background/80 backdrop-blur-md border-white/10 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center items-center gap-3">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
            <h1 className="text-3xl md:text-4xl font-comic text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-yellow-500 to-blue-600 drop-shadow-2xl tracking-wider">
              HARRI BATTLE CHESS
            </h1>
            <Skull className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
          </div>
          <CardTitle className="text-xl">
            {isLogin ? "Welcome Back, Commander" : "Create Your Profile"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Enter your credentials to access the battlefield"
              : "Set up a new hero profile to start playing"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Hero Name</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your hero name..."
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12"
              disabled={isPending}
            >
              {isPending && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              {isLogin ? "LOGIN & BATTLE" : "CREATE PROFILE"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have a profile yet? " : "Already have a profile? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-bold hover:underline"
            >
              {isLogin ? "Create one" : "Login"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
