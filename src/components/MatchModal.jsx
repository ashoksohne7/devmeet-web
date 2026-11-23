import { useMemo } from "react";
import Avatar from "./Avatar";

const COLORS = ["#f43f5e", "#facc15", "#34d399", "#60a5fa", "#c084fc", "#fb923c"];

export default function MatchModal({ me, other, onKeep, onView }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 45 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        dur: 2.2 + Math.random() * 2,
        size: 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
      })),
    []
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="pointer-events-none absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            animation: `confetti-fall ${p.dur}s linear ${p.delay}s infinite`,
          }}
        />
      ))}

      <div className="relative text-center" style={{ animation: "pop-in 350ms ease-out" }}>
        <h2 className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-5xl font-extrabold text-transparent">
          It&apos;s a match!
        </h2>
        <p className="mt-2 text-white/70">
          Tum aur {other?.firstName} ab connected ho
        </p>

        <div className="my-8 flex items-center justify-center">
          <div className="-rotate-6 rounded-full border-4 border-white/90">
            <Avatar user={me} size="h-28 w-28" text="text-3xl" />
          </div>
          <div className="-ml-5 rotate-6 rounded-full border-4 border-white/90">
            <Avatar user={other} size="h-28 w-28" text="text-3xl" />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button className="btn btn-primary" onClick={onView}>
            Connections dekho
          </button>
          <button className="btn btn-ghost text-white" onClick={onKeep}>
            Swipe karte raho
          </button>
        </div>
      </div>
    </div>
  );
}
