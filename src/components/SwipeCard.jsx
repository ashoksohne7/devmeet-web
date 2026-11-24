import { useEffect, useRef, useState } from "react";
import PhotoFill from "./PhotoFill";

const DISTANCE = 90;      // px drag needed to commit a swipe
const FLICK_SPEED = 0.45; // px per ms
const FLICK_MIN = 35;     // minimum px for a flick
const TAP_SLOP = 6;       // movement under this counts as a tap

export default function SwipeCard({
  user,
  depth = 0,
  leaving = null,
  onSwipe = () => {},
  onTap = () => {},
  mySkills = [],
  preview = false,
}) {
  const { firstName = "", lastName = "", age, gender, about, skills = [] } = user;
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const gesture = useRef(null); // always holds the latest pointer data
  const isTop = depth === 0;
  const interactive = isTop && !preview;

  const mine = new Set((mySkills || []).map((s) => s.toLowerCase()));
  const common = skills.filter((s) => mine.has(s.toLowerCase()));

  // if a swipe fails and the card comes back, reset it
  useEffect(() => {
    if (!leaving) {
      gesture.current = null;
      setDrag({ x: 0, y: 0, active: false });
    }
  }, [leaving]);

  const reset = () => setDrag({ x: 0, y: 0, active: false });

  const onDown = (e) => {
    if (!interactive || leaving) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    gesture.current = {
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      t: performance.now(),
      dx: 0,
      dy: 0,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ x: 0, y: 0, active: true });
  };

  const onMove = (e) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    g.dx = e.clientX - g.sx;
    g.dy = e.clientY - g.sy;
    if (!g.moved && Math.hypot(g.dx, g.dy) > TAP_SLOP) g.moved = true;
    setDrag({ x: g.dx, y: g.dy, active: true });
  };

  const finish = (e, cancelled) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;

    if (cancelled) return reset();
    if (!g.moved) {
      reset();
      onTap();
      return;
    }

    const dt = Math.max(performance.now() - g.t, 1);
    const speed = Math.abs(g.dx) / dt;
    const far = Math.abs(g.dx) > DISTANCE;
    const flick = speed > FLICK_SPEED && Math.abs(g.dx) > FLICK_MIN;

    if (far || flick) {
      onSwipe(g.dx > 0 ? "right" : "left");
      setDrag((d) => ({ ...d, active: false }));
    } else {
      reset();
    }
  };

  let transform = "none";
  let transition = "transform 250ms ease";
  let opacity = 1;
  if (!preview) {
    if (isTop && leaving) {
      const s = leaving === "right" ? 1 : -1;
      const fly = Math.max(window.innerWidth, 700);
      transform = `translate(${s * fly}px, ${drag.y * 0.3}px) rotate(${s * 28}deg)`;
      transition = "transform 300ms ease-out, opacity 300ms";
      opacity = 0;
    } else if (isTop) {
      const rot = Math.max(-25, Math.min(25, drag.x / 15));
      transform = `translate(${drag.x}px, ${drag.y * 0.3}px) rotate(${rot}deg)`;
      transition = drag.active ? "none" : "transform 250ms cubic-bezier(.2,.8,.2,1)";
    } else {
      transform = `translateY(${depth * 12}px) scale(${1 - depth * 0.05})`;
    }
  }

  const likeOpacity = leaving === "right" ? 1 : Math.min(Math.max(drag.x / DISTANCE, 0), 1);
  const nopeOpacity = leaving === "left" ? 1 : Math.min(Math.max(-drag.x / DISTANCE, 0), 1);

  return (
    <div
      onPointerDown={interactive ? onDown : undefined}
      onPointerMove={interactive ? onMove : undefined}
      onPointerUp={interactive ? (e) => finish(e, false) : undefined}
      onPointerCancel={interactive ? (e) => finish(e, true) : undefined}
      className="absolute inset-0 select-none overflow-hidden rounded-3xl bg-base-300 shadow-2xl"
      style={{
        transform,
        transition,
        opacity,
        zIndex: 10 - depth,
        touchAction: interactive ? "none" : "auto",
        cursor: interactive ? (drag.active ? "grabbing" : "pointer") : "default",
        willChange: interactive ? "transform" : "auto",
      }}
    >
      <PhotoFill user={user} />

      {!preview && (
        <>
          <div
            className="absolute left-5 top-8 -rotate-12 rounded-lg border-4 border-emerald-400 px-3 py-1 text-3xl font-extrabold tracking-wider text-emerald-400"
            style={{ opacity: likeOpacity }}
          >
            LIKE
          </div>
          <div
            className="absolute right-5 top-8 rotate-12 rounded-lg border-4 border-rose-500 px-3 py-1 text-3xl font-extrabold tracking-wider text-rose-500"
            style={{ opacity: nopeOpacity }}
          >
            NOPE
          </div>
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pr-16 pt-28 text-white">
        {common.length > 0 && (
          <span
            className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundImage: "linear-gradient(135deg, #fd267a, #ff6036)" }}
          >
            🤝 {common.length} shared skill{common.length > 1 ? "s" : ""}
          </span>
        )}
        <h2 className="break-words text-3xl font-bold leading-tight">
          {firstName || "Your name"} {lastName}
          {age ? <span className="ml-2 text-2xl font-normal">{age}</span> : null}
        </h2>
        {gender && <p className="text-sm capitalize text-white/70">{gender}</p>}
        {about && <p className="mt-2 line-clamp-2 break-words text-sm text-white/90">{about}</p>}
        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.slice(0, 5).map((s) => (
              <span
                key={s}
                className={`rounded-full px-3 py-1 text-xs backdrop-blur ${
                  mine.has(s.toLowerCase()) ? "bg-pink-500/80 font-semibold" : "bg-white/20"
                }`}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {interactive && (
        <button
          aria-label="View full profile"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onTap}
          className="absolute bottom-5 right-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 text-xl text-white backdrop-blur hover:bg-white/20"
        >
          ⓘ
        </button>
      )}
    </div>
  );
}
