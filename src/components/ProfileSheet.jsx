import { useEffect } from "react";
import PhotoFill from "./PhotoFill";

export default function ProfileSheet({ user, mySkills = [], onClose, onChoose }) {
  const { firstName = "", lastName = "", age, gender, about, skills = [] } = user;
  const mine = new Set((mySkills || []).map((s) => s.toLowerCase()));
  const common = skills.filter((s) => mine.has(s.toLowerCase()));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-base-100 shadow-2xl sm:rounded-3xl"
        style={{ animation: "sheet-up 280ms ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto">
          <div className="relative aspect-[4/5] w-full bg-base-300">
            <PhotoFill user={user} />
            <button
              aria-label="Close"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-xl text-white shadow-lg"
              style={{ backgroundImage: "linear-gradient(135deg, #fd267a, #ff6036)" }}
            >
              ⌄
            </button>
          </div>

          <div className="space-y-5 p-5 pb-6">
            <div>
              <h2 className="break-words text-3xl font-bold">
                {firstName} {lastName}
                {age ? (
                  <span className="ml-2 text-2xl font-normal text-base-content/60">{age}</span>
                ) : null}
              </h2>
              {gender && <p className="text-sm capitalize text-base-content/60">{gender}</p>}
            </div>

            {common.length > 0 && (
              <div className="rounded-2xl bg-pink-50 p-3 text-sm text-pink-700">
                🤝 You both know: <b>{common.join(", ")}</b>
              </div>
            )}

            {about && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-base-content/60">About</h3>
                <p className="whitespace-pre-wrap break-words leading-relaxed">{about}</p>
              </div>
            )}

            {skills.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-base-content/60">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => {
                    const shared = mine.has(s.toLowerCase());
                    return (
                      <span
                        key={s}
                        className={`rounded-full px-3 py-1 text-sm ${
                          shared ? "font-semibold text-white" : "border border-base-300 text-base-content/80"
                        }`}
                        style={shared ? { backgroundImage: "linear-gradient(135deg, #fd267a, #ff6036)" } : undefined}
                      >
                        {s}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 border-t border-base-300 bg-base-100 py-4">
          <button
            aria-label="Pass"
            onClick={() => onChoose("left")}
            className="btn btn-circle btn-lg h-16 w-16 border-0 bg-white text-2xl text-rose-500 shadow-lg hover:scale-110 hover:bg-white"
          >
            ✕
          </button>
          <button
            aria-label="Like"
            onClick={() => onChoose("right")}
            className="btn btn-circle btn-lg h-16 w-16 border-0 bg-white text-2xl text-emerald-500 shadow-lg hover:scale-110 hover:bg-white"
          >
            ♥
          </button>
        </div>
      </div>
    </div>
  );
}
