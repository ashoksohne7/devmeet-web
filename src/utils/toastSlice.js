import { createSlice } from "@reduxjs/toolkit";

const toastSlice = createSlice({
  name: "toast",
  initialState: { message: "", type: "success", id: 0 },
  reducers: {
    showToast: (s, a) => ({
      message: a.payload.message,
      type: a.payload.type || "success",
      id: s.id + 1,
    }),
    hideToast: (s) => ({ ...s, message: "" }),
  },
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice.reducer;
