import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { api, getError } from "../utils/api";
import { addRequests, removeRequest } from "../utils/requestsSlice";
import Avatar from "./Avatar";
import MatchModal from "./MatchModal";

export default function Requests() {
  const requests = useSelector((s) => s.requests);
  const user = useSelector((s) => s.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [match, setMatch] = useState(null);

  useEffect(() => {
    if (!user) return;
    api
      .get("/user/requests/recevied") // backend me spelling "recevied" hai
      .then((res) => dispatch(addRequests(res.data.data)))
      .catch((err) => setError(getError(err)));
  }, [user]);

  const review = async (status, r) => {
    setBusyId(r._id);
    setError("");
    try {
      await api.post(`/request/review/${status}/${r._id}`);
      dispatch(removeRequest(r._id));
      if (status === "accepted") setMatch(r.fromUserId);
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">
        Requests {requests?.length ? `(${requests.length})` : ""}
      </h1>

      {error && <p className="mb-3 text-error">{error}</p>}
      {!requests && !error && <span className="loading loading-spinner loading-lg" />}
      {requests && requests.length === 0 && (
        <div className="py-16 text-center opacity-70">
          <p className="text-4xl">💌</p>
          <p className="mt-2">No pending requests right now.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {requests?.map((r) => {
          const u = r.fromUserId || {};
          return (
            <div key={r._id} className="card bg-base-100 shadow">
              <div className="card-body gap-3 p-4">
                <div className="flex items-center gap-4">
                  <Avatar user={u} size="h-16 w-16" text="text-xl" />
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {u.firstName} {u.lastName}
                      {u.age ? <span className="ml-1 font-normal opacity-70">{u.age}</span> : null}
                    </p>
                    {u.about && <p className="truncate text-sm opacity-70">{u.about}</p>}
                    {u.skills?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {u.skills.slice(0, 4).map((s) => (
                          <span key={s} className="badge badge-outline badge-sm">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    className="btn btn-sm btn-outline"
                    disabled={busyId === r._id}
                    onClick={() => review("rejected", r)}
                  >
                    Reject
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={busyId === r._id}
                    onClick={() => review("accepted", r)}
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {match && (
        <MatchModal
          me={user}
          other={match}
          onKeep={() => {
            setMatch(null);
            navigate("/");
          }}
          onView={() => {
            setMatch(null);
            navigate("/connections");
          }}
        />
      )}
    </div>
  );
}
