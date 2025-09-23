"use client";

import React, { useState, useCallback, useEffect } from "react";
import { generate } from "random-words";
import Navbar from "@/components/Navbar";
import { GameComponent } from "@/components/GameComponent";

function Page() {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const generateRandomWord = useCallback(() => {
    const word = generate({ exactly: 1, minLength: 4, maxLength: 7 })[0];
    return word.toUpperCase();
  }, []);

  const [targetWord, setTargetWord] = useState(() => generateRandomWord());

  const formatTime = useCallback((timeMs: number) => {
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (startTime && !endTime) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - startTime);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime, endTime]);

  const resetGame = useCallback(() => {
    setStartTime(null);
    setEndTime(null);
    setCurrentTime(0);
    setTargetWord(generateRandomWord());
  }, [generateRandomWord]);

  const handleGameComplete = useCallback(
    (result: {
      hasWon: boolean;
      totalGuesses: number;
      timeTaken: number;
      targetWord: string;
    }) => {
      console.log("Game completed:", result);
    },
    []
  );

  return (
    <div className="min-h-screen bg-foreground">
      <Navbar
        currentTime={currentTime}
        endTime={endTime}
        startTime={startTime}
        onNewGame={resetGame}
        formatTime={formatTime}
        showTimer={true}
        showNewGame={true}
      />

      <main className="flex min-h-screen w-full flex-col items-center justify-center p-8 pt-24">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-background mb-2">
            Local Play
          </h1>
          <p className="text-background/80">
            Practice with randomly generated words
          </p>
        </div>

        <GameComponent
          targetWord={targetWord}
          onGameComplete={handleGameComplete}
          onNewGame={resetGame}
          showNewGameButton={false}
          onTimerStart={setStartTime}
          onTimerUpdate={setCurrentTime}
          onTimerEnd={setEndTime}
        />
      </main>
    </div>
  );
}

export default Page;
