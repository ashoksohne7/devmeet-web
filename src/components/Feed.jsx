import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api, getError } from "../utils/api";
import { addFeed, removeFromFeed } from "../utils/feedSlice";
import UserCard from "./UserCard";

export default function Feed() {
  const feed = useSelector((s) => s.feed);
  const user = useSelector((s) => s.user);
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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

  const sendRequest = async (status, id) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/request/send/${status}/${id}`);
      const wasLast = feed.length === 1;
      dispatch(removeFromFeed(id));
      if (wasLast) await loadFeed(); // backend already-seen users hide karta hai
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-8">
      {error && (
        <div role="alert" className="alert alert-error w-full max-w-sm">
          <span>{error}</span>
        </div>
      )}

      {!feed && !error && <span className="loading loading-spinner loading-lg" />}

      {feed && feed.length === 0 && (
        <p className="py-10 text-center opacity-70">
          Abhi koi naya developer nahi hai. Thodi der baad wapas aao.
        </p>
      )}

      {feed && feed.length > 0 && (
        <UserCard user={feed[0]} onAction={sendRequest} disabled={busy} />
      )}
    </div>
  );
}
