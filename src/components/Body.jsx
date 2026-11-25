import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../utils/api";
import { addUser } from "../utils/userSlice";
import { connectSocket, disconnectSocket, refreshPresence } from "../utils/socket";
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

  // opening a page or a chat refreshes who is online
  useEffect(() => {
    if (user?._id) refreshPresence();
  }, [location.pathname]);

  if (isLogin) {
    return (
      <div className="dev-grid min-h-screen">
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
