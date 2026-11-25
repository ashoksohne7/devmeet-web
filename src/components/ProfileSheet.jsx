import { useEffect } from "react";
import PhotoFill from "./PhotoFill";

const COLOR = {
  key: "text-[#7aa2f7]",
  str: "text-[#9ece6a]",
  num: "text-[#ff9e64]",
  dim: "text-[#565f89]",
};
const T = ({ c, children }) => <span className={COLOR[c]}>{children}</span>;
const q = (v) => JSON.stringify(v);

export default function ProfileSheet({ user, mySkills = [], onClose, onChoose }) {
  const { firstName = "", lastName = "", age, gender, about, skills = [] } = user;
  const mine = new Set((mySkills || []).map((s) => s.toLowerCase()));
  const shared = skills.filter((s) => mine.has(s.toLowerCase()));
  const file =
    `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9-]+/g, "") || "profile";

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

  // the profile, written as the lines of a JSON file
  const rows = [];
  const add = (indent, content, hl = false) => rows.push({ indent, content, hl });

  add(0, <T c="dim">{"{"}</T>);
  const fields = [["name", <T c="str">{q(`${firstName} ${lastName}`.trim())}</T>]];
  if (age) fields.push(["age", <T c="num">{age}</T>]);
  if (gender) fields.push(["gender", <T c="str">{q(gender)}</T>]);
  if (about) fields.push(["about", <T c="str">{q(about)}</T>]);
  fields.forEach(([k, v]) =>
    add(1, <><T c="key">{q(k)}</T><T c="dim">: </T>{v}<T c="dim">,</T></>)
  );
  add(1, <><T c="key">{q("stack")}</T><T c="dim">: [</T></>);
  skills.forEach((s, i) => {
    const isShared = mine.has(s.toLowerCase());
    add(
      2,
      <>
        <T c="str">{q(s)}</T>
        {i < skills.length - 1 && <T c="dim">,</T>}
        {isShared && <T c="dim">{"  // in common"}</T>}
      </>,
      isShared
    );
  });
  add(1, <T c="dim">]</T>);
  add(0, <T c="dim">{"}"}</T>);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-base-100 shadow-2xl ring-1 ring-base-300 sm:rounded-2xl"
        style={{ animation: "sheet-up 280ms ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto">
          <div className="relative aspect-[16/10] w-full bg-base-300">
            <PhotoFill user={user} textSize="text-7xl" />
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-md bg-black/60 px-3 py-1 text-sm text-white backdrop-blur hover:bg-black/80"
            >
              Close
            </button>
          </div>

          <div className="flex border-y border-base-300 bg-base-300/60 font-mono text-xs">
            <span className="border-t-2 border-primary bg-base-200 px-4 py-2">{file}.json</span>
          </div>

          <div className="bg-base-200 py-3 pr-4 font-mono text-[13px] leading-6">
            {rows.map((r, i) => (
              <div key={i} className={`flex ${r.hl ? "bg-primary/10" : ""}`}>
                <span className="w-10 shrink-0 select-none pr-3 text-right text-[#565f89]">
                  {i + 1}
                </span>
                <span
                  className="min-w-0 whitespace-pre-wrap break-words"
                  style={{ paddingLeft: `${r.indent * 1.25}rem` }}
                >
                  {r.content}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between bg-primary px-3 py-1 font-mono text-xs text-primary-content">
          <span>{shared.length ? `${shared.length} in common` : "No skills in common yet"}</span>
          <span>JSON · UTF-8</span>
        </div>

        <div className="flex items-center justify-center gap-8 border-t border-base-300 bg-base-100 py-4">
          <button
            aria-label="Pass"
            onClick={() => onChoose("left")}
            className="btn btn-circle btn-lg h-16 w-16 border-0 bg-base-200 text-2xl text-rose-400 shadow-lg hover:scale-110 hover:bg-base-300"
          >
            ✕
          </button>
          <button
            aria-label="Like"
            onClick={() => onChoose("right")}
            className="btn btn-circle btn-lg h-16 w-16 border-0 bg-base-200 text-2xl text-emerald-400 shadow-lg hover:scale-110 hover:bg-base-300"
          >
            ♥
          </button>
        </div>
      </div>
    </div>
  );
}
