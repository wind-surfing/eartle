"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatPills from "@/components/StatPills";
import { getLeaderboard, SocialUserData } from "@/supabase/rpc/normal";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Loader from "@/components/Loader";
import NotFound from "@/components/NotFound";
import { useRouter } from "next/navigation";

export default function Page() {
  const [items, setItems] = useState<SocialUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const router = useRouter();

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

  const handleNewGame = useCallback(() => {
    router.push("/play");
  }, [router]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getLeaderboard({ limit: 50, offset: 0 });

      if (res.success) {
        setItems(res.leaderboard || []);
      } else {
        setError("error" in res ? res.error : "Failed to fetch leaderboard");
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-foreground">
        <Navbar
          currentTime={currentTime}
          endTime={endTime}
          startTime={startTime}
          showTimer={true}
          showNewGame={true}
          formatTime={formatTime}
          onNewGame={handleNewGame}
        />
        <div className="pt-20">
          <Loader message="Loading leaderboard..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-foreground">
        <Navbar
          currentTime={currentTime}
          endTime={endTime}
          startTime={startTime}
          showTimer={true}
          showNewGame={true}
          formatTime={formatTime}
          onNewGame={handleNewGame}
        />
        <div className="pt-20">
          <div className="flex flex-col justify-center items-center gap-2 w-full h-[80vh]">
            <p className="text-lg text-red-500 mb-4">Error: {error}</p>
            <Button onClick={fetchLeaderboard} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-screen bg-foreground">
        <Navbar
          currentTime={currentTime}
          endTime={endTime}
          startTime={startTime}
          showTimer={true}
          showNewGame={true}
          formatTime={formatTime}
          onNewGame={handleNewGame}
        />
        <div className="pt-20">
          <NotFound
            title="No Data Yet"
            message="Play the daily challenge to see your score on the leaderboard!"
            showHomeButton={false}
          />
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
        showTimer={true}
        showNewGame={true}
        formatTime={formatTime}
        onNewGame={handleNewGame}
      />
      <div className="pt-20 pb-8">
        <div className="w-full py-8 max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-background text-center">
              Global Leaderboard
            </h1>
            <p className="text-background/80 text-center mt-2">
              Top players from daily challenges
            </p>
          </div>

          <div className="rounded-lg bg-background/10 border border-background/20 p-0 sm:p-3 shadow-lg">
            <ul className="divide-y divide-background/20">
              {items.map((it, index) => {
                const name = it.displayName || it.username;

                return (
                  <li
                    key={`${it.score}-${it.id}`}
                    className="py-4 hover:bg-background/5 transition-colors"
                  >
                    <div className="flex items-center justify-between px-4">
                      <div className="inline-flex items-center gap-4 sm:gap-5">
                        <span className="w-8 sm:w-10 text-right tabular-nums font-bold text-lg text-background">
                          #{index + 1}
                        </span>
                        <Avatar className="h-10 w-10 border-2 border-background/20">
                          <AvatarImage
                            src={it.avatar || undefined}
                            alt={name}
                          />
                          <AvatarFallback className="bg-primary text-white">
                            {name?.slice(0, 2)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-background">
                          {name}
                        </span>
                      </div>
                      <StatPills
                        guesses={it.guesses}
                        duration={it.duration}
                        score={it.score}
                        truncate={false}
                        className="inline-flex items-center gap-2"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
