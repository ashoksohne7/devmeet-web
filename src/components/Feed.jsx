import { useEffect, useState } from "react";
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

  const loadFeed = async () => {
    try {
      const res = await api.get("/feed?page=1&limit=10");
      dispatch(addFeed(res.data));
    } catch (err) {
      setError(getError(err));
    }
  };

  useEffect(() => {
    if (user && !feed) loadFeed();
  }, [user]);

  const swipe = (dir) => {
    if (leaving || !feed?.length) return;
    const target = feed[0];
    const isLast = feed.length === 1;
    setLeaving(dir);
    setTimeout(async () => {
      try {
        const status = dir === "right" ? "interested" : "ignored";
        await api.post(`/request/send/${status}/${target._id}`);
      } catch (err) {
        setError(getError(err));
      }
      dispatch(removeFromFeed(target._id));
      setLeaving(null);
      if (isLast) loadFeed();
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

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-6">
      {error && (
        <div role="alert" className="alert alert-error w-full max-w-sm py-2 text-sm text-white">
          <span>{error}</span>
        </div>
      )}

      {!feed && !error && <span className="loading loading-spinner loading-lg mt-20 text-primary" />}

      {feed && feed.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-5xl">🎉</p>
          <p className="mt-3 text-lg font-semibold">Tumne sabko dekh liya!</p>
          <p className="text-sm opacity-60">Naye developers aate hi yahan dikhenge.</p>
          <button className="btn btn-primary mt-5" onClick={loadFeed}>
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
              aria-label="Ignore"
              className="btn btn-circle btn-lg h-16 w-16 border-0 bg-white text-2xl text-rose-500 shadow-lg hover:scale-110 hover:bg-white"
              onClick={() => swipe("left")}
            >
              ✕
            </button>
            <button
              aria-label="Interested"
              className="btn btn-circle btn-lg h-16 w-16 border-0 bg-white text-2xl text-emerald-500 shadow-lg hover:scale-110 hover:bg-white"
              onClick={() => swipe("right")}
            >
              ♥
            </button>
          </div>
          <p className="text-xs opacity-50">
            Card pe tap karo = poori details · drag ya ← → = swipe
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
