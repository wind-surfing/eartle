"use client";
import React from "react";
import Link from "next/link";
import { HiDesktopComputer } from "react-icons/hi";
import { FaGlobe } from "react-icons/fa";

function page() {
  return (
    <>
      <main className="flex flex-col items-center h-screen w-screen bg-black">
        <div className="pt-8 flex flex-col justify-center items-center">
          <h1 className="text-3xl font-bold text-primary">Sharpen your mind</h1>
          <h1 className="text-9xl font-black text-primary">EARTLE</h1>
        </div>
        <div
          className="board h-[80vh] w-[80vw] rounded-t-3xl grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-primary/50 animate-tilt"
          style={{
            transformOrigin: "bottom center",
          }}
        >
          <Link
            href="/play"
            className="flex flex-col justify-center items-center gap-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-8 hover:bg-white/30 transition-all duration-300 cursor-pointer"
          >
            <div className="w-16 h-16 bg-primary/80 backdrop-blur-sm rounded-full flex items-center justify-center">
              <HiDesktopComputer className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Local Play</h2>
            <p className="text-white/80 text-center leading-relaxed">
              Play offline on your device with no internet connection required
            </p>
          </Link>

          <Link
            href="/global"
            className="flex flex-col justify-center items-center gap-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-8 hover:bg-white/30 transition-all duration-300 cursor-pointer"
          >
            <div className="w-16 h-16 bg-green-500/80 backdrop-blur-sm rounded-full flex items-center justify-center">
              <FaGlobe className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Global Play</h2>
            <p className="text-white/80 text-center leading-relaxed">
              Challenge players worldwide and compete on the global leaderboard
            </p>
          </Link>
        </div>
        <style jsx>{`
          @keyframes tilt {
            0% {
              transform: perspective(1000px) rotateX(0deg);
            }
            100% {
              transform: perspective(1000px) rotateX(15deg) scale(1.15);
            }
          }

          .animate-tilt {
            animation: tilt 2s ease-in-out forwards;
          }
        `}</style>
      </main>
    </>
  );
}

export default page;
