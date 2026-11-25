import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GitMerge, X } from "lucide-react";
import { api, getError } from "../utils/api";
import { addFeed, removeFromFeed } from "../utils/feedSlice";
import SwipeCard from "./SwipeCard";
import ProfileSheet from "./ProfileSheet";

export default function Feed() {
  const feed = useSelector((s) => s.feed);
  const user = useSelector((s) => s.user);
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [exhausted, setExhausted] = useState(false);

  const feedRef = useRef(feed);
  feedRef.current = feed;
  const fetching = useRef(false);
  const swiped = useRef(new Set());

  const loadFeed = async (merge = false) => {
    if (fetching.current) return;
    fetching.current = true;
    setError("");
    if (!merge) setExhausted(false);
    try {
      const res = await api.get("/feed?page=1&limit=10");
      const incoming = (Array.isArray(res.data) ? res.data : []).filter(
        (u) => !swiped.current.has(u._id)
      );
      const current = merge ? feedRef.current || [] : [];
      const have = new Set(current.map((u) => u._id));
      const fresh = incoming.filter((u) => !have.has(u._id));
      dispatch(addFeed([...current, ...fresh]));
      setExhausted(fresh.length === 0);
    } catch (err) {
      setError(getError(err));
    } finally {
      fetching.current = false;
    }
  };

  useEffect(() => {
    if (user && !feed) loadFeed(false);
  }, [user]);

  useEffect(() => {
    if (user && feed && feed.length <= 3) loadFeed(true);
  }, [feed?.length]);

  const swipe = (dir) => {
    if (leaving || !feed?.length) return;
    const target = feed[0];
    swiped.current.add(target._id);
    setLeaving(dir);
    setTimeout(async () => {
      try {
        const status = dir === "right" ? "interested" : "ignored";
        await api.post(`/request/send/${status}/${target._id}`);
      } catch (err) {
        const msg = getError(err);
        if (!/already exists/i.test(msg)) {
          swiped.current.delete(target._id);
          setError(msg);
          setLeaving(null);
          return;
        }
      }
      setError("");
      dispatch(removeFromFeed(target._id));
      setLeaving(null);
    }, 280);
  };

  const choose = (dir) => {
    setShowDetail(false);
    setTimeout(() => swipe(dir), 150);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (showDetail) return;
      if (e.key === "ArrowRight") swipe("right");
      if (e.key === "ArrowLeft") swipe("left");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [feed, leaving, showDetail]);

  if (!user) return null;

  const stack = feed ? feed.slice(0, 3) : [];
  const loadingCards = !feed || (feed.length === 0 && !exhausted && !error);

  return (
    <div className="feed-glow flex min-h-[calc(100dvh-4rem)] flex-col items-center gap-5 px-4 py-6">
      <p className="font-mono text-xs text-base-content/50">
        <span className="text-secondary">$</span> ls ./developers
      </p>

      {error && (
        <div role="alert" className="alert alert-error w-full max-w-sm py-2 text-sm">
          <span>{error}</span>
          {(!feed || feed.length === 0) && (
            <button className="btn btn-sm btn-ghost" onClick={() => loadFeed(false)}>
              Retry
            </button>
          )}
        </div>
      )}

      {loadingCards && (
        <p className="mt-20 font-mono text-sm text-base-content/70">
          <span className="text-secondary">$</span> git fetch developers
          <span className="caret">_</span>
        </p>
      )}

      {feed && feed.length === 0 && exhausted && (
        <div className="mt-10 w-full max-w-sm overflow-hidden rounded-xl border border-base-300 bg-base-100 font-mono text-sm shadow-xl">
          <div className="border-b border-base-300 bg-base-300/60 px-4 py-2 text-xs opacity-70">
            terminal
          </div>
          <div className="space-y-1 p-4">
            <p>
              <span className="text-secondary">$</span> git pull
            </p>
            <p className="text-success">Already up to date.</p>
            <p className="pt-1 opacity-60">{"// no more developers in the queue"}</p>
          </div>
          <div className="px-4 pb-4">
            <button className="btn btn-primary btn-sm" onClick={() => loadFeed(false)}>
              Refresh
            </button>
          </div>
        </div>
      )}

      {stack.length > 0 && (
        <>
          <div className="relative w-full max-w-sm" style={{ height: "min(66vh, 34rem)" }}>
            {[...stack].reverse().map((u) => (
              <SwipeCard
                key={u._id}
                user={u}
                depth={stack.indexOf(u)}
                leaving={leaving}
                mySkills={user.skills}
                onSwipe={swipe}
                onTap={() => setShowDetail(true)}
              />
            ))}
          </div>

          <div className="flex items-start gap-12">
            <div className="flex flex-col items-center gap-1">
              <button aria-label="Skip" className="act-btn text-rose-400" onClick={() => swipe("left")}>
                <X size={28} strokeWidth={2.5} />
              </button>
              <span className="font-mono text-[11px] text-base-content/50">skip</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button aria-label="Merge" className="act-btn text-emerald-400" onClick={() => swipe("right")}>
                <GitMerge size={28} strokeWidth={2.25} />
              </button>
              <span className="font-mono text-[11px] text-base-content/50">merge</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs text-base-content/50">
            <span><kbd className="kbd kbd-sm">←</kbd> skip</span>
            <span><kbd className="kbd kbd-sm">→</kbd> merge</span>
            <span><kbd className="kbd kbd-sm">tap</kbd> details</span>
          </div>
        </>
      )}

      {showDetail && feed?.length > 0 && (
        <ProfileSheet
          user={feed[0]}
          mySkills={user.skills}
          onClose={() => setShowDetail(false)}
          onChoose={choose}
        />
      )}
    </div>
  );
}
