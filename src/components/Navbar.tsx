import React from "react";
import { Timer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  currentTime: number;
  endTime: number | null;
  startTime: number | null;
  onNewGame: () => void;
  formatTime: (timeMs: number) => string;
}

export default function Navbar({
  currentTime,
  endTime,
  startTime,
  onNewGame,
  formatTime,
}: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-background/20 text-background p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-background drop-shadow-lg">
          Eartle
        </h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-lg">
            <Timer className="w-5 h-5" />
            <span className="drop-shadow-md">
              {formatTime(endTime ? endTime - (startTime || 0) : currentTime)}
            </span>
          </div>
          <Button
            onClick={onNewGame}
            variant="ghost"
            className="flex items-center gap-2 text-background cursor-pointer backdrop-blur-sm transition-all duration-200"
          >
            <RotateCcw className="w-4 h-4" />
            New Game
          </Button>
        </div>
      </div>
    </nav>
  );
}
