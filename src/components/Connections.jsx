import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api, getError } from "../utils/api";
import { addConnections } from "../utils/connectionsSlice";
import Avatar from "./Avatar";

export default function Connections() {
  const connections = useSelector((s) => s.connections);
  const user = useSelector((s) => s.user);
  const dispatch = useDispatch();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api
      .get("/user/connections")
      .then((res) => dispatch(addConnections(res.data.data)))
      .catch((err) => setError(getError(err)));
  }, [user]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">
        Connections {connections?.length ? `(${connections.length})` : ""}
      </h1>

      {error && <p className="text-error">{error}</p>}
      {!connections && !error && <span className="loading loading-spinner loading-lg" />}
      {connections && connections.length === 0 && (
        <div className="py-16 text-center opacity-70">
          <p className="text-4xl">🤝</p>
          <p className="mt-2">No connections yet. Swipe right on developers in your feed to get started.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {connections?.map((c) => (
          <div key={c._id} className="card bg-base-100 shadow">
            <div className="card-body flex-row items-center gap-4 p-4">
              <Avatar user={c} size="h-20 w-20" text="text-2xl" />
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">
                  {c.firstName} {c.lastName}
                  {c.age ? <span className="ml-2 text-base font-normal opacity-70">{c.age}</span> : null}
                </h2>
                {c.about && <p className="truncate text-sm opacity-70">{c.about}</p>}
                {c.skills?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.skills.slice(0, 5).map((s) => (
                      <span key={s} className="badge badge-outline badge-sm">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
