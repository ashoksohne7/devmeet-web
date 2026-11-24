import { createSlice } from "@reduxjs/toolkit";

const initial = { online: {}, unread: {}, last: {}, connected: false };

const chatSlice = createSlice({
  name: "chat",
  initialState: initial,
  reducers: {
    setConnected: (s, a) => {
      s.connected = a.payload;
    },
    setOnlineList: (s, a) => {
      s.online = Object.fromEntries(a.payload.map((id) => [id, true]));
    },
    setPresence: (s, a) => {
      if (a.payload.online) s.online[a.payload.userId] = true;
      else delete s.online[a.payload.userId];
    },
    addUnread: (s, a) => {
      s.unread[a.payload] = (s.unread[a.payload] || 0) + 1;
    },
    clearUnread: (s, a) => {
      delete s.unread[a.payload];
    },
    // server is the source of truth for unread counts
    setUnreadMap: (s, a) => {
      s.unread = a.payload;
    },
    // always wins: this comes from a live message
    setLast: (s, a) => {
      const { userId, ...rest } = a.payload;
      s.last[userId] = rest;
    },
    // from the server summary: never overwrite something newer
    setLastMap: (s, a) => {
      for (const it of a.payload) {
        const cur = s.last[it.userId];
        if (!cur || new Date(cur.createdAt) <= new Date(it.createdAt)) {
          s.last[it.userId] = { text: it.text, createdAt: it.createdAt, fromMe: it.fromMe };
        }
      }
    },
    resetChat: () => initial,
  },
});

export const {
  setConnected,
  setOnlineList,
  setPresence,
  addUnread,
  clearUnread,
  setUnreadMap,
  setLast,
  setLastMap,
  resetChat,
} = chatSlice.actions;
export default chatSlice.reducer;
