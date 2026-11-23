export const initialsOf = (u) =>
  `${u?.firstName?.[0] || ""}${u?.lastName?.[0] || ""}`.toUpperCase() || "?";

export const gradientOf = (u) => {
  const hue =
    [...`${u?.firstName || ""}${u?.lastName || ""}`].reduce(
      (a, c) => a + c.charCodeAt(0),
      0
    ) % 360;
  return `linear-gradient(160deg, hsl(${hue} 70% 45%), hsl(${(hue + 60) % 360} 70% 28%))`;
};
