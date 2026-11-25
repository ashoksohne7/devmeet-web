import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { GitMerge, GitPullRequest, X } from "lucide-react";
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
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <GitPullRequest className="text-success" size={24} />
          Pull requests
          {requests?.length ? (
            <span className="badge badge-primary">{requests.length}</span>
          ) : null}
        </h1>
        <p className="mt-1 font-mono text-xs opacity-60">
          {"// developers who want to connect with you"}
        </p>
      </div>

      {error && <p className="mb-3 text-error">{error}</p>}
      {!requests && !error && (
        <p className="font-mono text-sm opacity-70">
          <span className="text-secondary">$</span> gh pr list<span className="caret">_</span>
        </p>
      )}
      {requests && requests.length === 0 && (
        <div className="rounded-xl border border-dashed border-base-300 py-12 text-center font-mono text-sm opacity-70">
          <p>{"// no open pull requests"}</p>
          <p className="mt-1 text-xs">Keep swiping, they will show up here.</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {requests?.map((r) => {
          const u = r.fromUserId || {};
          return (
            <div key={r._id} className="overflow-hidden rounded-xl border border-base-300 bg-base-100">
              <div className="flex items-center gap-2 border-b border-base-300 bg-base-300/40 px-4 py-2 font-mono text-xs">
                <GitPullRequest size={14} className="text-success" />
                <span className="text-success">Open</span>
                <span className="opacity-60">· wants to connect</span>
              </div>

              <div className="flex items-center gap-4 p-4">
                <Avatar user={u} size="h-16 w-16" text="text-xl" />
                <div className="min-w-0">
                  <p className="font-semibold">
                    {u.firstName} {u.lastName}
                    {u.age ? <span className="ml-2 font-mono text-sm opacity-60">{u.age}</span> : null}
                  </p>
                  {u.about && <p className="truncate text-sm opacity-70">{u.about}</p>}
                  {u.skills?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {u.skills.slice(0, 4).map((s) => (
                        <span key={s} className="rounded-md bg-base-300 px-2 py-0.5 font-mono text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-base-300 px-4 py-3">
                <button
                  className="btn btn-sm btn-outline"
                  disabled={busyId === r._id}
                  onClick={() => review("rejected", r)}
                >
                  <X size={14} /> Close
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  disabled={busyId === r._id}
                  onClick={() => review("accepted", r)}
                >
                  <GitMerge size={14} /> Merge
                </button>
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
