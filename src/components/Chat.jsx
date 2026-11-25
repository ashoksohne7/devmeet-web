import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { api, getError } from "../utils/api";
import { addConnections } from "../utils/connectionsSlice";
import { clearUnread } from "../utils/chatSlice";
import {
  loadChatSummary,
  markRead,
  sendMessage,
  sendTyping,
  setActiveChat,
  subscribe,
} from "../utils/socket";
import Avatar from "./Avatar";

const byTime = (a, b) =>
  new Date(a.createdAt) - new Date(b.createdAt) || a._id.localeCompare(b._id);

const merge = (a, b) => {
  const map = new Map();
  [...a, ...b].forEach((m) => map.set(m._id, m));
  return [...map.values()].sort(byTime);
};

const timeOf = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const dayOf = (d) => {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

function Conversation({ peer, me, onBack }) {
  const dispatch = useDispatch();
  const connected = useSelector((s) => s.chat.connected);
  const isOnline = useSelector((s) => !!s.chat.online[peer._id]);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const stick = useRef(true);
  const anchor = useRef(null);
  const typingTimer = useRef(null);
  const stopTimer = useRef(null);
  const lastTyping = useRef(0);
  const pending = useRef(new Set()); // temporary ids still waiting for the server echo

  // mark this chat as the one being read
  useEffect(() => {
    setActiveChat(peer._id);
    dispatch(clearUnread(peer._id));
    markRead(peer._id);
    // coming back to this tab counts as reading
    const onVisible = () => {
      if (!document.hidden) {
        dispatch(clearUnread(peer._id));
        markRead(peer._id);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      setActiveChat(null);
    };
  }, [peer._id]);

  // history
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/chat/${peer._id}`)
      .then((res) => {
        if (cancelled) return;
        setMessages((prev) => merge(res.data.data, prev));
        setHasMore(res.data.hasMore);
      })
      .catch((err) => !cancelled && setError(getError(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [peer._id]);

  // live events
  useEffect(() => {
    const offMsg = subscribe("message:new", (m) => {
      if (m.fromUserId !== peer._id && m.toUserId !== peer._id) return;
      setMessages((prev) => {
        // the real message replaces our temporary bubble
        const base = m.clientId ? prev.filter((x) => x._id !== `tmp-${m.clientId}`) : prev;
        return merge(base, [m]);
      });
      if (m.clientId) pending.current.delete(`tmp-${m.clientId}`);
      if (m.fromUserId === peer._id) {
        setTyping(false);
        // short delay so the server has finished saving it before we mark it read
        setTimeout(() => {
          if (!document.hidden) markRead(peer._id);
        }, 1000);
      }
    });
    const offFail = subscribe("message:failed", (d) => {
      setMessages((prev) => prev.filter((x) => x._id !== d._id));
      if (d.notice) setError("A message could not be delivered. Please try again.");
    });
    const offTyping = subscribe("typing", (d) => {
      if (d.from !== peer._id) return;
      setTyping(d.typing);
      clearTimeout(typingTimer.current);
      if (d.typing) typingTimer.current = setTimeout(() => setTyping(false), 4000);
    });
    return () => {
      offMsg();
      offFail();
      offTyping();
      clearTimeout(typingTimer.current);
      clearTimeout(stopTimer.current);
    };
  }, [peer._id]);

  // scrolling
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (anchor.current != null) {
      el.scrollTop = el.scrollHeight - anchor.current;
      anchor.current = null;
    } else if (stick.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, typing, loading]);

  const onScroll = () => {
    const el = listRef.current;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const loadEarlier = async () => {
    const first = messages.find((m) => !m.pending);
    const el = listRef.current;
    if (!first || !el) return;
    anchor.current = el.scrollHeight - el.scrollTop;
    try {
      const res = await api.get(
        `/chat/${peer._id}?before=${encodeURIComponent(first.createdAt)}`
      );
      setMessages((prev) => merge(res.data.data, prev));
      setHasMore(res.data.hasMore);
    } catch (err) {
      anchor.current = null;
      setError(getError(err));
    }
  };

  const onType = (e) => {
    setText(e.target.value);
    setError("");
    const now = Date.now();
    if (now - lastTyping.current > 1000) {
      lastTyping.current = now;
      sendTyping(peer._id, true);
    }
    clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      lastTyping.current = 0;
      sendTyping(peer._id, false);
    }, 1500);
  };

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !connected) return;

    // show the message immediately, the server confirms it a moment later
    const clientId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const tempId = `tmp-${clientId}`;
    const temp = {
      _id: tempId,
      clientId,
      fromUserId: me._id,
      toUserId: peer._id,
      text: t,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    pending.current.add(tempId);
    setError("");
    setText("");
    stick.current = true;
    setMessages((prev) => merge(prev, [temp]));
    clearTimeout(stopTimer.current);
    lastTyping.current = 0;
    sendTyping(peer._id, false);
    inputRef.current?.focus();

    try {
      await sendMessage(peer._id, t, clientId);
    } catch (err) {
      // roll back only if the server echo has not already replaced the temporary bubble
      if (pending.current.delete(tempId)) {
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        setText((cur) => cur || t);
        setError(err.message);
      }
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-base-300 px-3 py-3">
        <button className="btn btn-ghost btn-sm btn-circle md:hidden" onClick={onBack} aria-label="Back">
          ←
        </button>
        <Avatar user={peer} size="h-10 w-10" text="text-sm" />
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {peer.firstName} {peer.lastName}
          </p>
          <p className={`font-mono text-xs ${isOnline ? "text-emerald-400" : "opacity-60"}`}>
            {typing ? "typing…" : isOnline ? "● online" : "○ offline"}
          </p>
        </div>
      </div>

      {!connected && (
        <div className="bg-warning/20 px-3 py-1 text-center text-xs">
          Connecting… the first connection can take up to a minute.
        </div>
      )}

      <div ref={listRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {loading && <span className="loading loading-spinner mx-auto block text-primary" />}

        {!loading && hasMore && (
          <button className="btn btn-ghost btn-xs mx-auto mb-3 block" onClick={loadEarlier}>
            Load earlier messages
          </button>
        )}

        {!loading && messages.length === 0 && (
          <p className="py-10 text-center text-sm opacity-60">
            No messages yet. Say hi to {peer.firstName}.
          </p>
        )}

        {messages.map((m, i) => {
          const mine = m.fromUserId === me._id;
          const newDay = i === 0 || dayOf(messages[i - 1].createdAt) !== dayOf(m.createdAt);
          return (
            <div key={m._id}>
              {newDay && (
                <p className="my-3 text-center text-xs opacity-50">{dayOf(m.createdAt)}</p>
              )}
              <div className={`mb-1.5 flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "rounded-br-md text-white"
                      : "rounded-bl-md border border-base-300 bg-base-200"
                  } ${m.pending ? "opacity-70" : ""}`}
                  style={mine ? { backgroundImage: "var(--accent-grad)" } : undefined}
                >
                  {m.text}
                  <span className={`ml-2 text-[10px] ${mine ? "text-white/70" : "opacity-50"}`}>
                    {m.pending ? "sending…" : timeOf(m.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {typing && <p className="mt-1 text-xs opacity-60">{peer.firstName} is typing…</p>}
      </div>

      {error && <p role="alert" className="px-4 pb-1 text-sm text-error">{error}</p>}

      <form onSubmit={send} className="flex items-center gap-2 border-t border-base-300 p-3">
        <input
          ref={inputRef}
          value={text}
          onChange={onType}
          maxLength={1000}
          autoComplete="off"
          placeholder="Type a message"
          className="input input-bordered flex-1"
        />
        <button type="submit" className="btn btn-primary" disabled={!text.trim() || !connected}>
          Send
        </button>
      </form>
    </div>
  );
}

const shortTime = (d) => {
  const date = new Date(d);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { day: "numeric", month: "short" });
};

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const me = useSelector((s) => s.user);
  const connections = useSelector((s) => s.connections);
  const online = useSelector((s) => s.chat.online);
  const unread = useSelector((s) => s.chat.unread);
  const last = useSelector((s) => s.chat.last);
  const [listError, setListError] = useState("");

  useEffect(() => {
    if (!me || connections) return;
    api
      .get("/user/connections")
      .then((res) => dispatch(addConnections(res.data.data)))
      .catch((err) => setListError(getError(err)));
  }, [me]);

  useEffect(() => {
    if (me) loadChatSummary();
  }, [me?._id]);

  // most recent conversation first; chats without messages keep their order at the bottom
  const sorted = useMemo(() => {
    if (!connections) return null;
    return connections
      .map((c, i) => ({
        c,
        i,
        t: last[c._id] ? new Date(last[c._id].createdAt).getTime() : 0,
      }))
      .sort((a, b) => b.t - a.t || a.i - b.i)
      .map((x) => x.c);
  }, [connections, last]);

  if (!me) return null;

  const peer = connections?.find((c) => c._id === userId);

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-5xl overflow-hidden bg-base-100 md:my-4 md:h-[calc(100dvh-6.5rem)] md:rounded-2xl md:border md:border-base-300 md:shadow">
      {/* conversation list */}
      <div
        className={`${
          userId ? "hidden md:flex" : "flex"
        } w-full flex-col border-r border-base-300 md:w-80`}
      >
        <h1 className="border-b border-base-300 px-4 py-3 text-lg font-bold">Messages</h1>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {listError && <p className="p-4 text-sm text-error">{listError}</p>}
          {!connections && !listError && (
            <span className="loading loading-spinner mx-auto mt-8 block text-primary" />
          )}
          {connections?.length === 0 && (
            <div className="p-6 text-center text-sm opacity-70">
              <p>You have no connections yet.</p>
              <Link to="/" className="btn btn-primary btn-sm mt-3">
                Find developers
              </Link>
            </div>
          )}
          {sorted?.map((c) => {
            const l = last[c._id];
            const n = unread[c._id] || 0;
            return (
              <Link
                key={c._id}
                to={`/chat/${c._id}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-base-200 ${
                  c._id === userId ? "bg-base-200" : ""
                }`}
              >
                <div className="relative">
                  <Avatar user={c} size="h-12 w-12" />
                  {online[c._id] && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-base-100 bg-emerald-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`truncate ${n > 0 ? "font-bold" : "font-semibold"}`}>
                      {c.firstName} {c.lastName}
                    </p>
                    {l && (
                      <span className="shrink-0 text-[11px] opacity-50">
                        {shortTime(l.createdAt)}
                      </span>
                    )}
                  </div>
                  <p
                    className={`truncate text-xs ${
                      n > 0 ? "font-semibold opacity-90" : "opacity-60"
                    }`}
                  >
                    {l
                      ? `${l.fromMe ? "You: " : ""}${l.text}`
                      : online[c._id]
                      ? "Online"
                      : "No messages yet"}
                  </p>
                </div>
                {n > 0 && <span className="badge badge-primary badge-sm">{n}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* conversation */}
      <div className={`${userId ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
        {peer ? (
          <Conversation key={peer._id} peer={peer} me={me} onBack={() => navigate("/chat")} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <p className="text-4xl">💬</p>
            <p className="mt-2 font-semibold">
              {userId && connections ? "This conversation is not available." : "Select a conversation"}
            </p>
            <p className="text-sm opacity-60">Chats open with your connections.</p>
          </div>
        )}
      </div>
    </div>
  );
}
