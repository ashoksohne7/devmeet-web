import { useRef, useState } from "react";

const THRESHOLD = 110;

export default function SwipeCard({
  user,
  depth = 0,
  leaving = null,
  onSwipe = () => {},
  onTap = () => {},
  mySkills = [],
  preview = false,
}) {
  const { firstName = "", lastName = "", age, gender, about, skills = [], photoUrl } = user;
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const start = useRef(null);
  const isTop = depth === 0;
  const interactive = isTop && !preview;

  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  const hue = [...`${firstName}${lastName}`].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  const mine = new Set((mySkills || []).map((s) => s.toLowerCase()));
  const common = skills.filter((s) => mine.has(s.toLowerCase()));

  const onDown = (e) => {
    if (!interactive || leaving) return;
    start.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ x: 0, y: 0, active: true });
  };
  const onMove = (e) => {
    if (!start.current) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true });
  };
  const onUp = () => {
    if (!start.current) return;
    start.current = null;
    if (Math.hypot(drag.x, drag.y) < 8) {
      setDrag({ x: 0, y: 0, active: false });
      onTap(); // sirf tap hua, drag nahi
      return;
    }
    if (Math.abs(drag.x) > THRESHOLD) {
      onSwipe(drag.x > 0 ? "right" : "left");
      setDrag((d) => ({ ...d, active: false }));
    } else {
      setDrag({ x: 0, y: 0, active: false });
    }
  };

  let transform = "none";
  let transition = "transform 250ms ease";
  let opacity = 1;
  if (!preview) {
    if (isTop && leaving) {
      const s = leaving === "right" ? 1 : -1;
      transform = `translate(${s * 700}px, ${drag.y * 0.3}px) rotate(${s * 30}deg)`;
      transition = "transform 300ms ease-out, opacity 300ms";
      opacity = 0;
    } else if (isTop) {
      transform = `translate(${drag.x}px, ${drag.y * 0.3}px) rotate(${drag.x / 15}deg)`;
      transition = drag.active ? "none" : "transform 250ms cubic-bezier(.2,.8,.2,1)";
    } else {
      transform = `translateY(${depth * 12}px) scale(${1 - depth * 0.05})`;
    }
  }

  const likeOpacity = leaving === "right" ? 1 : Math.min(Math.max(drag.x / THRESHOLD, 0), 1);
  const nopeOpacity = leaving === "left" ? 1 : Math.min(Math.max(-drag.x / THRESHOLD, 0), 1);

  return (
    <div
      onPointerDown={interactive ? onDown : undefined}
      onPointerMove={interactive ? onMove : undefined}
      onPointerUp={interactive ? onUp : undefined}
      onPointerCancel={interactive ? onUp : undefined}
      className="absolute inset-0 select-none overflow-hidden rounded-3xl bg-base-300 shadow-2xl"
      style={{
        transform,
        transition,
        opacity,
        zIndex: 10 - depth,
        touchAction: interactive ? "none" : "auto",
        cursor: interactive ? (drag.active ? "grabbing" : "pointer") : "default",
      }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={firstName} draggable={false} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-8xl font-bold text-white/80"
          style={{
            background: `linear-gradient(160deg, hsl(${hue} 70% 45%), hsl(${(hue + 60) % 360} 70% 28%))`,
          }}
        >
          {initials || "?"}
        </div>
      )}

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
            🤝 {common.length} skill{common.length > 1 ? "s" : ""} common
          </span>
        )}
        <h2 className="text-3xl font-bold leading-tight">
          {firstName || "Naam"} {lastName}
          {age ? <span className="ml-2 text-2xl font-normal">{age}</span> : null}
        </h2>
        {gender && <p className="text-sm capitalize text-white/70">{gender}</p>}
        {about && <p className="mt-2 line-clamp-2 text-sm text-white/90">{about}</p>}
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
          aria-label="Poori details"
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
