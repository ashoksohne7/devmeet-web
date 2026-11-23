import axios from "axios";
import appStore from "./appStore";
import { showToast } from "./toastSlice";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.response.use((res) => {
  const url = res.config?.url || "";
  const msg = res.data?.message;
  if (
    typeof msg === "string" &&
    (url.includes("/profile/edit") || url.includes("/request/review"))
  ) {
    appStore.dispatch(showToast({ message: msg }));
  }
  return res;
});

// backend kabhi string, kabhi {message} bhejta hai
export const getError = (err) => {
  const d = err?.response?.data;
  if (!d) return err?.message || "Something went wrong";
  if (typeof d === "string") return d;
  return d.message || "Something went wrong";
};
