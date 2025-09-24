import { createBrowserClient } from "@/supabase/client";
import { SessionUser } from "@/types/User";

export interface SocialUserData extends Partial<SessionUser> {
  score: number;
  guesses: number;
  duration: number;
  won: boolean;
}

export interface DailyWordData {
  word: string;
  daily_word_id: string;
  date: string;
  is_new: boolean;
}

export interface LeaderboardSubmissionData {
  success: boolean;
  message?: string;
  score?: number;
  previous_score?: number;
  attempted_score?: number;
  is_new_record?: boolean;
  already_completed?: boolean;
  error?: string;
}

export interface DailyCompletionData {
  success: boolean;
  completed: boolean;
  score?: number;
  guesses?: number;
  duration?: number;
  completed_at?: string;
  error?: string;
}

export async function getLeaderboard({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.rpc("get_leaderboard", {
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error("Get leaderboard error:", error);
    return { success: false, error: "Error fetching leaderboard" } as const;
  }

  if (!data) {
    console.error("No data returned from get_leaderboard");
    return { success: false, error: "No data returned" } as const;
  }

  if (!data.success) {
    return {
      success: false,
      error: data.error || "Failed to fetch leaderboard",
    } as const;
  }

  const leaderboard = Array.isArray(data.leaderboard) ? data.leaderboard : [];
  leaderboard.sort((a: SocialUserData, b: SocialUserData) => b.score - a.score);

  return { success: true, leaderboard } as {
    success: boolean;
    leaderboard: SocialUserData[];
  };
}

export async function getDailyWord() {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.rpc("get_daily_word");

  if (error) {
    console.error("Get daily word error:", error);
    return { success: false, error: "Error fetching daily word" } as const;
  }

  if (!data.success) {
    return {
      success: false,
      error: data.error || "Failed to fetch daily word",
    } as const;
  }

  return data as { success: true } & DailyWordData;
}

export async function submitToLeaderboard({
  userId,
  dailyWordId,
  guessesCount,
  durationSeconds,
  won,
}: {
  userId: string;
  dailyWordId: string;
  guessesCount: number;
  durationSeconds: number;
  won: boolean;
}) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.rpc("submit_to_leaderboard", {
    p_user_id: userId,
    p_daily_word_id: dailyWordId,
    p_guesses_count: guessesCount,
    p_duration_seconds: durationSeconds,
    p_won: won,
  });

  if (error) {
    console.error("Submit to leaderboard error:", error);
    return {
      success: false,
      error: "Error submitting to leaderboard",
    } as const;
  }

  return data as LeaderboardSubmissionData;
}