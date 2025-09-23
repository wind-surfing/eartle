"use client";

import React from "react";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface NotFoundProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
  className?: string;
}

export default function NotFound({
  title = "Not Found",
  message = "The page you're looking for doesn't exist.",
  showHomeButton = true,
  className = "",
}: NotFoundProps) {
  return (
    <div
      className={`flex flex-col justify-center items-center gap-2 w-full h-[80vh] ${className}`}
    >
      <FileQuestion className="w-16 h-16 text-background/60" />
      <h1 className="text-4xl font-bold text-background">{title}</h1>
      <p className="text-lg text-background/80 text-center">{message}</p>
      {showHomeButton && (
        <Link href="/home" className="mt-4">
          <Button variant="outline">
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </Link>
      )}
    </div>
  );
}
