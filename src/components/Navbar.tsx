"use client";

import React from "react";
import { Timer, RotateCcw, Home, Monitor, Globe, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  currentTime?: number;
  endTime?: number | null;
  startTime?: number | null;
  onNewGame?: () => void;
  formatTime?: (timeMs: number) => string;
  showTimer?: boolean;
  showNewGame?: boolean;
}

export default function Navbar({
  currentTime = 0,
  endTime = null,
  startTime = null,
  onNewGame,
  formatTime,
  showTimer = false,
  showNewGame = false,
}: NavbarProps) {
  const pathname = usePathname();

  const navigationLinks = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/play", icon: Monitor, label: "Local" },
    { href: "/global", icon: Globe, label: "Global" },
    { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/10 backdrop-blur-md border-b border-background/20 p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/home">
          <h1 className="text-2xl font-bold text-background drop-shadow-lg hover:text-primary transition-colors">
            Eartle
          </h1>
        </Link>

        <div className="flex items-center gap-1 md:gap-2">
          {navigationLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive(link.href) ? "ghost" : "ghost"}
                  size="sm"
                  className={`flex items-center gap-1 md:gap-2 transition-all duration-200 cursor-pointer text-xs md:text-sm ${
                    isActive(link.href)
                      ? "text-foreground bg-background hover:text-primary"
                      : "text-background hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{link.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {showTimer && formatTime && (
            <div className="flex items-center gap-1 md:gap-2 text-sm md:text-lg text-background">
              <Timer className="w-4 h-4 md:w-5 md:h-5" />
              <span className="drop-shadow-md font-mono text-xs md:text-base">
                {formatTime(endTime ? endTime - (startTime || 0) : currentTime)}
              </span>
            </div>
          )}

          {showNewGame && onNewGame && (
            <Button
              onClick={onNewGame}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 md:gap-2 transition-all duration-200 cursor-pointer text-xs md:text-sm"
            >
              <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">New Game</span>
              <span className="sm:hidden">New</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
