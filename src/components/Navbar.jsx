import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../utils/api";
import { removeUser } from "../utils/userSlice";
import { clearFeed } from "../utils/feedSlice";
import { clearConnections } from "../utils/connectionsSlice";
import { clearRequests } from "../utils/requestsSlice";

export default function Navbar() {
  const user = useSelector((s) => s.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
    <div className="navbar bg-base-100 shadow">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl">👩‍💻 DevMeet</Link>
      </div>
      {user && (
        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/profile" className="btn btn-ghost btn-sm">Profile</Link>
          <Link to="/connections" className="btn btn-ghost btn-sm">Connections</Link>
          <Link to="/requests" className="btn btn-ghost btn-sm">Requests</Link>
          <span className="hidden px-2 sm:block">Hi, {user.firstName}</span>
          <button className="btn btn-sm btn-outline" onClick={logout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
