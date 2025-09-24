"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FaGithub, FaGoogle } from "react-icons/fa6";

interface SocialAuthProps {
  className?: string;
}

export default function SocialAuth({ className = "" }: SocialAuthProps) {
  const handleSocialSignIn = async (provider: string) => {
    try {
      await signIn(provider, {
        callbackUrl: "/home",
      });
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
    }
  };

  return (
    <div className={`${className}`}>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-background/20"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-foreground px-4 text-background/70">
            Or Continue with social platforms
          </span>
        </div>
      </div>
      <div className="flex justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-12 h-12 rounded-full p-0 border-background/20 hover:border-primary hover:text-primary cursor-pointer"
          onClick={() => handleSocialSignIn("google")}
          aria-label="Sign in with Google"
        >
          <FaGoogle className="w-5 h-5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-12 h-12 rounded-full p-0 border-background/20 hover:border-primary hover:text-primary cursor-pointer"
          onClick={() => handleSocialSignIn("github")}
          aria-label="Sign in with GitHub"
        >
          <FaGithub className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
