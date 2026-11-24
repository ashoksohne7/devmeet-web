import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  const swiped = useRef(new Set()); // ids swiped in this session

  // merge=true keeps current cards and appends new ones (no duplicates)
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

  // top up quietly when only a few cards are left
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
          // request failed: bring the card back
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
    <div className="flex flex-col items-center gap-6 px-4 py-6">
      {error && (
        <div role="alert" className="alert alert-error w-full max-w-sm py-2 text-sm text-white">
          <span>{error}</span>
          {(!feed || feed.length === 0) && (
            <button className="btn btn-sm btn-ghost" onClick={() => loadFeed(false)}>
              Retry
            </button>
          )}
        </div>
      )}

      {loadingCards && <span className="loading loading-spinner loading-lg mt-20 text-primary" />}

      {feed && feed.length === 0 && exhausted && (
        <div className="mt-16 text-center">
          <p className="text-lg font-semibold">You are all caught up</p>
          <p className="mt-1 text-sm opacity-60">
            There are no more developers to show right now. Check back soon.
          </p>
          <button className="btn btn-primary mt-5 rounded-full" onClick={() => loadFeed(false)}>
            Refresh
          </button>
        </div>
      )}

      {stack.length > 0 && (
        <>
          <div className="relative w-full max-w-sm" style={{ height: "min(68vh, 34rem)" }}>
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

          <div className="flex items-center gap-8">
            <button
              aria-label="Pass"
              className="btn btn-circle btn-lg h-16 w-16 border-0 bg-white text-2xl text-rose-500 shadow-lg hover:scale-110 hover:bg-white"
              onClick={() => swipe("left")}
            >
              ✕
            </button>
            <button
              aria-label="Like"
              className="btn btn-circle btn-lg h-16 w-16 border-0 bg-white text-2xl text-emerald-500 shadow-lg hover:scale-110 hover:bg-white"
              onClick={() => swipe("right")}
            >
              ♥
            </button>
          </div>
          <p className="text-xs opacity-50">
            Tap a card for details · Drag, flick or use the ← → keys to swipe
          </p>
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
