import { createSlice } from "@reduxjs/toolkit";

const feedSlice = createSlice({
  name: "feed",
  initialState: null,
  reducers: {
    addFeed: (state, action) => action.payload,
    removeFromFeed: (state, action) =>
      (state || []).filter((u) => u._id !== action.payload),
    clearFeed: () => null,
  },
});

export const { addFeed, removeFromFeed, clearFeed } = feedSlice.actions;
export default feedSlice.reducer;
