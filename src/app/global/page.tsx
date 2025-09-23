"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Loader from "@/components/Loader";
import { GameComponent } from "@/components/GameComponent";
import { getDailyWord, submitToLeaderboard } from "@/supabase/rpc/normal";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import useUser from "@/hooks/useUser";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function Page() {
  const { user } = useUser();
  const router = useRouter();
  const [targetWord, setTargetWord] = useState<string>("");
  const [dailyWordId, setDailyWordId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameDate, setGameDate] = useState<string>("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [initialized, setInitialized] = useState(false);

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

  const fetchDailyWord = useCallback(async () => {
    if (isLoading && !targetWord) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await getDailyWord();

      if (result.success) {
        setTargetWord(result.word.toUpperCase());
        setDailyWordId(result.daily_word_id);
        setGameDate(result.date || new Date().toISOString().split("T")[0]);

        setInitialized(true);
      } else {
        setError(result.error || "Failed to fetch daily word");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Error fetching daily word:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, targetWord, user]);

  useEffect(() => {
    if (!initialized) {
      fetchDailyWord();
    }
  }, [initialized, fetchDailyWord]);

  const handleGameComplete = useCallback(
    async (result: {
      hasWon: boolean;
      totalGuesses: number;
      timeTaken: number;
      targetWord: string;
    }) => {
      console.log("Global game completed:", result);

      if (user && user.id && dailyWordId) {
        try {
          const submission = await submitToLeaderboard({
            userId: user.id,
            dailyWordId: dailyWordId,
            guessesCount: result.totalGuesses,
            durationSeconds: Math.floor(result.timeTaken / 1000),
            won: result.hasWon,
          });

          if (submission.success) {
            if (submission.already_completed) {
              toast.info(
                `${submission.message}. Your score: ${submission.score}`
              );
            } else if (submission.is_new_record) {
              toast.success(
                `${submission.message}! Score: ${submission.score}`
              );
            } else {
              toast.info(
                `${submission.message}. Score: ${submission.score || 0}`
              );
            }
          } else {
            toast.error(
              `Failed to submit score: ${submission.error || "Unknown error"}`
            );
          }
        } catch (err) {
          console.error("Error submitting to leaderboard:", err);
          toast.error("Error submitting score to leaderboard");
        }
      } else if (!user) {
        toast.info("Please sign in to submit your score to the leaderboard");
      }
    },
    [user, dailyWordId]
  );

  const resetGame = useCallback(() => {
    router.push("/play");
  }, [router]);

  const handleRetry = useCallback(() => {
    setInitialized(false);
    setError(null);
    setIsLoading(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-foreground">
        <Navbar />
        <div className="pt-20">
          <Loader message="Loading today's word..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-foreground">
        <Navbar />
        <div className="pt-20">
          <div className="flex flex-col justify-center items-center gap-2 w-full h-[80vh]">
            <p className="text-lg text-red-500 mb-4">Error: {error}</p>
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            Daily Challenge
          </h1>
          <p className="text-background/80">
            {gameDate
              ? new Date(gameDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
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
