import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api, getError } from "../utils/api";
import { addRequests, removeRequest } from "../utils/requestsSlice";

export default function Requests() {
  const requests = useSelector((s) => s.requests);
  const user = useSelector((s) => s.user);
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!user) return;
    api
      .get("/user/requests/recevied") // backend me spelling "recevied" hai
      .then((res) => dispatch(addRequests(res.data.data)))
      .catch((err) => setError(getError(err)));
  }, [user]);

  const review = async (status, requestId) => {
    setBusyId(requestId);
    setError("");
    try {
      await api.post(`/request/review/${status}/${requestId}`);
      dispatch(removeRequest(requestId));
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Requests</h1>

      {error && <p className="mb-3 text-error">{error}</p>}
      {!requests && !error && (
        <span className="loading loading-spinner loading-lg" />
      )}
      {requests && requests.length === 0 && (
        <p className="opacity-70">Abhi koi pending request nahi hai.</p>
      )}

      <div className="flex flex-col gap-3">
        {requests?.map((r) => (
          <div key={r._id} className="card bg-base-100 shadow">
            <div className="card-body flex-row items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-base-300 font-bold opacity-70">
                  {`${r.fromUserId?.firstName?.[0] || ""}${r.fromUserId?.lastName?.[0] || ""}`.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">
                    {r.fromUserId?.firstName} {r.fromUserId?.lastName}
                  </p>
                  <p className="text-sm opacity-60">wants to connect</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-outline"
                  disabled={busyId === r._id}
                  onClick={() => review("rejected", r._id)}
                >
                  Reject
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  disabled={busyId === r._id}
                  onClick={() => review("accepted", r._id)}
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
