import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Shirt, User, Sparkles, LogIn, LogOut, Calendar, TrendingUp } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:scale-105 transition-transform duration-300">
            <Shirt className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">StyleFinder AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/test" className={cn("text-sm font-medium transition-colors hover:text-primary", isActive("/test") ? "text-primary" : "text-muted-foreground")} data-testid="link-test">
            스타일 테스트
          </Link>
          <Link href="/evaluate" className={cn("text-sm font-medium transition-colors hover:text-primary", isActive("/evaluate") ? "text-primary" : "text-muted-foreground")} data-testid="link-evaluate">
            AI 평가
          </Link>
          {user && (
            <>
              <Link href="/history" className={cn("text-sm font-medium transition-colors hover:text-primary", isActive("/history") ? "text-primary" : "text-muted-foreground")} data-testid="link-history">
                히스토리
              </Link>
              <Link href="/progress" className={cn("text-sm font-medium transition-colors hover:text-primary", isActive("/progress") ? "text-primary" : "text-muted-foreground")} data-testid="link-progress">
                성장 추적
              </Link>
              <Link href="/profile" className={cn("text-sm font-medium transition-colors hover:text-primary", isActive("/profile") ? "text-primary" : "text-muted-foreground")} data-testid="link-profile">
                프로필
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline-block">
                안녕하세요, {user.firstName || user.email?.split('@')[0]}님
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logout()}
                className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </Button>
            </div>
          ) : (
            <a href="/api/login">
              <Button size="sm" className="gap-2 font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" data-testid="button-login">
                <LogIn className="h-4 w-4" />
                로그인
              </Button>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
