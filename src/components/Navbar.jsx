import { useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../utils/api";
import { removeUser } from "../utils/userSlice";
import { clearFeed } from "../utils/feedSlice";
import { clearConnections } from "../utils/connectionsSlice";
import { addRequests, clearRequests } from "../utils/requestsSlice";
import Avatar from "./Avatar";

const LINKS = [
  { to: "/", label: "Feed", icon: "🔥", end: true },
  { to: "/requests", label: "Requests", icon: "💌" },
  { to: "/connections", label: "Connections", icon: "🤝" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function Navbar() {
  const user = useSelector((s) => s.user);
  const requests = useSelector((s) => s.requests);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const count = requests?.length || 0;

  // keep the Requests badge fresh (every 60s, only while the tab is visible)
  useEffect(() => {
    if (!user) return;
    const load = () => {
      if (document.hidden) return;
      api
        .get("/user/requests/recevied")
        .then((res) => dispatch(addRequests(res.data.data)))
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [user]);

  const logout = async () => {
    try {
      await api.post("/logout");
    } finally {
      dispatch(removeUser());
      dispatch(clearFeed());
      dispatch(clearConnections());
      dispatch(clearRequests());
      navigate("/login");
    }
  };

  return (
    <>
      <div className="navbar sticky top-0 z-30 border-b border-base-300 bg-base-100/95 backdrop-blur">
        <div className="flex-1">
          <Link to="/" className="flex items-center gap-1 px-3 text-2xl font-extrabold">
            <span>🔥</span>
            <span className="brand-text">devmeet</span>
          </Link>
        </div>

        {user && (
          <div className="flex items-center gap-1">
            <div className="hidden items-center gap-1 md:flex">
              {LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `btn btn-ghost btn-sm ${
                      isActive ? "font-bold text-primary" : "text-base-content/70"
                    }`
                  }
                >
                  {l.label}
                  {l.to === "/requests" && count > 0 && (
                    <span className="badge badge-primary badge-sm">{count}</span>
                  )}
                </NavLink>
              ))}
            </div>
            <Link to="/profile" className="mx-2">
              <Avatar user={user} size="h-9 w-9" text="text-sm" />
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>

      {user && (
        <div className="dock border-t border-base-300 bg-base-100 md:hidden">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                isActive ? "dock-active text-primary" : "text-base-content/60"
              }
            >
              <span className="indicator text-xl">
                {l.icon}
                {l.to === "/requests" && count > 0 && (
                  <span className="indicator-item badge badge-primary badge-xs">{count}</span>
                )}
              </span>
              <span className="dock-label">{l.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </>
  );
}
