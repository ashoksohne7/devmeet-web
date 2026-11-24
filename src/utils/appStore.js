import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import feedReducer from "./feedSlice";
import connectionsReducer from "./connectionsSlice";
import requestsReducer from "./requestsSlice";
import toastReducer from "./toastSlice";
import chatReducer from "./chatSlice";

export default configureStore({
  reducer: {
    user: userReducer,
    feed: feedReducer,
    connections: connectionsReducer,
    requests: requestsReducer,
    toast: toastReducer,
    chat: chatReducer,
  },
});
