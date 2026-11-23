import axios from "axios";
import appStore from "./appStore";
import { showToast } from "./toastSlice";
import { removeUser } from "./userSlice";

// Old accounts were created with this placeholder bio. Hide it everywhere.
const LEGACY_ABOUT = "this is the deafault about of user";

const scrub = (v) => {
  if (Array.isArray(v)) return v.map(scrub);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v).map(([k, val]) => [
        k,
        k === "about" &&
        typeof val === "string" &&
        val.trim().toLowerCase() === LEGACY_ABOUT
          ? ""
          : scrub(val),
      ])
    );
  }
  return v;
};

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => {
    res.data = scrub(res.data);
    const url = res.config?.url || "";
    const msg = res.data?.message;
    if (
      typeof msg === "string" &&
      (url.includes("/profile/edit") || url.includes("/request/review"))
    ) {
      appStore.dispatch(showToast({ message: msg }));
    }
    return res;
  },
  (err) => {
    // session expired or missing -> back to login
    if (err.response?.status === 401 && window.location.pathname !== "/login") {
      appStore.dispatch(removeUser());
      window.location.replace("/login");
    }
    return Promise.reject(err);
  }
);

export const getError = (err) => {
  if (!err?.response) {
    return "Unable to reach the server. Check your connection and try again.";
  }
  if ([502, 503, 504].includes(err.response.status)) {
    return "The server is starting up. Please wait a few seconds and try again.";
  }
  const d = err.response.data;
  let msg = typeof d === "string" ? d : d?.message;
  if (!msg) return "Something went wrong. Please try again.";
  if (/E11000/.test(msg)) return "An account with this email already exists.";
  msg = msg
    .replace(/^(Error saving the user\s*:|ERROR\s*:)\s*/i, "")
    .replace(/\s*!+\s*$/, "")
    .trim();
  return msg ? msg.charAt(0).toUpperCase() + msg.slice(1) : "Something went wrong.";
};
