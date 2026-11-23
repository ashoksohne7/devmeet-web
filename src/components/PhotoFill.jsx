import { useEffect, useState } from "react";
import { initialsOf, gradientOf } from "../utils/avatar";

export default function PhotoFill({ user, textSize = "text-8xl" }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [user?.photoUrl]);

  if (user?.photoUrl && !broken) {
    return (
      <img
        src={user.photoUrl}
        alt={user.firstName || "Profile photo"}
        draggable={false}
        onError={() => setBroken(true)}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${textSize} font-bold text-white/80`}
      style={{ background: gradientOf(user) }}
    >
      {initialsOf(user)}
    </div>
  );
}
