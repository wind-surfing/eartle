"use client";

import React from "react";
import { RefreshCw } from "lucide-react";

interface LoaderProps {
  message?: string;
  className?: string;
}

export default function Loader({
  message = "Loading...",
  className = "",
}: LoaderProps) {
  return (
    <div
      className={`flex flex-col justify-center items-center gap-2 w-full h-[80vh] ${className}`}
    >
      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      <p className="text-lg text-background">{message}</p>
    </div>
  );
}
