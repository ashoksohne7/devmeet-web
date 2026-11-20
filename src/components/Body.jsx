import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../utils/api";
import { addUser } from "../utils/userSlice";
import Navbar from "./Navbar";

export default function Body() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((s) => s.user);

  useEffect(() => {
    if (user) return;
    api
      .get("/profile/view")
      .then((res) => dispatch(addUser(res.data)))
      .catch(() => {
        if (location.pathname !== "/login") navigate("/login");
      });
  }, []);

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <Outlet />
    </div>
  );
}
