import { useEffect, useState } from "react";
import { initialsOf, gradientOf } from "../utils/avatar";

export default function Avatar({ user, size = "h-12 w-12", text = "text-base" }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [user?.photoUrl]);

  if (user?.photoUrl && !broken) {
    return (
      <img
        src={user.photoUrl}
        alt=""
        onError={() => setBroken(true)}
        className={`${size} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${size} ${text} flex shrink-0 items-center justify-center rounded-full font-bold text-white`}
      style={{ background: gradientOf(user) }}
    >
      {initialsOf(user)}
    </div>
  );
}
