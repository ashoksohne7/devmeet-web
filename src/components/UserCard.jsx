export default function UserCard({ user, onAction, disabled }) {
  const { _id, firstName, lastName, age, gender, about, skills, photoUrl } = user;
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="card bg-base-100 w-full max-w-sm shadow-xl">
      <figure className="h-64 bg-base-300">
        {photoUrl ? (
          <img src={photoUrl} alt={firstName} className="h-full w-full object-cover" />
        ) : (
          <span className="text-6xl font-bold opacity-40">{initials || "?"}</span>
        )}
      </figure>

      <div className="card-body gap-2">
        <h2 className="card-title">
          {firstName} {lastName}
        </h2>
        {(age || gender) && (
          <p className="text-sm opacity-70">
            {[age, gender].filter(Boolean).join(", ")}
          </p>
        )}
        {about && <p>{about}</p>}

        {skills?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {skills.map((s) => (
              <span key={s} className="badge badge-outline">{s}</span>
            ))}
          </div>
        )}

        <div className="card-actions mt-3 justify-center gap-3">
          <button
            className="btn btn-outline"
            disabled={disabled}
            onClick={() => onAction("ignored", _id)}
          >
            Ignore
          </button>
          <button
            className="btn btn-primary"
            disabled={disabled}
            onClick={() => onAction("interested", _id)}
          >
            Interested
          </button>
        </div>
      </div>
    </div>
  );
}
