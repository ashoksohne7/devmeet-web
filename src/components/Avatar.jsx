export default function Avatar({ user, size = "h-12 w-12", text = "text-base" }) {
  const { firstName = "", lastName = "", photoUrl } = user || {};
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  const hue = [...`${firstName}${lastName}`].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={firstName}
        className={`${size} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${size} ${text} flex shrink-0 items-center justify-center rounded-full font-bold text-white`}
      style={{
        background: `linear-gradient(160deg, hsl(${hue} 70% 45%), hsl(${(hue + 60) % 360} 70% 28%))`,
      }}
    >
      {initials || "?"}
    </div>
  );
}
