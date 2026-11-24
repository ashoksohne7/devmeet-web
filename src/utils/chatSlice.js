import { createSlice } from "@reduxjs/toolkit";

const initial = { online: {}, unread: {}, connected: false };

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
    resetChat: () => initial,
  },
});

export const { setConnected, setOnlineList, setPresence, addUnread, clearUnread, resetChat } =
  chatSlice.actions;
export default chatSlice.reducer;
