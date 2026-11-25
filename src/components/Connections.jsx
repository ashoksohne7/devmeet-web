import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MessageSquare } from "lucide-react";
import { api, getError } from "../utils/api";
import { addConnections } from "../utils/connectionsSlice";
import Avatar from "./Avatar";

export default function Connections() {
  const connections = useSelector((s) => s.connections);
  const user = useSelector((s) => s.user);
  const online = useSelector((s) => s.chat.online);
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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          Connections
          {connections?.length ? <span className="badge badge-primary">{connections.length}</span> : null}
        </h1>
        <p className="mt-1 font-mono text-xs opacity-60">{"// developers you have merged with"}</p>
      </div>

      {error && <p className="text-error">{error}</p>}
      {!connections && !error && (
        <p className="font-mono text-sm opacity-70">
          <span className="text-secondary">$</span> git remote -v<span className="caret">_</span>
        </p>
      )}
      {connections && connections.length === 0 && (
        <div className="rounded-xl border border-dashed border-base-300 py-12 text-center font-mono text-sm opacity-70">
          <p>{"// no connections yet"}</p>
          <p className="mt-1 text-xs">Merge with developers in your feed to see them here.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {connections?.map((c) => {
          const isOnline = !!online[c._id];
          return (
            <div
              key={c._id}
              className="flex flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 transition hover:border-primary/60 hover:shadow-[0_0_24px_rgba(122,162,247,0.15)]"
            >
              <div className="flex items-center gap-4 p-4">
                <div className="relative">
                  <Avatar user={c} size="h-16 w-16" text="text-xl" />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-base-100 bg-emerald-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">
                    {c.firstName} {c.lastName}
                    {c.age ? <span className="ml-2 font-mono text-sm font-normal opacity-60">{c.age}</span> : null}
                  </h2>
                  <p className={`font-mono text-xs ${isOnline ? "text-emerald-400" : "opacity-50"}`}>
                    {isOnline ? "● online" : "○ offline"}
                  </p>
                </div>
              </div>

              <div className="flex-1 px-4 pb-4">
                {c.about && <p className="line-clamp-2 text-sm opacity-70">{c.about}</p>}
                {c.skills?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.skills.slice(0, 5).map((s) => (
                      <span key={s} className="rounded-md bg-base-300 px-2 py-0.5 font-mono text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-base-300 p-3">
                <Link to={`/chat/${c._id}`} className="btn btn-primary btn-sm w-full">
                  <MessageSquare size={14} /> Message
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
