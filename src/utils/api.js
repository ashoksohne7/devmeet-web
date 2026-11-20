import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// backend kabhi string, kabhi {message} bhejta hai
export const getError = (err) => {
  const d = err?.response?.data;
  if (!d) return err?.message || "Something went wrong";
  if (typeof d === "string") return d;
  return d.message || "Something went wrong";
};
