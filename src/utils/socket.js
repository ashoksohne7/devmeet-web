import { io } from "socket.io-client";
import { api } from "./api";
import appStore from "./appStore";
import {
  setConnected,
  setOnlineList,
  setPresence,
  addUnread,
  resetChat,
  setLast,
  setLastMap,
  setUnreadMap,
} from "./chatSlice";

// Vercel rewrites cannot carry WebSockets, so the socket talks to the API directly.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? "http://localhost:7777" : "https://devmeet-api.onrender.com");

let socket = null;
let activeChat = null;
let presenceTimer = null;
let cleanups = [];
const listeners = new Map();

export const subscribe = (event, fn) => {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event)?.delete(fn);
};
const fire = (event, data) => listeners.get(event)?.forEach((fn) => fn(data));

export const setActiveChat = (id) => {
  activeChat = id;
};

// tell the server that everything from this person has been read
export const markRead = (peerId) => api.post(`/chat/${peerId}/read`).catch(() => {});

// last message and unread count of every chat (survives refresh)
export function loadChatSummary() {
  return api
    .get("/chat/summary")
    .then((r) => {
      const dispatch = appStore.dispatch;
      dispatch(setLastMap(r.data.data || []));
      const unread = { ...(r.data.unread || {}) };
      // the chat that is open right now is being read
      if (activeChat && !document.hidden) delete unread[activeChat];
      dispatch(setUnreadMap(unread));
    })
    .catch(() => {});
}

// ask the server who is online right now
export function refreshPresence() {
  if (!socket?.connected) return;
  socket.emit("presence:get", (ids) =>
    appStore.dispatch(setOnlineList(Array.isArray(ids) ? ids : []))
  );
}

export function connectSocket() {
  if (socket) return;
  const dispatch = appStore.dispatch;

  socket = io(SOCKET_URL, {
    // a fresh short-lived token is fetched on every (re)connect
    auth: (cb) => {
      api
        .get("/chat/token")
        .then((r) => cb({ token: r.data.token }))
        .catch(() => cb({ token: "" }));
    },
    transports: ["websocket", "polling"],
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
  });

  socket.on("connect", () => {
    dispatch(setConnected(true));
    refreshPresence();
    loadChatSummary(); // also catches messages received while we were offline
  });
  socket.on("disconnect", () => dispatch(setConnected(false)));
  socket.on("connect_error", () => {
    dispatch(setConnected(false));
    // a rejected handshake does not retry on its own
    if (socket && !socket.active) setTimeout(() => socket && socket.connect(), 5000);
  });
  socket.on("presence:update", (p) => dispatch(setPresence(p)));
  socket.on("message:new", (m) => {
    const me = appStore.getState().user?._id;
    const mine = m.fromUserId === me;
    const other = mine ? m.toUserId : m.fromUserId;

    // moves this conversation to the top of the list
    dispatch(setLast({ userId: other, text: m.text, createdAt: m.createdAt, fromMe: mine }));

    // it only counts as read if this chat is open AND the tab is visible
    const viewing = m.fromUserId === activeChat && !document.hidden;
    if (!mine && !viewing) dispatch(addUnread(m.fromUserId));
    fire("message:new", m);
  });
  socket.on("message:failed", (d) => {
    fire("message:failed", d);
    loadChatSummary(); // put the list preview and unread counts back in sync
  });
  socket.on("typing", (d) => fire("typing", d));

  // keep the online dots fresh even if a live event was missed
  presenceTimer = setInterval(() => {
    if (!document.hidden) refreshPresence();
  }, 30000);
  const onVisible = () => {
    if (!document.hidden) refreshPresence();
  };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", refreshPresence);
  cleanups = [
    () => document.removeEventListener("visibilitychange", onVisible),
    () => window.removeEventListener("focus", refreshPresence),
  ];
}

export function disconnectSocket() {
  if (!socket) return;
  clearInterval(presenceTimer);
  presenceTimer = null;
  cleanups.forEach((fn) => fn());
  cleanups = [];
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  activeChat = null;
  appStore.dispatch(resetChat());
}

export function sendMessage(to, text, clientId) {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) return reject(new Error("You are offline. Reconnecting…"));
    socket.timeout(8000).emit("message:send", { to, text, clientId }, (err, res) => {
      if (err) return reject(new Error("The server did not respond. Please try again."));
      if (!res?.ok) return reject(new Error(res?.error || "Message could not be sent."));
      resolve();
    });
  });
}

export function sendTyping(to, typing) {
  if (socket?.connected) socket.volatile.emit("typing", { to, typing });
}
