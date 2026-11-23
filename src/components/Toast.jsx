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
  return (
    <div className="toast toast-top toast-center z-[60]">
      <div
        className={`alert ${type === "error" ? "alert-error" : "alert-success"} text-white shadow-lg`}
      >
        <span>{message}</span>
      </div>
    </div>
  );
}
