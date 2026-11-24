import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../utils/api";
import { addUser } from "../utils/userSlice";
import { connectSocket, disconnectSocket } from "../utils/socket";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Toast from "./Toast";

export default function Body() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((s) => s.user);
  const isLogin = location.pathname === "/login";
  const isChat = location.pathname.startsWith("/chat");

  useEffect(() => {
    if (user) return;
    api
      .get("/profile/view")
      .then((res) => dispatch(addUser(res.data)))
      .catch(() => {
        if (location.pathname !== "/login") navigate("/login");
      });
  }, []);

  useEffect(() => {
    if (user?._id) connectSocket();
    else disconnectSocket();
  }, [user?._id]);

  if (isLogin) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundImage: "linear-gradient(135deg, #fd267a, #ff6036)" }}
      >
        <Outlet />
        <Toast />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isChat && <Footer />}
      <Toast />
      <div className="h-16 md:hidden" />
    </div>
  );
}
