import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api, getError } from "../utils/api";
import { addConnections } from "../utils/connectionsSlice";

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
      <h1 className="mb-4 text-2xl font-bold">Connections</h1>

      {error && <p className="text-error">{error}</p>}
      {!connections && !error && (
        <span className="loading loading-spinner loading-lg" />
      )}
      {connections && connections.length === 0 && (
        <p className="opacity-70">
          Abhi koi connection nahi hai. Feed me developers ko Interested karo.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {connections?.map((c) => (
          <div key={c._id} className="card card-side bg-base-100 shadow">
            <div className="flex w-20 items-center justify-center bg-base-300 text-2xl font-bold opacity-60">
              {c.photoUrl ? (
                <img src={c.photoUrl} alt={c.firstName} className="h-full w-full object-cover" />
              ) : (
                `${c.firstName?.[0] || ""}${c.lastName?.[0] || ""}`.toUpperCase()
              )}
            </div>
            <div className="card-body p-4">
              <h2 className="card-title text-base">
                {c.firstName} {c.lastName}
              </h2>
              {(c.age || c.gender) && (
                <p className="text-sm opacity-70">
                  {[c.age, c.gender].filter(Boolean).join(", ")}
                </p>
              )}
              {c.about && <p className="text-sm">{c.about}</p>}
              {c.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {c.skills.map((s) => (
                    <span key={s} className="badge badge-outline badge-sm">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
