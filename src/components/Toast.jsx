import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideToast } from "../utils/toastSlice";

export default function Toast() {
  const { message, type, id } = useSelector((s) => s.toast);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => dispatch(hideToast()), 2800);
    return () => clearTimeout(t);
  }, [id]);

  if (!message) return null;
  const isError = type === "error";
  return (
    <div className="toast toast-top toast-center z-[60]">
      <div
        className={`flex items-center gap-2 rounded-lg border bg-base-100 px-4 py-2 font-mono text-sm shadow-xl ${
          isError ? "border-error/60 text-error" : "border-success/60 text-success"
        }`}
      >
        <span>{isError ? "✗" : "✓"}</span>
        <span className="text-base-content">{message}</span>
      </div>
    </div>
  );
}
