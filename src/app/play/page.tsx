"use client";

import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { generate } from "random-words";
import { Play, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { RowBoxes } from "@/components/RowBoxes";

function Page() {
  const [currentRow, setCurrentRow] = useState(0);
  const [completeValues, setCompleteValues] = useState<string[][]>([]);
  const [hasWon, setHasWon] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  const generateRandomWord = useCallback(() => {
    const word = generate({ exactly: 1, minLength: 4, maxLength: 7 })[0];
    return word.toUpperCase();
  }, []);

  const [targetWord, setTargetWord] = useState(() => generateRandomWord());
  const wordLength = targetWord.length;
  const maxAttempts = 6;

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

  const triggerConfetti = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  const formatTime = useCallback((timeMs: number) => {
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const resetGame = useCallback(() => {
    setCurrentRow(0);
    setCompleteValues([]);
    setHasWon(false);
    setStartTime(null);
    setEndTime(null);
    setTotalGuesses(0);
    setCurrentTime(0);
    setShowResultDialog(false);
    setTargetWord(generateRandomWord());
    setResetTrigger((prev) => prev + 1);
  }, [generateRandomWord]);

  const handleFirstInput = useCallback(() => {
    if (!startTime) {
      setStartTime(Date.now());
    }
  }, [startTime]);

  const handleRowComplete = (rowIndex: number, values: string[]) => {
    const newCompleteValues = [...completeValues];
    newCompleteValues[rowIndex] = values;
    setCompleteValues(newCompleteValues);
    setTotalGuesses(rowIndex + 1);

    const guessedWord = values.join("");
    if (guessedWord === targetWord) {
      setHasWon(true);
      setEndTime(Date.now());
      setShowResultDialog(true);
      setTimeout(() => triggerConfetti(), 500);
    } else if (currentRow < maxAttempts - 1) {
      setCurrentRow(currentRow + 1);
    } else {
      setHasWon(false);
      setEndTime(Date.now());
      setShowResultDialog(true);
    }
  };

  return (
    <div className="min-h-screen bg-foreground">
      <Navbar
        currentTime={currentTime}
        endTime={endTime}
        startTime={startTime}
        onNewGame={resetGame}
        formatTime={formatTime}
      />

      <main className="flex min-h-screen w-full flex-col items-center justify-center p-8 pt-24">
        <div className="flex width-full flex-col items-center justify-center gap-2">
          {Array.from({ length: maxAttempts }, (_, index) => (
            <RowBoxes
              key={`${index}-${resetTrigger}`}
              rowIndex={index}
              isActive={currentRow === index}
              isComplete={completeValues[index] !== undefined}
              targetWord={targetWord}
              wordLength={wordLength}
              onComplete={handleRowComplete}
              completedValues={completeValues[index]}
              onFirstInput={handleFirstInput}
              resetTrigger={resetTrigger}
            />
          ))}
        </div>

        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent className="sm:max-w-md bg-foreground border border-gray-700 text-background">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2 text-background">
                {hasWon ? (
                  <>
                    <Trophy className="w-6 h-6 text-primary" />
                    Congratulations!
                  </>
                ) : (
                  "Game Over!"
                )}
              </DialogTitle>
              <DialogDescription className="text-center space-y-3 pt-4">
                <div className="text-lg space-y-2 text-gray-100">
                  <p>
                    Target word:{" "}
                    <span className="font-bold text-primary">{targetWord}</span>
                  </p>
                  <p>
                    Time taken:{" "}
                    <span className="font-bold text-primary">
                      {formatTime(endTime ? endTime - (startTime || 0) : 0)}
                    </span>
                  </p>
                  <p>
                    Guesses used:{" "}
                    <span className="font-bold text-primary">
                      {totalGuesses} / {maxAttempts}
                    </span>
                  </p>
                </div>
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={resetGame}
                    variant="ghost"
                    className="flex items-center gap-2 text-background cursor-pointer backdrop-blur-sm transition-all duration-200"
                  >
                    <Play className="w-4 h-4" />
                    Play Again
                  </Button>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default Page;
